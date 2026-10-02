import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildManualWorkoutHtml, MANUAL_CATEGORY, type ManualSections } from "@/lib/manual-workout";

const item = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  dose: z.string().trim().max(60),
});
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  sections: z.object({
    activation: z.array(item).max(30),
    main: z.array(item).max(60),
    finisher: z.array(item).max(30),
    cooldown: z.array(item).max(30),
  }),
});

/** Member-built workout from library exercises. Premium only; saved like every other workout. */
export const createManualWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { requireActiveMembership } = await import("@/lib/membership.server");
    await requireActiveMembership(context);
    const all = Object.values(data.sections).flat();
    if (!data.sections.main.length) throw new Error("Add at least one exercise to the Main Workout.");
    const ids = [...new Set(all.map((e) => e.id))];
    const { data: rows, error } = await context.supabase
      .from("exercises")
      .select("id,name")
      .eq("is_active", true)
      .in("id", ids);
    if (error) throw new Error(error.message);
    const names = new Map(((rows ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));
    const missing = ids.filter((id) => !names.has(id));
    if (missing.length) throw new Error("One of the exercises is no longer in the library. Remove it and try again.");
    const sections = Object.fromEntries(
      Object.entries(data.sections).map(([k, list]) => [
        k,
        list.map((e) => ({ id: e.id, name: names.get(e.id)!, dose: e.dose })),
      ]),
    ) as ManualSections;
    const { data: inserted, error: insErr } = await context.supabase
      .from("workouts")
      .insert({
        user_id: context.userId,
        name: data.name,
        category: MANUAL_CATEGORY,
        format: "CUSTOM",
        difficulty_stars: 2,
        difficulty_label: "Intermediate",
        duration_min: Math.max(10, Math.min(120, all.length * 3)),
        equipment: [],
        main_workout: buildManualWorkoutHtml(sections),
        description_html: "<p>A workout you built yourself from the Exercise Library.</p>",
        status: "created",
      } as never)
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: (inserted as { id: string }).id };
  });
