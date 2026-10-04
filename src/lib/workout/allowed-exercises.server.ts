// The default "liked" set: every library exercise the rule engine allows
// anywhere (any category, format, level, equipment mode, or prep section).
// The Exercise Library shows these as liked by default for every member and
// the admin; un-liking one stores a dislike, which the pool filter already
// removes from that member's generated workouts.
import { CATEGORIES, CATEGORY_FORMATS, type DifficultyLevel, type Format } from "./spec";
import { isLegalExercise, type RuleExercise, type ExerciseRuleContext } from "./rules";

const LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

// Micro Workouts are not offered, so they never contribute liked exercises.
const WORK_CONTEXTS: ExerciseRuleContext[] = CATEGORIES.filter((c) => c !== "MICRO-WORKOUTS").flatMap((category) =>
  (CATEGORY_FORMATS[category] ?? ([] as Format[])).flatMap((format) =>
    LEVELS.flatMap((level) => [
      { category, format, level, section: "work" as const, bodyweightOnly: true },
      { category, format, level, section: "work" as const, bodyweightOnly: false },
    ]),
  ),
);

// Prep sections ignore category/format — any valid values work.
const PREP_CONTEXTS: ExerciseRuleContext[] = [
  { category: "MOBILITY & STABILITY", format: "REPS & SETS", section: "activation" },
  { category: "MOBILITY & STABILITY", format: "REPS & SETS", section: "cooldown" },
];

/** Ids of every exercise legal in at least one rule context. */
export function computeAllowedExerciseIds(library: RuleExercise[]): Set<string> {
  const allowed = new Set<string>();
  for (const e of library) {
    if (!e.id) continue;
    if (
      PREP_CONTEXTS.some((ctx) => isLegalExercise(e, ctx)) ||
      WORK_CONTEXTS.some((ctx) => isLegalExercise(e, ctx))
    )
      allowed.add(e.id);
  }
  return allowed;
}
