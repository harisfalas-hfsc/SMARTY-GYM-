// THE single SmartyGym rule engine.
// Every per-exercise and per-workout rule is decided here. The exercise pool
// filter, the post-generation validator and the stored-workout audit all call
// these two entry points, so no rule can be applied by one and missed by another.
import * as D from "./doctrine";
import { prepAllowed, type PrepSection } from "./prep-vocabulary";
import type { Category, DifficultyLevel, Format } from "./spec";

export type RuleExercise = D.ExerciseLike & { id?: string; difficulty?: string | null; smarty_tags?: string[] | null };

export type ExerciseRuleContext = {
  category: Category;
  format: Format;
  level?: DifficultyLevel | null;
  /** Work = Main Workout / Finisher. Activation / Cool Down use the prep vocabulary. */
  section?: "work" | PrepSection;
  bodyweightOnly?: boolean;
};

export const MOMENTUM_CATEGORIES: Category[] = ["CARDIO", "CALORIE BURNING", "METABOLIC", "CHALLENGE"];

/** Every reason a single exercise is illegal in this context (empty = legal). */
export function exerciseRuleBreaks(e: RuleExercise, ctx: ExerciseRuleContext): string[] {
  const out: string[] = [];
  const section = ctx.section ?? "work";
  if (section !== "work") {
    if (!prepAllowed(e.name, section))
      out.push(section === "activation" ? `"${e.name}" is not an activation (mobility/stability) exercise.` : `"${e.name}" is not a cool-down stretch or mobility exercise.`);
    return out;
  }
  const push = (v: string | null) => { if (v) out.push(v); };
  push(D.humanRealismViolation(e));
  push(D.categoryExerciseViolation(e, ctx.category));
  if (ctx.category === "MICRO-WORKOUTS") push(D.microExerciseViolation(e));
  push(D.dynamicExerciseViolation(e, ctx.category, ctx.format));
  push(D.flowSpecialtyViolation(e, ctx.category, ctx.format));
  if (MOMENTUM_CATEGORIES.includes(ctx.category) && D.STATIC_HOLD_RE.test(e.name))
    out.push(`"${e.name}" is a static hold, which breaks the flow of a ${ctx.category} session.`);
  if (ctx.category === "MOBILITY & STABILITY" && D.PASSIVE_STRETCH_RE.test(e.name))
    out.push(`"${e.name}" is a passive stretch — it belongs in the Cool Down, not Mobility & Stability main work.`);
  if (ctx.level === "beginner" && (e.difficulty ?? "").toLowerCase() === "advanced")
    out.push(`"${e.name}" is advanced material, not for a Beginner session.`);
  if (ctx.bodyweightOnly && !/body ?weight/i.test(e.equipment ?? ""))
    out.push(`"${e.name}" is not a bodyweight exercise.`);
  return out;
}

export const isLegalExercise = (e: RuleExercise, ctx: ExerciseRuleContext) => exerciseRuleBreaks(e, ctx).length === 0;

export const isStaticHold = (name: string) => D.STATIC_HOLD_RE.test(name);

/** Positions held still — static holds and passive stretches — are dosed in time. */
export const isTimedPosition = (name: string) =>
  isStaticHold(name) || (D.PASSIVE_STRETCH_RE.test(name) && !/world'?s? greatest|dynamic|circles?|swings?|walk/i.test(name));

/** Holds (plank, wall sit, hollow …) and passive stretches must be dosed in time, never in reps. */
export function holdDoseViolation(name: string, line: string): string | null {
  if (!isTimedPosition(name)) return null;
  if (/\b\d+\s*(reps?|x)\b/i.test(line) && !/\b\d+\s*(sec|s|min)\b/i.test(line))
    return `"${name}" is a hold or stretch but is dosed in reps.`;
  return null;
}

/** Light categories are programmed in a few quality sets, never long set ladders. */
export const LIGHT_SET_CAP = 4;
export function doseRuleBreak(category: Category, line: string): string | null {
  if (category !== "RECOVERY" && category !== "MOBILITY & STABILITY") return null;
  const m = /\b(\d+)\s*sets?\b/i.exec(line);
  if (m && Number(m[1]) > LIGHT_SET_CAP) return `${category} is programmed in at most ${LIGHT_SET_CAP} sets per exercise.`;
  return null;
}

export const isCardioRhythm = (name: string) => D.CARDIO_RHYTHM_RE.test(name);

/** Workout-level rules over the work rows (Main + Finisher). */
export function workoutRuleBreaks(
  work: RuleExercise[],
  main: RuleExercise[],
  ctx: { category: Category; format: Format; level: DifficultyLevel },
  finisher: RuleExercise[] = work.slice(main.length),
): string[] {
  const out: string[] = [];
  const push = (v: string | null) => { if (v) out.push(v); };
  push(D.categoryFormatViolation(ctx.category, ctx.format));
  if (ctx.category === "CHALLENGE") push(D.challengeBalanceViolation(work, ctx.level));
  if (work.length) push(D.equipmentFamilyViolation(work, ctx.category, ctx.format));
  if (main.length) push(D.sequenceViolation(main, ctx.format));
  push(D.cardioDominanceViolation(main, ctx.category));
  for (const [label, block] of [["Main Workout", main], ["Finisher", finisher]] as const) {
    if (!block.length) continue;
    if (ctx.category === "CARDIO" && block.filter((e) => isCardioRhythm(e.name)).length / block.length < 0.6)
      out.push(`CARDIO ${label} must be mostly rhythmic aerobic work (runs, jacks, high knees, skips, step-ups), not strength moves.`);
    if (ctx.category === "CHALLENGE" && block.filter((e) => D.CORE_ISOLATION_RE.test(e.name)).length > 1)
      out.push(`CHALLENGE ${label} allows at most one isolated core exercise — a challenge is full-body work.`);
  }
  return out;
}
