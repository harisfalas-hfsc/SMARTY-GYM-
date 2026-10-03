import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPublicSmartyWorkout, smartyWorkoutSearchData } from "./smarty-workout-public.server";

/** Unauthenticated, deliberately restricted to existing public card details. */
export const getSmartyWorkoutSearchData = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const workout = await getPublicSmartyWorkout(data.id);
    return workout ? smartyWorkoutSearchData(workout) : null;
  });