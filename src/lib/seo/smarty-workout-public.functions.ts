import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Unauthenticated, deliberately restricted to existing public card details. */
export const getSmartyWorkoutSearchData = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { getPublicSmartyWorkout, smartyWorkoutSearchData } = await import("./smarty-workout-public.server");
    const workout = await getPublicSmartyWorkout(data.id);
    return workout ? smartyWorkoutSearchData(workout) : null;
  });