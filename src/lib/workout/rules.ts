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
  if (ctx.level === "beginner" && (e.difficulty ?? "").toLowerCase() === "advanced")
    out.push(`"${e.name}" is advanced material, not for a Beginner session.`);
  if (ctx.bodyweightOnly && !/body ?weight/i.test(e.equipment ?? ""))
    out.push(`"${e.name}" is not a bodyweight exercise.`);
  return out;
}

export const isLegalExercise = (e: RuleExercise, ctx: ExerciseRuleContext) => exerciseRuleBreaks(e, ctx).length === 0;

/** Holds (plank, wall sit, hollow …) must be dosed in time, never in reps. */
export function holdDoseViolation(name: string, line: string): string | null {
  if (!D.STATIC_HOLD_RE.test(name)) return null;
  if (/\b\d+\s*(reps?|x)\b/i.test(line) && !/\b\d+\s*(sec|s|min)\b/i.test(line))
    return `"${name}" is a hold but is dosed in reps.`;
  return null;
}

/** Workout-level rules over the work rows (Main + Finisher). */
export function workoutRuleBreaks(
  work: RuleExercise[],
  main: RuleExercise[],
  ctx: { category: Category; format: Format; level: DifficultyLevel },
): string[] {
  const out: string[] = [];
  const push = (v: string | null) => { if (v) out.push(v); };
  push(D.categoryFormatViolation(ctx.category, ctx.format));
  if (ctx.category === "CHALLENGE") push(D.challengeBalanceViolation(work, ctx.level));
  if (work.length) push(D.equipmentFamilyViolation(work, ctx.category, ctx.format));
  if (main.length) push(D.sequenceViolation(main, ctx.format));
  push(D.cardioDominanceViolation(main, ctx.category));
  return out;
}
