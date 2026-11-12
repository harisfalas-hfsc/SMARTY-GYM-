// Client-safe Workout of the Day matching rules (ported from the old SMARTYGYM picker).
import { type CycleDay } from "@/lib/wod-cycle";

export type WodSlot = "BODYWEIGHT" | "EQUIPMENT" | "RECOVERY";

export type WodCandidate = {
  id: string;
  name: string;
  category: string;
  difficulty_stars: number;
  location: string | null;
  focus: string | null;
  is_visible: boolean;
  image_url: string | null;
  main_workout: string | null;
};

/** Training days get one bodyweight + one equipment workout; Recovery days get one. */
export function slotsForDay(day: CycleDay): WodSlot[] {
  return day.category === "RECOVERY" ? ["RECOVERY"] : ["BODYWEIGHT", "EQUIPMENT"];
}

/** Library level (1–3 stars) for the plan's difficulty. */
export function starsForDifficulty(difficulty: CycleDay["difficulty"]): number | null {
  if (difficulty === "Beginner") return 1;
  if (difficulty === "Intermediate") return 2;
  if (difficulty === "Advanced") return 3;
  return null;
}

export function slotForWorkout(w: Pick<WodCandidate, "category" | "location">): WodSlot {
  if (w.category === "RECOVERY") return "RECOVERY";
  return w.location === "anywhere" ? "BODYWEIGHT" : "EQUIPMENT";
}

/** WOD-only shared resistance pool; library categories remain unchanged. */
export function categoriesForDay(category: string): string[] {
  return category === "STRENGTH" || category === "MUSCLE BUILDING"
    ? ["STRENGTH", "MUSCLE BUILDING"]
    : [category];
}

/** Broad resistance-day focuses also recognise the library's specific muscle focuses. */
export function matchesDayFocus(workoutFocus: string | null, dayFocus: string): boolean {
  const focus = (workoutFocus ?? "").trim().toUpperCase();
  const target = dayFocus.trim().toUpperCase();
  const groups: Record<string, string[]> = {
    "LOWER BODY": ["LOWER BODY", "LEGS", "LEGS (FRONT)", "LEGS (BACK)", "QUADS", "HAMSTRINGS", "GLUTES", "CALVES"],
    "UPPER BODY": ["UPPER BODY", "CHEST", "BACK", "SHOULDERS", "ARMS", "BICEPS", "TRICEPS"],
    "FULL BODY": ["FULL BODY", "ALL BODY"],
  };
  return groups[target]?.includes(focus) ?? focus === target;
}

/** Every workout that may fill the slot (shared resistance category, exact level/equipment — no difficulty fallback). */
export function eligibleForSlot(pool: WodCandidate[], day: CycleDay, slot: WodSlot): WodCandidate[] {
  const stars = slot === "RECOVERY" ? null : starsForDifficulty(day.difficulty);
  return pool.filter(
    (w) =>
      w.is_visible &&
      categoriesForDay(day.category).includes(w.category) &&
      !!w.main_workout &&
      !!w.image_url &&
      slotForWorkout(w) === slot &&
      (stars === null || w.difficulty_stars === stars),
  );
}

/**
 * Exhaustion-first order: never-used workouts first (strength focus matches on
 * top, shuffled), then previously used ones, least-recently used first.
 */
export function candidatesForSlot(
  pool: WodCandidate[],
  day: CycleDay,
  slot: WodSlot,
  lastUsed: Map<string, string>,
  random: () => number = Math.random,
): WodCandidate[] {
  const eligible = eligibleForSlot(pool, day, slot);
  const shuffle = <T,>(a: T[]) => a.map((v) => [random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  const neverUsed = shuffle(eligible.filter((w) => !lastUsed.has(w.id)));
  const focus = day.strengthFocus?.toUpperCase();
  const prioritised = focus
    ? [...neverUsed.filter((w) => matchesDayFocus(w.focus, focus)), ...neverUsed.filter((w) => !matchesDayFocus(w.focus, focus))]
    : neverUsed;
  const recycled = eligible
    .filter((w) => lastUsed.has(w.id))
    .sort((a, b) => (lastUsed.get(a.id) ?? "").localeCompare(lastUsed.get(b.id) ?? ""));
  return [...prioritised, ...recycled];
}

export const SLOT_LABEL: Record<WodSlot, string> = {
  BODYWEIGHT: "Bodyweight",
  EQUIPMENT: "Equipment",
  RECOVERY: "Recovery",
};
