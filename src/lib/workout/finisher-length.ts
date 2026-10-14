// Finisher length rule (set by Haris Falas, 2026-10-13).
// Every Finisher lasts at least 12 min (Beginner), 15 min (Intermediate) or
// 20 min (Advanced), and the time it states must match its real math:
// rounds/sets × (work + rest). Client-safe: used by the generator, the
// publish gate / audit (smarty-compliance.ts) and the stored-workout repair.
import { parseWorkoutSteps, statedIntervals } from "./parse-steps";
import { isTimeDosed } from "./rules";

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
  // When every line states its own rounds, that math is the truth (no clock can pad it).
  const allCounted = steps.every((st) => stepOwnsCount(st.prescription));
  if (declared && !allCounted && /amrap|emom|cap\b|as many/.test(intro)) return Math.max(total, declared * 60);
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

/** Finisher formats per category, in order of preference (set by Haris Falas, 2026-10-13). */
export const FINISHER_FORMAT_PREFERENCE: Record<string, string[]> = {
  CARDIO: ["EMOM", "CIRCUIT"], // steady, repeatable pace
  "CALORIE BURNING": ["AMRAP", "TABATA"], // high output
  METABOLIC: ["EMOM", "TABATA"], // hard work with planned recovery
  CHALLENGE: ["FOR TIME", "AMRAP"], // a test to finish
};
const REST_BUILT = ["EMOM", "CIRCUIT", "TABATA"];
const CLOCK_TEST = new Set(["FOR TIME", "AMRAP"]);
const CATEGORY_LEGAL: Record<string, string[]> = {
  CARDIO: ["CIRCUIT", "EMOM", "FOR TIME", "AMRAP", "TABATA"],
  METABOLIC: ["CIRCUIT", "AMRAP", "EMOM", "FOR TIME", "TABATA"],
  "CALORIE BURNING": ["CIRCUIT", "TABATA", "AMRAP", "FOR TIME", "EMOM"],
  CHALLENGE: ["CIRCUIT", "TABATA", "AMRAP", "EMOM", "FOR TIME"],
};

/** The approved formats a Finisher of this category may carry. */
export function legalFinisherFormats(category: string): string[] {
  const c = category.toUpperCase();
  if (LIFTING.has(c)) return ["REPS & SETS"];
  return CATEGORY_LEGAL[c] ?? [];
}

/**
 * Deterministic Finisher format: the category's purpose decides the
 * candidates; then (1) never the Main Workout's own format, (2) Beginner gets
 * a format with built-in rest, Advanced prefers For Time / AMRAP, (3) Tabata
 * only when its 8 × 20/10 blocks (4 min each) reach the level minimum.
 */
export function chooseFinisherFormat(input: { category: string; stars: number; mainFormat?: string | null; exerciseCount: number }): string {
  const cat = input.category.toUpperCase();
  if (LIFTING.has(cat)) return "REPS & SETS";
  const stars = Math.max(1, Math.min(3, Math.round(input.stars || 2)));
  const main = (input.mainFormat ?? "").toUpperCase();
  const min = finisherMinimumMinutes(stars);
  const legal = legalFinisherFormats(cat);
  const fits = (f: string) => f !== "TABATA" || input.exerciseCount * 4 >= min;
  let c = (FINISHER_FORMAT_PREFERENCE[cat] ?? REST_BUILT).filter((f) => f !== main && fits(f) && legal.includes(f));
  if (stars === 1) c = c.filter((f) => REST_BUILT.includes(f));
  if (!c.length) c = REST_BUILT.filter((f) => legal.includes(f) && f !== main && fits(f));
  if (stars === 3) {
    const clock = c.find((f) => CLOCK_TEST.has(f));
    if (clock) return clock;
  }
  return c[0] ?? (main === "CIRCUIT" ? "EMOM" : "CIRCUIT");
}

/** The format named in the Finisher heading ("Finisher (EMOM)"), upper-cased; null when none. */
export function finisherHeadingFormat(html: string): string | null {
  const r = finisherRange(html);
  if (!r) return null;
  const m = stripTags(html.slice(r[0], r[1])).match(/finisher\s*\(([^)]+)\)/i);
  return m ? m[1]!.trim().toUpperCase() : null;
}

/** Null when the Finisher heading names one of the approved formats for the category. */
export function finisherFormatIssue(html: string, category: string): string | null {
  if (!finisherRange(html)) return null;
  const f = finisherHeadingFormat(html);
  return f && legalFinisherFormats(category).includes(f) ? null : "Finisher format not allowed";
}

const TIME_BASED_RE = /\b(run|sprints?|high knees|butt kicks|jumping jacks?|jump rope|battling ropes|ski step|quick feet|mountain climbers?|farmer'?s? (carry|walk)|crawl|back and forth step|swing 360)\b/i;

const LEVEL_DOSE: Record<1 | 2 | 3, { work: number; rest: number; reps: number }> = {
  1: { work: 30, rest: 30, reps: 10 },
  2: { work: 40, rest: 20, reps: 12 },
  3: { work: 45, rest: 15, reps: 15 },
};

/**
 * Builds a Finisher in one approved format that meets the level minimum with
 * honest, simple math. Lifting categories: REPS & SETS (60 sec rest).
 * Others: EMOM, CIRCUIT, TABATA, AMRAP or FOR TIME (chooseFinisherFormat).
 */
export function buildFinisherHtml(input: { category: string; stars: number; exercises: FinisherExercise[]; mainFormat?: string | null; format?: string }): { html: string; minutes: number; blocks: string[]; format: string } {
  const min = finisherMinimumMinutes(input.stars);
  const ex = input.exercises;
  const k = Math.max(1, ex.length);
  const stars = Math.max(1, Math.min(3, Math.round(input.stars || 2))) as 1 | 2 | 3;
  const blocks: string[] = [];
  const format = input.format ?? chooseFinisherFormat({ category: input.category, stars, mainFormat: input.mainFormat, exerciseCount: ex.length });
  const done = (minutes: number) => ({ html: blocks.join(p("")), minutes, blocks, format });

  if (format === "REPS & SETS") {
    const reps = stars === 2 ? 12 : 10;
    const perSet = reps * 4 + 60;
    // Strength finishers: 3–4 sets (Coach Haris); with 3+ exercises 4 sets always reach the level minimum.
    const sets = k >= 3 ? Math.max(3, Math.min(4, Math.ceil((min * 60) / (k * perSet)))) : Math.max(2, Math.min(6, Math.ceil((min * 60) / (k * perSet))));
    const minutes = Math.round((k * sets * perSet) / 60);
    blocks.push(p(`⚡ <strong><u>Finisher (REPS &amp; SETS)</u></strong>`));
    blocks.push(p(`Complete all sets of one exercise before moving on. Rest 60 sec between sets. Total: about ${minutes} minutes.`));
    for (const e of ex) {
      const unit = isTimeDosed(e.name) ? `${reps * 4} sec` : `${reps} reps`;
      blocks.push(li(`${sets} sets × ${unit} ${tok(e)} — Rest 60 sec between sets.`));
    }
    return done(minutes);
  }

  const { work, rest, reps } = LEVEL_DOSE[stars];
  // Locomotion, rhythm, carries and crawls are done for time; countable moves for reps.
  const unit = (e: FinisherExercise) => (isTimeDosed(e.name) || TIME_BASED_RE.test(e.name) ? `${work} sec` : `${reps} reps`);

  if (format === "TABATA") {
    const minutes = 4 * k;
    blocks.push(p(`⚡ <strong><u>Finisher (TABATA)</u></strong>`));
    blocks.push(p(`Each exercise: 8 rounds of 20 sec work, 10 sec rest. Then go straight to the next exercise. Total: ${minutes} minutes.`));
    for (const e of ex) blocks.push(li(`8 rounds × 20 sec ${tok(e)} — rest 10 sec after each round.`));
    return done(minutes);
  }

  if (format === "EMOM") {
    const rounds = Math.max(2, Math.ceil(min / k));
    const minutes = rounds * k;
    blocks.push(p(`⚡ <strong><u>Finisher (EMOM)</u></strong>`));
    blocks.push(p(`EMOM ${minutes} min. At the start of every minute do the next exercise in the list: ${work} sec work, then rest until the minute ends. Go through the list ${rounds} times.`));
    for (const e of ex) blocks.push(li(`${rounds} rounds × ${work} sec ${tok(e)} — rest ${rest} sec after each round.`));
    return done(minutes);
  }

  if (format === "CIRCUIT") {
    const rounds = Math.max(2, Math.ceil(min / k));
    const minutes = rounds * k;
    blocks.push(p(`⚡ <strong><u>Finisher (CIRCUIT)</u></strong>`));
    blocks.push(p(`${rounds} rounds. Do each exercise for ${work} sec, rest ${rest} sec, then move to the next. Total: ${minutes} minutes.`));
    for (const e of ex) blocks.push(li(`${rounds} rounds × ${work} sec ${tok(e)} — rest ${rest} sec after each exercise.`));
    return done(minutes);
  }

  if (format === "AMRAP") {
    blocks.push(p(`⚡ <strong><u>Finisher (AMRAP)</u></strong>`));
    blocks.push(p(`AMRAP ${min} min. Do as many rounds as you can of the list below, in order, with good form. Rest only when you need it.`));
    for (const e of ex) blocks.push(li(`${unit(e)} ${tok(e)}`));
    return done(min);
  }

  // FOR TIME: rounds sized so the honest round time reaches the minimum; the cap equals that time.
  const roundSec = ex.reduce((s, e) => s + lineSeconds(unit(e)), 0) || 60;
  const rounds = Math.max(2, Math.ceil((min * 60) / roundSec));
  const cap = Math.ceil((rounds * roundSec) / 60);
  blocks.push(p(`⚡ <strong><u>Finisher (FOR TIME)</u></strong>`));
  blocks.push(p(`${rounds} rounds for time: go through the list in order, then start the next round. Time cap: ${cap} minutes.`));
  for (const e of ex) blocks.push(li(`${rounds} rounds × ${unit(e)} ${tok(e)}`));
  return done(cap);
}
