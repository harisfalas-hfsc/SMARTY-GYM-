import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type WorkoutShareCard = {
  id: string;
  name: string;
  category: string | null;
  focus: string | null;
  difficulty_stars: number;
  difficulty_label: string | null;
  duration_min: number | null;
  duration_label: string | null;
  location: string | null;
  equipment: string[] | null;
  format: string | null;
  image_url: string | null;
} | null;

/**
 * Public, deliberately minimal preview of a workout: title + headline stats
 * only. The workout content itself stays behind the normal access rules.
 */
export const getWorkoutShareCard = createServerFn({ method: "GET" })
  .inputValidator((input: { workoutId: string }) => z.object({ workoutId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<WorkoutShareCard> => {
    const { loadPublicShareCard } = await import("@/lib/workout-share.server");
    return loadPublicShareCard({ kind: "community", id: data.workoutId });
  });

/** Recheck visibility before sharing; cached/private copies never grant disclosure. */
export const getShareableWorkoutCard = createServerFn({ method: "GET" })
  .inputValidator((input: { kind: "smarty" | "community"; id: string }) =>
    z.object({ kind: z.enum(["smarty", "community"]), id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<WorkoutShareCard> => {
    const { loadPublicShareCard } = await import("@/lib/workout-share.server");
    return loadPublicShareCard(data);
  });
