import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import type { SmartyWorkout } from "@/lib/smarty-workouts.functions";

/** Present a ready workout through the same page and player members use. */
export function smartyToWorkoutRow(w: SmartyWorkout): WorkoutRow {
  return {
    id: w.id,
    name: w.name,
    category: w.category,
    format: w.format,
    focus: w.focus,
    difficulty_stars: w.difficulty_stars,
    difficulty_label: null,
    duration_min: w.duration_min,
    duration_label: w.duration_label,
    equipment: w.equipment,
    location: w.location,
    image_url: w.image_url,
    description_html: w.description_html,
    instructions_html: w.instructions_html,
    tips_html: w.tips_html,
    main_workout: w.main_workout,
    created_by: `smarty:${w.id}`,
    status: "ready",
  };
}

export function categoryLabel(c: string): string {
  return c
    .toLowerCase()
    .split(" ")
    .map((p) => (p === "&" ? "&" : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
