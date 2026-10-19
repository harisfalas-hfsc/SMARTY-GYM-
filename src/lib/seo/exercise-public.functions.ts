import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Unauthenticated; returns the same public exercise fields the library shows. */
export const getPublicExercise = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(data))
  .handler(async ({ data }) => {
    const { getPublicExerciseBySlug } = await import("./exercise-public.server");
    return getPublicExerciseBySlug(data.slug);
  });
