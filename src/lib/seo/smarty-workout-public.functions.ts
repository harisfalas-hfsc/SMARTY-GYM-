import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Unauthenticated, deliberately restricted to existing public card details. */
export const getSmartyWorkoutSearchData = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { getPublicSmartyWorkoutByParam, smartyWorkoutSearchData } = await import("./smarty-workout-public.server");
    const workout = await getPublicSmartyWorkoutByParam(data.id);
    if (!workout) return null;
    return {
      ...smartyWorkoutSearchData(workout),
      id: workout.id,
      slug: workout.slug,
      name: workout.name,
      category: workout.category,
      format: workout.format,
      focus: workout.focus,
      duration_min: workout.duration_min,
      difficulty_stars: workout.difficulty_stars,
      equipment: workout.equipment,
      image_url: workout.image_url,
    };
  });
