// Finisher length rule (set by Haris Falas, 2026-10-13).
// Every Finisher lasts at least 12 min (Beginner), 15 min (Intermediate) or
// 20 min (Advanced), and the time it states must match its real math:
// rounds/sets × (work + rest). Client-safe: used by the generator, the
// publish gate / audit (smarty-compliance.ts) and the stored-workout repair.
import { parseWorkoutSteps, statedIntervals } from "./parse-steps";
import { isTimedPosition } from "./rules";

export const FINISHER_MIN_MINUTES: Record<1 | 2 | 3, number> = { 1: 12, 2: 15, 3: 20 };

export function finisherMinimumMinutes(stars: number): number {
  const s = Math.max(1, Math.min(3, Math.round(stars || 2))) as 1 | 2 | 3;
  return FINISHER_MIN_MINUTES[s];
}

/** [start, end) of the Finisher section in the workout HTML, or null. */
export function finisherRange(html: string): [number, number] | null {
  const bolt = html.indexOf("⚡");
  if (bolt < 0) return null;
  const start = html.lastIndexOf("<p", bolt);
  const cool = html.indexOf("🧘", bolt);
  const end = cool < 0 ? html.length : html.lastIndexOf("<p", cool);
  return [start < 0 ? bolt : start, end < 0 ? html.length : end];
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** The Finisher's intro text (outside its exercise list). */
function finisherIntro(html: string): string {
  const r = finisherRange(html);
  if (!r) return "";
  return stripTags(html.slice(r[0], r[1]).replace(/<ul[\s\S]*?<\/ul>/gi, " ").replace(/<li[\s\S]*?<\/li>/gi, " ")).toLowerCase();
}

/** Minutes the Finisher states for itself ("Total: 15 minutes", "5 minutes"), if any. */
export function finisherDeclaredMinutes(html: string): number | null {
  const m = finisherIntro(html).match(/\b(\d{1,3})\s*(?:-\s*)?(?:min|mins|minute|minutes)\b/);
  return m ? Number(m[1]) : null;
}

const toSec = (n: number, unit: string) => (/^m/i.test(unit) ? n * 60 : n);

/** Honest seconds of one prescription line: count × (work + rest). */
export function lineSeconds(prescription: string): number {
  const p = prescription.toLowerCase();
  // "rest 20 sec" or "20 sec rest"
  const REST_RE = /rest[^.;,\d]*?(\d+)\s*(sec|secs|seconds|s|min|mins|minutes)\b|(\d+)\s*(sec|secs|seconds|s|min|mins|minutes)\s+rest\b/;
  const restM = p.match(REST_RE);
  const rest = restM ? toSec(Number(restM[1] ?? restM[3]), (restM[2] ?? restM[4])!) : 0;
  const body = p.replace(new RegExp(REST_RE.source, "g"), " ");
  const sets = body.match(/\b(\d{1,2})\s*sets?\b/);
  const rounds = statedIntervals(body);
  const secM = body.match(/\b(\d{1,3})\s*(sec|secs|second|seconds|s)\b/);
  const minM = body.match(/\b(\d{1,2})\s*(min|mins|minute|minutes)\b/);
  const repsM = body.match(/\b(\d{1,3})\s*reps?\b/);
  const sides = /per side|each side|each leg|per leg/.test(body) ? 2 : 1;
  const work = secM ? Number(secM[1]) : minM ? Number(minM[1]) * 60 : repsM ? Number(repsM[1]) * 4 * sides : 30;
  const count = sets ? Number(sets[1]) : rounds ?? 1;
  return count * (work + rest);
}

/** Real seconds of the Finisher by its own math; null when there is none. */
export function finisherRealSeconds(html: string): number | null {
  if (!finisherRange(html)) return null;
  const steps = parseWorkoutSteps(html).filter((s) => s.section === "Finisher");
  if (!steps.length) return null;
  const intro = finisherIntro(html);
  const introRounds = Number(intro.match(/\b(\d{1,2})\s*rounds?\b/)?.[1] ?? 1);
  const stepOwnsCount = (p: string) => /\b\d{1,2}\s*(sets?|rounds?|intervals?)\b/i.test(p);
  let total = 0;
  for (const st of steps) {
    const s = lineSeconds(st.prescription);
    total += stepOwnsCount(st.prescription) ? s : s * introRounds;
  }
  // A clock-driven finisher (AMRAP / EMOM / time cap) lasts its stated clock.
  const declared = finisherDeclaredMinutes(html);
  if (declared && /amrap|emom|cap\b|as many/.test(intro)) return Math.max(total, declared * 60);
  return total;
}

/** Null when the Finisher meets its level minimum and its stated time adds up. */
export function finisherLengthIssue(html: string, stars: number): string | null {
  const real = finisherRealSeconds(html);
  if (real === null) return null;
  const min = finisherMinimumMinutes(stars);
  if (real < min * 60 - 30) return "Finisher shorter than the level minimum";
  const declared = finisherDeclaredMinutes(html);
  if (declared !== null && Math.abs(declared * 60 - real) > 90) return "Finisher time does not add up";
  return null;
}

export type FinisherExercise = { id: string; name: string };

const LIFTING = new Set(["STRENGTH", "MUSCLE BUILDING"]);

const p = (inner: string) => `<p class="tiptap-paragraph">${inner}</p>`;
const li = (inner: string) => `<ul class="tiptap-bullet-list"><li class="tiptap-list-item">${p(inner)}</li></ul>`;
const tok = (e: FinisherExercise) => `{{exercise:${e.id}:${e.name}}}`;

/**
 * Builds a Finisher that meets the level minimum with honest, simple math.
 * Lifting categories: straight sets (reps + 60 sec rest). Every other
 * category with a finisher: timed intervals, one minute each (work + rest).
 */
export function buildFinisherHtml(input: { category: string; stars: number; exercises: FinisherExercise[] }): { html: string; minutes: number } {
  const min = finisherMinimumMinutes(input.stars);
  const ex = input.exercises;
  const k = Math.max(1, ex.length);
  const stars = Math.max(1, Math.min(3, Math.round(input.stars || 2)));
  const blocks: string[] = [];

  if (LIFTING.has(input.category.toUpperCase())) {
    const reps = stars === 2 ? 12 : 10;
    const perSet = reps * 4 + 60;
    const sets = Math.max(2, Math.min(6, Math.ceil((min * 60) / (k * perSet))));
    const minutes = Math.round((k * sets * perSet) / 60);
    blocks.push(p(`⚡ <strong><u>Finisher (REPS &amp; SETS)</u></strong>`));
    blocks.push(p(`Complete all sets of one exercise before moving on. Rest 60 sec between sets. Total: about ${minutes} minutes.`));
    for (const e of ex) {
      const unit = isTimedPosition(e.name) ? `${reps * 4} sec` : `${reps} reps`;
      blocks.push(li(`${sets} sets × ${unit} ${tok(e)} — Rest 60 sec between sets.`));
    }
    return { html: blocks.join(p("")), minutes };
  }

  const [work, rest] = stars === 1 ? [30, 30] : stars === 2 ? [40, 20] : [45, 15];
  const rounds = Math.max(2, Math.ceil(min / k));
  const minutes = k * rounds;
  blocks.push(p(`⚡ <strong><u>Finisher (Intervals)</u></strong>`));
  blocks.push(p(`${work} sec work, ${rest} sec rest. Do all ${rounds} rounds of one exercise, then move to the next. Total: ${minutes} minutes.`));
  for (const e of ex) blocks.push(li(`${rounds} rounds × ${work} sec ${tok(e)} — rest ${rest} sec after each round.`));
  return { html: blocks.join(p("")), minutes };
}
