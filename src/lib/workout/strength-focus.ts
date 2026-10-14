// Strength focus rules: a Strength workout's focus label (e.g. "LOW PUSH & UPPER PULL")
// decides which movement groups may appear in its Main Workout and Finisher.
// Classification order (Coach Haris, Oct 2026): the coach's hand-classified
// priority movements (PRIORITY_MOVEMENT_PATTERN) first, then the exercise
// library's own muscle data (target muscle / body part), and the name regex
// only for rows the library gives no muscle for. On top of that, every focus
// has a muscle allowlist checked against the library row — so an exercise is
// only accepted when the library says it trains what the workout is about
// (a calf raise never enters CORE & GLUTES). Shared by the publish gate,
// audits, the generator pool and the validator.

import { PRIORITY_ALIASES, PRIORITY_MOVEMENT_PATTERN } from "./priority";

export type FocusGroup = "upper push" | "upper pull" | "lower push" | "lower pull" | "core" | "conditioning" | "other";

/** Library row fields the muscle classifier reads. A bare name is accepted for old callers. */
export type MuscleRow = { name: string; target_muscle?: string | null; body_part?: string | null };
type RowLike = string | MuscleRow;
const asRow = (r: RowLike): MuscleRow => (typeof r === "string" ? { name: r } : r);

const RULES: Array<[FocusGroup, RegExp]> = [
  ["core", /side bridge|side plank/i],
  ["conditioning", /climber|bear crawl|burpee|jump|jack|skater|sprint|high knee/i],
  ["lower pull", /leg curl|hamstring curl|nordic|inverse leg curl|deadlift|\brdl\b|romanian|good morning|swing|hip thrust|bridge|hip extension|back extension|hyperextension|superman|hip press|abduction|adduction|glute kickback|donkey|fire hydrant/i],
  ["lower push", /squat|leg press|lunge|step[- ]?up|leg extension|calf|hack|sissy|wall sit/i],
  ["core", /crunch|sit[- ]?up|plank|leg raise|knee raise|dead bug|bird dog|twist|side bridge|hollow|v[- ]?up|ab wheel|rollout|pallof|\bpike\b(?!.*push)/i],
  ["upper pull", /upright row|\brows?\b|pulldown|pull[- ]?down|pull[- ]?up|chin[- ]?up|rear delt|reverse fly|face pull|curl|shrug/i],
  ["upper push", /push[- ]?up|bench press|chest press|floor press|incline press|decline press|\bfly\b|flye|\bdips?\b|shoulder press|overhead press|military|arnold|lateral raise|front raise|triceps|pushdown|skull/i],
];

export function focusGroup(name: string): FocusGroup {
  return RULES.find(([, re]) => re.test(name))?.[0] ?? "other";
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const PULL_SHOULDER = /rear delt|reverse fly|face pull|upright row|\brows?\b|pull/i;
const GLUTE_PUSH = /squat|lunge|step[- ]?up|leg press|sissy|wall sit/i;

/** Movement group from the library's target muscle; null when the library has no muscle for it. */
export function muscleGroup(row: MuscleRow): FocusGroup | null {
  const m = norm(row.target_muscle);
  const n = row.name;
  if (!m) return null;
  if (/^(abs|obliques|hip flexors)$/.test(m)) return "core";
  if (m === "cardiovascular system") return "conditioning";
  if (/^(pectorals|triceps|serratus anterior)$/.test(m)) return "upper push";
  if (m === "delts") return PULL_SHOULDER.test(n) ? "upper pull" : "upper push";
  if (/^(lats|upper back|biceps|traps|forearms|levator scapulae)$/.test(m)) return "upper pull";
  if (/^(quads|calves|adductors)$/.test(m)) return "lower push";
  if (/^(hamstrings|abductors)$/.test(m)) return "lower pull";
  if (m === "glutes") return GLUTE_PUSH.test(n) ? "lower push" : "lower pull";
  if (m === "spine") return /bird dog|dead bug|plank|twist|crunch/i.test(n) ? "core" : "lower pull";
  return "other";
}

/** Coach-classified movements, keyed by lowercase coach name and library alias. */
let coachLookup: Map<string, FocusGroup[]> | null = null;
function coachPatterns(): Map<string, FocusGroup[]> {
  if (coachLookup) return coachLookup;
  coachLookup = new Map();
  for (const [coach, groups] of Object.entries(PRIORITY_MOVEMENT_PATTERN)) {
    const g = Array.isArray(groups) ? groups : [groups];
    coachLookup.set(coach.toLowerCase(), g);
    for (const alias of PRIORITY_ALIASES[coach] ?? []) {
      if (!coachLookup.has(alias.toLowerCase())) coachLookup.set(alias.toLowerCase(), g);
    }
  }
  return coachLookup;
}

/**
 * Every movement group an exercise belongs to. Compound movements (thrusters,
 * squat-to-press) return both groups; everything else returns one. Coach
 * classification → library muscle → name regex.
 */
export function focusGroups(input: RowLike): FocusGroup[] {
  const row = asRow(input);
  const classified = coachPatterns().get(row.name.trim().toLowerCase());
  if (classified) return classified;
  const byMuscle = muscleGroup(row);
  if (byMuscle && byMuscle !== "other") return [byMuscle];
  return [focusGroup(row.name)];
}

/** Glute-dominant names the coach accepts as glute work even when the library lists quads (lunges, split squats, step-ups, goblet/sumo squats). */
const GLUTE_DOMINANT = /hip thrust|bridge|kickback|clamshell|hip extension|abduction|lunge|split squat|step[- ]?up|deadlift|romanian|\brdl\b|swing|goblet squat|sumo|good morning|donkey|fire hydrant|pull[- ]?through/i;

/**
 * Library-muscle allowlist per focus (Coach Haris, 14 Oct 2026): what the
 * exercise's target muscle must be for it to belong in that focus at all.
 * Null = no muscle restriction beyond the movement groups.
 */
const MUSCLE_ALLOW: Record<string, (m: string, row: MuscleRow) => boolean> = {
  "CORE & GLUTES": (m, row) =>
    /^(abs|obliques|hip flexors|glutes|spine|abductors)$/.test(m) ||
    (m === "hamstrings" && GLUTE_DOMINANT.test(row.name)) ||
    (m === "quads" && GLUTE_DOMINANT.test(row.name) && !/front squat|hack|sissy|leg extension/i.test(row.name)),
  "UPPER BODY": (m) => /^(pectorals|triceps|serratus anterior|delts|lats|upper back|biceps|traps|forearms|levator scapulae)$/.test(m),
  "LOWER BODY": (m) => /^(quads|calves|adductors|abductors|glutes|hamstrings|spine)$/.test(m),
};
const CORE_MUSCLE = /^(abs|obliques|hip flexors)$/;

/**
 * Library-muscle legality of one exercise in a focus. Returns the problem, or
 * null when the library's muscle data fits (rows without muscle data pass —
 * the movement-group rules still apply to them).
 */
export function muscleFocusBreak(focus: string | null | undefined, input: RowLike, section: "main" | "finisher" = "main"): string | null {
  const row = asRow(input);
  const f = normFocus(focus);
  const allow = MUSCLE_ALLOW[f];
  const m = norm(row.target_muscle);
  if (!allow || !m) return null;
  if (allow(m, row)) return null;
  // Upper / Lower Body Finishers may carry core work (existing finisher rule).
  if (section === "finisher" && f !== "CORE & GLUTES" && CORE_MUSCLE.test(m)) return null;
  return `"${row.name}" trains ${m}, which is not part of a ${f} workout`;
}

type FocusRule = { main: FocusGroup[]; finisher: FocusGroup[]; need: FocusGroup[][] };

const UPPER: FocusGroup[] = ["upper push", "upper pull"];
const LOWER: FocusGroup[] = ["lower push", "lower pull"];

/** need: each inner list is one requirement — the Main Workout must contain at least one exercise from it (two when it has 4+ exercises and two requirements). */
export const FOCUS_RULES: Record<string, FocusRule> = {
  "LOW PUSH & UPPER PULL": { main: ["lower push", "upper pull"], finisher: ["lower push", "upper pull", "core"], need: [["lower push"], ["upper pull"]] },
  "LOW PULL & UPPER PUSH": { main: ["lower pull", "upper push"], finisher: ["lower pull", "upper push", "core"], need: [["lower pull"], ["upper push"]] },
  "UPPER BODY": { main: UPPER, finisher: [...UPPER, "core"], need: [["upper push"], ["upper pull"]] },
  "LOWER BODY": { main: LOWER, finisher: [...LOWER, "core"], need: [["lower push"], ["lower pull"]] },
  "CORE & GLUTES": { main: ["core", "lower pull", "lower push"], finisher: ["core", "lower pull", "lower push"], need: [["core"], ["lower pull"]] },
  "FULL BODY": { main: [...UPPER, ...LOWER, "core"], finisher: [...UPPER, ...LOWER, "core", "conditioning"], need: [UPPER, LOWER] },
};

export const normFocus = (focus: string | null | undefined) => (focus ?? "").trim().toUpperCase();

/** Rule breaks of a Strength workout's focus. Empty when no focus rule applies. */
export function focusBreaks(focus: string | null | undefined, main: RowLike[], finisher: RowLike[]): string[] {
  const rule = FOCUS_RULES[normFocus(focus)];
  if (!rule) return [];
  const out: string[] = [];
  for (const r of main) {
    const n = asRow(r).name;
    const g = focusGroups(r);
    if (!g.some((x) => rule.main.includes(x))) out.push(`"${n}" (${g.join(" + ")}) does not belong in a ${normFocus(focus)} Main Workout`);
    else { const mb = muscleFocusBreak(focus, r, "main"); if (mb) out.push(mb); }
  }
  for (const r of finisher) {
    const n = asRow(r).name;
    const g = focusGroups(r);
    if (!g.some((x) => rule.finisher.includes(x))) out.push(`"${n}" (${g.join(" + ")}) does not belong in a ${normFocus(focus)} Finisher`);
    else { const mb = muscleFocusBreak(focus, r, "finisher"); if (mb) out.push(mb); }
  }
  const min = main.length >= 4 && rule.need.length === 2 ? 2 : 1;
  for (const need of rule.need) {
    const have = main.filter((r) => focusGroups(r).some((g) => need.includes(g))).length;
    if (have < min) out.push(`${normFocus(focus)} Main Workout needs at least ${min} ${need.join(" / ")} exercise${min > 1 ? "s" : ""} (has ${have})`);
  }
  return out;
}
