import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Unauthenticated; returns the same public exercise fields the library shows. */
export const getPublicExercise = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(data))
  .handler(async ({ data }) => {
    const { getPublicExerciseBySlug } = await import("./exercise-public.server");
    return getPublicExerciseBySlug(data.slug);
  });

/** Unauthenticated; the anonymous first page of the library, for SSR. */
export const getDefaultLibraryExercises = createServerFn({ method: "GET" }).handler(async () => {
  const { listDefaultLibraryExercises } = await import("./exercise-public.server");
  return listDefaultLibraryExercises();
});

/** Unauthenticated; name → public URL pairs for in-article internal links. */
export const getArticleLinkTargets = createServerFn({ method: "GET" }).handler(async () => {
  const { listExerciseLinkTargets } = await import("./exercise-public.server");
  const { listPublicSmartyWorkouts, smartyWorkoutPath } = await import("./smarty-workout-public.server");
  const [exercises, workouts] = await Promise.all([listExerciseLinkTargets(), listPublicSmartyWorkouts()]);
  return [
    ...exercises.map((e) => ({ name: e.name, url: `/exercise-library/${e.slug}` })),
    ...workouts.map((w) => ({ name: w.name, url: smartyWorkoutPath(w) })),
  ];
});
