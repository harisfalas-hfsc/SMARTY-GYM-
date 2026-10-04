// THE single SmartyGym rule engine.
// Rule hierarchy when rules conflict: 1 safety/injury, 2 library legality,
// 3 category, 4 format, 5 equipment, 6 location, 7 focus, 8 difficulty,
// 9 human realism & flow, 10 priority preference, 11 variety. Priority is a
// preference inside the legal system and never overrides 1-9.
// Every per-exercise and per-workout rule is decided here. The exercise pool
// filter, the post-generation validator and the stored-workout audit all call
// these two entry points, so no rule can be applied by one and missed by another.
import * as D from "./doctrine";
import { isBodyweightEquipment, prepAllowed, type PrepSection } from "./prep-vocabulary";
import { isPilatesMainExercise, isTruePilatesMovement } from "./pilates-vocabulary";
import type { Category, DifficultyLevel, Format } from "./spec";

/** Work words that make a "stretch"-named exercise a dynamic movement (pike-to-cobra push-up, dynamic chest stretch). */
const MOVING_WORDS_RE = /\b(push-?up|press|jump|squat|lunge|row|curl|walk|crawl|plank|circles?|swings?|world'?s? greatest|dynamic|reach|march)\b/i;
export const isPassiveStretch = (name: string) =>
  D.PASSIVE_STRETCH_RE.test(name) && !MOVING_WORDS_RE.test(name) && !isTruePilatesMovement(name);

/** Plyometric / cardio drill vocabulary — conditioning, never Strength or Muscle Building work. */
const STRENGTH_BAN_RE =
  /\b(jump|jumping|bound|hop|hopping|burpee|plyo|plyometric|skater|sprint|jacks?|butt kicks?|high knees?|mountain climber|run|running|jog|jogging|skip|skipping|shuffle|march|inchworm|bird dog|crawl)\b/i;

/** Pilates is controlled mat work: no dumbbell curls, crawls or pike presses. */
const PILATES_EXTRA_BAN_RE = /\b(dumbbell|curl|crawl|crab walk|pike|press|roller)\b/i;

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
    if (e.equipment != null && !isBodyweightEquipment(e.equipment))
      out.push(`"${e.name}" uses ${e.equipment} — ${section === "activation" ? "Activation" : "Cool Down"} never uses equipment.`);
    return out;
  }
  // PILATES Main Workout: ONLY the 50 exercises on the SmartyGym Pilates list
  // (pilates-vocabulary.ts). The list is the whole vocabulary — nothing else is
  // legal, and every listed exercise is legal (difficulty still applies).
  if (ctx.category === "PILATES") {
    if (!isPilatesMainExercise(e))
      out.push(`"${e.name}" is not on the SmartyGym Pilates exercise list — Pilates main work uses only those 50 exercises.`);
    else if (ctx.level === "beginner" && (e.difficulty ?? "").toLowerCase() === "advanced")
      out.push(`"${e.name}" is advanced material, not for a Beginner session.`);
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
  if ((ctx.category === "MOBILITY & STABILITY" || ctx.category === "PILATES") && isPassiveStretch(e.name))
    out.push(`"${e.name}" is a passive stretch — it belongs in the Cool Down, not ${ctx.category} main work.`);
  if (ctx.category === "PILATES" && PILATES_EXTRA_BAN_RE.test(`${e.name} ${e.equipment ?? ""}`))
    out.push(`"${e.name}" is loaded, crawling or pressing work, which Pilates never uses.`);
  if ((ctx.category === "STRENGTH" || ctx.category === "MUSCLE BUILDING") && STRENGTH_BAN_RE.test(e.name))
    out.push(`"${e.name}" is a plyometric or cardio drill — ${ctx.category} work is controlled loaded or bodyweight strength.`);
  if ((ctx.category === "CARDIO" || ctx.category === "CHALLENGE") && D.CORE_ISOLATION_RE.test(e.name))
    out.push(`"${e.name}" is isolated core work — ${ctx.category} work is rhythmic or full-body movement.`);
  if (ctx.level === "beginner" && (e.difficulty ?? "").toLowerCase() === "advanced")
    out.push(`"${e.name}" is advanced material, not for a Beginner session.`);
  if (ctx.bodyweightOnly && !/body ?weight/i.test(e.equipment ?? ""))
    out.push(`"${e.name}" is not a bodyweight exercise.`);
  return out;
}

export const isLegalExercise = (e: RuleExercise, ctx: ExerciseRuleContext) => exerciseRuleBreaks(e, ctx).length === 0;

export const isStaticHold = (name: string) => D.STATIC_HOLD_RE.test(name);

/** Positions held still — static holds and passive stretches — are dosed in time. */
export const isTimedPosition = (name: string) => isStaticHold(name) || isPassiveStretch(name);

/** Holds (plank, wall sit, hollow …) and passive stretches must be dosed in time, never in reps. */
export function holdDoseViolation(name: string, line: string): string | null {
  if (!isTimedPosition(name)) return null;
  const dose = line.replace(/\brest\b[^.;,]*/gi, "");
  if (/\b\d+\s*(reps?|x)\b/i.test(dose) && !/\b\d+\s*(sec|s|min)\b/i.test(dose))
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

/** Words that make a "walk"/"run"/"march"/"bike" name something other than aerobic rhythm work. */
const NOT_RHYTHM_RE = /\b(glute bridge|bridge|farmers?|monster|sit|air bike|lunge|hands bike|split squat|crab|bear|duck)\b/i;
export const isCardioRhythm = (name: string) => D.CARDIO_RHYTHM_RE.test(name) && !NOT_RHYTHM_RE.test(name);

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
  // Human flow (hard): station continuity in Main and Finisher, no new equipment in the Finisher.
  push(D.stationFlowViolation(main, ctx.format, "Main Workout"));
  push(D.stationFlowViolation(finisher, ctx.format, "Finisher"));
  push(D.finisherFlowViolation(main, finisher, ctx.format));
  // Strength / Muscle Building Finisher is complementary accessory work, never a second workout.
  if ((ctx.category === "STRENGTH" || ctx.category === "MUSCLE BUILDING") && finisher.length && finisher.length >= main.length)
    out.push(`The ${ctx.category} Finisher must be shorter than the Main Workout — it complements it, never repeats it.`);
  push(D.cardioDominanceViolation(main, ctx.category));
  for (const [label, block] of [["Main Workout", main], ["Finisher", finisher]] as const) {
    if (!block.length) continue;
    if (ctx.category === "CARDIO" && block.filter((e) => !isCardioRhythm(e.name)).length > 1)
      out.push(`CARDIO ${label} must be rhythmic aerobic work (runs, jacks, high knees, skips, step-ups) — at most one strength-type move.`);
  }
  return out;
}

/** Activation is active mobility and stability: at most one passive stretch. */
export function activationRuleBreak(names: string[]): string | null {
  return names.filter(isPassiveStretch).length > 1
    ? "Activation is mostly passive stretching — it must be active mobility and stability work (one stretch at most)."
    : null;
}
