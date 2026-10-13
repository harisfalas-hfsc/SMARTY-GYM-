// Exercise usage cap (set by Haris Falas, 2026-10-13): no single exercise may
// dominate a category. An exercise is "overused" once it appears in more than
// its fair share of that category's Smarty Workouts: 1.3 × (total exercise uses
// ÷ number of exercises available). Client-safe; read by the generator and audits.
import { parseWorkoutSteps } from "./parse-steps";

/** Distinct Main Workout + Finisher exercise ids of one workout. */
export function workExerciseIds(html: string): Set<string> {
  return new Set(
    parseWorkoutSteps(html ?? "")
      .filter((s) => s.section === "Main Workout" || s.section === "Finisher")
      .map((s) => s.exerciseId),
  );
}

/** How many workouts use each exercise. */
export function exerciseUsage(htmls: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of htmls) for (const id of workExerciseIds(h)) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

export const USAGE_FAIR_SHARE_FACTOR = 1.3;

/** The most workouts one exercise may appear in, given the category's usage and pool size. */
export function usageCap(totalUses: number, poolSize: number): number {
  return Math.max(1, Math.ceil((USAGE_FAIR_SHARE_FACTOR * totalUses) / Math.max(1, poolSize)));
}

/** Ids at or above their cap (only ids from the given pool are considered). */
export function overusedExerciseIds(htmls: string[], poolIds: string[]): Set<string> {
  const usage = exerciseUsage(htmls);
  const pool = new Set(poolIds);
  let total = 0;
  for (const [id, n] of usage) if (pool.has(id)) total += n;
  const cap = usageCap(total, pool.size);
  return new Set([...usage].filter(([id, n]) => pool.has(id) && n >= cap).map(([id]) => id));
}
