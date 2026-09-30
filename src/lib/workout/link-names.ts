// Client-safe: links plain-text exercise lines to the exercise library and
// audits a workout for lines the player cannot play. Nothing is invented —
// a line is linked only when its name matches a library exercise exactly
// (after normalising case, hyphens, plurals and punctuation).
import { EXERCISE_TOKEN_RE, isLibraryId, stripHtml } from "./tokens";

export type LibraryEntry = { id: string; name: string };

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[-_/]/g, " ")
    .replace(/[^a-z0-9() ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
}

/** Extra spellings the old site used for exercises that exist in the library. */
const ALIASES: Record<string, string> = {
  "jumping jack": "jack jump (male)",
  "jumping jacks": "jack jump (male)",
  "bicycle crunch": "air bike",
  "wide-grip push-up": "wide hand push up",
  "wide grip push up": "wide hand push up",
  "wide push-up": "wide hand push up",
  "farmer's carry": "farmers walk",
  "farmer carry": "farmers walk",
  "world's greatest stretch": "world greatest stretch",
  "sphinx pose": "sphinx",
  "side bridge": "side bridge v. 2",
  "standing calf stretch": "standing calves calf stretch",
  "cervical side bend stretch": "neck side stretch",
  "spine stretch forward": "spine stretch",
};

export function buildLibraryIndex(lib: LibraryEntry[]): Map<string, LibraryEntry> {
  const idx = new Map<string, LibraryEntry>();
  const add = (k: string, e: LibraryEntry) => {
    if (k && !idx.has(k)) idx.set(k, e);
  };
  for (const e of lib) add(normName(e.name), e);
  // Variants without "(male)" / "v. 2" style suffixes, only when unambiguous.
  for (const e of lib) add(normName(e.name.replace(/\((male|female)\)/gi, "")), e);
  for (const [alias, target] of Object.entries(ALIASES)) {
    const e = idx.get(normName(target));
    if (e) add(normName(alias), e);
  }
  return idx;
}

const QTY = String.raw`(\d+(?:[.,]\d+)?(?![\d/])\s*(?:(?:sets?|rounds?)?\s*[x×]\s*\d+\s*)?(?:sets?|rounds?|reps?|rep|seconds?|secs?|sec|s|minutes?|mins?|min|m|meters?|metres?|calories?|cals?|cal|steps?|each( side| leg| arm)?|per side)?\b\.?)`;
const LEAD_QTY = new RegExp(`^(${QTY}\\s*(?:of\\s+)?)+`, "i");
const TRAIL_QTY = new RegExp(`(\\s*[x×]?\\s*${QTY})+$`, "i");

function candidates(text: string): string[] {
  const t = text.replace(/^[•*\s]+/, "").replace(/^(minute|min|round|station|block)\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/-(?=\d)/g, " - ");
  const clean = (x: string) => x.replace(/^(?:\/?\s*(?:each|per)\s+(?:side|leg|arm|direction)|\/\s*side)\s+/i, "").replace(/\s+(?:each|per)\s+(?:side|leg|arm|direction)$/i, "");
  const out = new Set<string>();
  const base = t.trim();
  const head = base.split(/\s[-–—:]\s|:\s|\s[-–—]|,|\(/)[0] ?? base;
  for (const c of [base, head, base.replace(LEAD_QTY, ""), head.replace(LEAD_QTY, ""), head.replace(TRAIL_QTY, ""), base.replace(LEAD_QTY, "").split(/\s[-–—:]\s|,|\(/)[0] ?? ""]) {
    const s = clean(clean(c.replace(LEAD_QTY, "")).replace(TRAIL_QTY, "").trim()).trim();
    if (s && s.split(/\s+/).length <= 8) out.add(s);
  }
  return [...out];
}

/** Best-guess exercise name of a plain line (used to group unmatched lines). */
export function primaryName(text: string): string {
  const c = candidates(text);
  return (c.length ? c.reduce((a, b) => (b.length < a.length ? b : a)) : text).toLowerCase();
}

/** Breathing drills are coaching cues, not library exercises. */
export function isBreathingCue(text: string): boolean {
  return /\bbreath(ing)?\b/i.test(text) && !/\d+\s*reps?\b/i.test(text.replace(/breath[\s\S]*/i, ""));
}

function matchLine(text: string, idx: Map<string, LibraryEntry>): { entry: LibraryEntry; name: string } | null {
  for (const c of candidates(text)) {
    const e = idx.get(normName(c));
    if (e) return { entry: e, name: c };
  }
  return null;
}

const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

/** Soft tissue section (🧽 … next heading) is plain text by design. */
function softTissueRange(html: string): [number, number] {
  const start = html.search(/🧽/);
  if (start === -1) return [-1, -1];
  const rest = html.slice(start);
  const end = rest.search(/🔥|💪|⚡|🧘/);
  return [start, end === -1 ? html.length : start + end];
}

/** Links every plain-text exercise list item that matches a library name. */
export function linkExerciseLines(html: string, idx: Map<string, LibraryEntry>): { html: string; linked: number } {
  if (!html) return { html, linked: 0 };
  const [s0, s1] = softTissueRange(html);
  let linked = 0;
  const out = html.replace(LI_RE, (full, inner: string, offset: number) => {
    if (offset >= s0 && offset < s1) return full;
    if (new RegExp(EXERCISE_TOKEN_RE.source).test(inner)) return full;
    if (/<(ul|ol|li)\b/i.test(inner)) return full;
    const text = stripHtml(inner);
    const hit = matchLine(text, idx);
    if (!hit) return full;
    // Replace the first literal occurrence of the matched name inside the markup.
    const re = new RegExp(hit.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (!re.test(inner)) return full;
    linked += 1;
    return full.replace(inner, inner.replace(re, `{{exercise:${hit.entry.id}:${hit.entry.name}}}`));
  });
  return { html: out, linked };
}

export type WorkoutIssue = { kind: "unlinked" | "bad-id" | "empty-section" | "no-exercises"; section: string; text: string };

const SECTION_MARKS: Array<[RegExp, string]> = [
  [/🧽/, "Soft Tissue Preparation"],
  [/🔥/, "Activation"],
  [/💪/, "Main Workout"],
  [/⚡/, "Finisher"],
  [/🧘/, "Cool Down"],
];

/** Lists every line the player cannot play as a library exercise. */
export function auditWorkoutHtml(html: string, libIds: Set<string>): WorkoutIssue[] {
  const issues: WorkoutIssue[] = [];
  if (!html) return [{ kind: "no-exercises", section: "Workout", text: "The workout has no content." }];
  const marks = SECTION_MARKS.map(([re, name]) => ({ name, at: html.search(re) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const sectionAt = (i: number) => {
    let name = "Main Workout";
    for (const m of marks) if (m.at <= i) name = m.name;
    return name;
  };
  const playable = new Map<string, number>();
  for (const m of marks) playable.set(m.name, 0);
  for (const m of html.matchAll(LI_RE)) {
    const inner = m[1] ?? "";
    if (/<(ul|ol|li)\b/i.test(inner)) continue;
    const section = sectionAt(m.index ?? 0);
    if (section === "Soft Tissue Preparation") continue;
    const tokens = [...inner.matchAll(new RegExp(EXERCISE_TOKEN_RE.source, "g"))];
    const text = stripHtml(inner).replace(new RegExp(EXERCISE_TOKEN_RE.source, "g"), "$2");
    if (!tokens.length) {
      if (text && !isBreathingCue(text)) issues.push({ kind: "unlinked", section, text });
      continue;
    }
    for (const t of tokens) {
      const id = t[1]!;
      if (!isLibraryId(id) || !libIds.has(id)) issues.push({ kind: "bad-id", section, text });
      else playable.set(section, (playable.get(section) ?? 0) + 1);
    }
  }
  for (const [section, n] of playable) {
    if (section !== "Soft Tissue Preparation" && n === 0) {
      issues.push({ kind: "empty-section", section, text: `${section} has no playable exercise.` });
    }
  }
  if ([...playable.values()].reduce((a, b) => a + b, 0) === 0 && !marks.length) {
    issues.push({ kind: "no-exercises", section: "Workout", text: "No playable exercise in this workout." });
  }
  return issues;
}
