// Strength focus rules: a Strength workout's focus label (e.g. "LOW PUSH & UPPER PULL")
// decides which movement groups may appear in its Main Workout and Finisher.
// Pure: classification is read from the exercise name only. Coach Haris's
// hand-classified priority movements (PRIORITY_MOVEMENT_PATTERN) win over the
// regex rules below.

import { PRIORITY_ALIASES, PRIORITY_MOVEMENT_PATTERN } from "./priority";

export type FocusGroup = "upper push" | "upper pull" | "lower push" | "lower pull" | "core" | "conditioning" | "other";

const RULES: Array<[FocusGroup, RegExp]> = [
  ["core", /side bridge|side plank/i],
  ["conditioning", /climber|bear crawl|burpee|jump|jack|skater|sprint|high knee/i],
  ["lower pull", /leg curl|hamstring curl|nordic|inverse leg curl|deadlift|\brdl\b|romanian|good morning|swing|hip thrust|bridge|hip extension|back extension|hyperextension|superman|hip press|abduction|adduction|glute kickback|donkey|fire hydrant/i],
  ["lower push", /squat|leg press|lunge|step[- ]?up|leg extension|calf|hack|sissy|wall sit/i],
  ["core", /crunch|sit[- ]?up|plank|leg raise|knee raise|dead bug|bird dog|twist|side bridge|hollow|v[- ]?up|ab wheel|rollout|pallof|\bpike\b(?!.*push)/i],
  ["upper pull", /upright row|\brows?\b|pulldown|pull[- ]?down|pull[- ]?up|chin[- ]?up|rear delt|reverse fly|face pull|curl|shrug/i],
  ["upper push", /push[- ]?up|bench press|chest press|floor press|\bfly\b|flye|\bdips?\b|shoulder press|overhead press|military|arnold|lateral raise|front raise|triceps|pushdown|skull/i],
];

export function focusGroup(name: string): FocusGroup {
  return RULES.find(([, re]) => re.test(name))?.[0] ?? "other";
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
export function focusBreaks(focus: string | null | undefined, main: string[], finisher: string[]): string[] {
  const rule = FOCUS_RULES[normFocus(focus)];
  if (!rule) return [];
  const out: string[] = [];
  for (const n of main) if (!rule.main.includes(focusGroup(n))) out.push(`"${n}" (${focusGroup(n)}) does not belong in a ${normFocus(focus)} Main Workout`);
  for (const n of finisher) if (!rule.finisher.includes(focusGroup(n))) out.push(`"${n}" (${focusGroup(n)}) does not belong in a ${normFocus(focus)} Finisher`);
  const min = main.length >= 4 && rule.need.length === 2 ? 2 : 1;
  for (const need of rule.need) {
    const have = main.filter((n) => need.includes(focusGroup(n))).length;
    if (have < min) out.push(`${normFocus(focus)} Main Workout needs at least ${min} ${need.join(" / ")} exercise${min > 1 ? "s" : ""} (has ${have})`);
  }
  return out;
}
