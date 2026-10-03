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
    const access = await requireActiveMembership(context);
    if (!access.healthAcknowledged || !access.readinessComplete || !access.profileComplete)
      throw new Error("Complete your Training Profile, health acknowledgement and readiness questionnaire (PAR-Q) first.");
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

/**
 * Permanently deletes a member-built workout and everything attached to it
 * (sharing, likes, ratings, comments, completions, logged sets, results,
 * feedback, records, notifications) so it no longer counts anywhere.
 * Coach and Smarty workouts can never be deleted here.
 */
export const deleteManualWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workoutId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("workouts")
      .select("id,user_id,category,created_by,community_source_id,is_shared")
      .eq("id", data.workoutId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.user_id !== context.userId) throw new Error("Workout not found.");
    if (row.created_by === "community" || row.community_source_id)
      throw new Error("Workouts from the community can't be deleted — only their creator can delete them.");
    if (row.category !== MANUAL_CATEGORY) throw new Error("Only workouts you built yourself can be deleted.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.workoutId;

    // A shared workout belongs to the community: members may have completed,
    // favourited or logged it. Deleting it from the creator's logbook must not
    // remove it from Shared Workouts — the workout itself is kept, flagged out
    // of the creator's logbook, and only the creator's personal data is removed.
    if (row.is_shared) {
      const personalTables = ["set_logs", "workout_results", "workout_feedback", "personal_records"] as const;
      for (const t of personalTables) {
        const { error: e } = await supabaseAdmin.from(t).delete().eq("workout_id", id).eq("user_id", context.userId);
        if (e) throw new Error("Could not delete the workout. Please try again.");
      }
      await supabaseAdmin.from("notifications").delete().eq("workout_id", id).eq("user_id", context.userId);
      const { error: e } = await supabaseAdmin
        .from("workouts")
        .update({
          removed_from_logbook: true,
          status: "created",
          completed_at: null,
          is_favorite: false,
          rating: null,
          user_note: null,
          scheduled_at: null,
        } as never)
        .eq("id", id)
        .eq("user_id", context.userId);
      if (e) throw new Error("Could not delete the workout. Please try again.");
      const { recomputeProgress } = await import("@/lib/progress.server");
      await recomputeProgress(supabaseAdmin as never, context.userId).catch(() => undefined);
      return { ok: true, keptShared: true };
    }

    const byWorkout = [
      "community_comments",
      "community_ratings",
      "community_reactions",
      "set_logs",
      "workout_feedback",
      "workout_results",
      "personal_records",
      "notifications",
      "workout_seo",
    ] as const;
    for (const t of byWorkout) {
      const { error: e } = await supabaseAdmin.from(t).delete().eq("workout_id", id);
      if (e) throw new Error("Could not delete the workout. Please try again.");
    }
    const steps = [
      supabaseAdmin.from("community_completions").delete().or(`workout_id.eq.${id},copy_workout_id.eq.${id}`),
      supabaseAdmin.from("community_reports").delete().eq("target_id", id),
      supabaseAdmin.from("workout_generation_requests").update({ workout_id: null }).eq("workout_id", id),
      supabaseAdmin.from("workouts").update({ community_source_id: null }).eq("community_source_id", id),
    ];
    for (const s of steps) {
      const { error: e } = await s;
      if (e) throw new Error("Could not delete the workout. Please try again.");
    }
    const { error: delErr } = await supabaseAdmin.from("workouts").delete().eq("id", id).eq("user_id", context.userId);
    if (delErr) throw new Error("Could not delete the workout. Please try again.");
    const { recomputeProgress } = await import("@/lib/progress.server");
    await recomputeProgress(supabaseAdmin as never, context.userId).catch(() => undefined);
    return { ok: true };
  });
