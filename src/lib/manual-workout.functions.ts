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
 * The creator deletes their own workout (built from the Exercise Library or by
 * Smarty Coach). It is deleted for everyone: removed from Shared Workouts and
 * from every member's logbook, with its likes, ratings, comments, reports and
 * favorites. Training that already happened can never be undone — any copy
 * that was completed or logged is kept as a hidden "deleted" record so every
 * member's progress and training load stay exactly as they were.
 * Smarty Workouts and workouts saved from Shared Workouts can't be deleted here.
 */
export const deleteManualWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workoutId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: found, error } = await context.supabase
      .from("workouts")
      .select("id,user_id,created_by,community_source_id,is_wod,deleted_at")
      .eq("id", data.workoutId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const row = found as {
      id: string;
      user_id: string;
      created_by: string | null;
      community_source_id: string | null;
      is_wod: boolean | null;
      deleted_at: string | null;
    } | null;
    if (!row || row.user_id !== context.userId) throw new Error("Workout not found.");
    if (row.deleted_at) return { ok: true };
    if (String(row.created_by ?? "").startsWith("smarty:") || row.is_wod)
      throw new Error("Smarty Workouts can't be deleted.");
    if (row.created_by === "community" || row.community_source_id)
      throw new Error("Only the creator of this workout can delete it.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = row.id;
    const fail = () => new Error("Could not delete the workout. Please try again.");

    // The original plus every member's copy saved from Shared Workouts.
    const { data: copyRows, error: copyErr } = await supabaseAdmin
      .from("workouts")
      .select("id,user_id,status")
      .eq("community_source_id", id)
      .is("deleted_at", null);
    if (copyErr) throw fail();
    const { data: selfRow } = await supabaseAdmin.from("workouts").select("id,user_id,status").eq("id", id).single();
    const targets = [selfRow, ...(copyRows ?? [])] as { id: string; user_id: string; status: string }[];
    const ids = targets.map((t) => t.id);

    // Social interactions disappear with the workout.
    for (const t of ["community_comments", "community_ratings", "community_reactions", "notifications"] as const) {
      const { error: e } = await supabaseAdmin.from(t).delete().in("workout_id", ids);
      if (e) throw fail();
    }
    {
      const { error: e } = await supabaseAdmin.from("workout_seo").delete().eq("workout_id", id);
      if (e) throw fail();
      const { error: e2 } = await supabaseAdmin.from("community_reports").delete().in("target_id", ids);
      if (e2) throw fail();
    }

    // Which rows carry training activity (completed or any logged data)?
    const active = new Set(targets.filter((t) => t.status === "completed").map((t) => t.id));
    for (const t of ["set_logs", "workout_results", "workout_feedback", "personal_records"] as const) {
      const { data: hits, error: e } = await supabaseAdmin.from(t).select("workout_id").in("workout_id", ids);
      if (e) throw fail();
      for (const h of (hits ?? []) as { workout_id: string }[]) active.add(h.workout_id);
    }
    const { data: comps, error: compErr } = await supabaseAdmin
      .from("community_completions")
      .select("workout_id,copy_workout_id")
      .or(`workout_id.eq.${id},copy_workout_id.in.(${ids.join(",")})`);
    if (compErr) throw fail();
    for (const c of (comps ?? []) as { workout_id: string; copy_workout_id: string | null }[]) {
      active.add(c.workout_id);
      if (c.copy_workout_id) active.add(c.copy_workout_id);
    }

    const now = new Date().toISOString();
    const keep = ids.filter((x) => active.has(x));
    const drop = ids.filter((x) => !active.has(x));

    if (keep.length) {
      const { error: e } = await supabaseAdmin
        .from("workouts")
        .update({
          deleted_at: now,
          removed_from_logbook: true,
          is_shared: false,
          shared_at: null,
          is_favorite: false,
          rating: null,
          scheduled_at: null,
        } as never)
        .in("id", keep);
      if (e) throw fail();
    }
    if (drop.length) {
      const { error: e1 } = await supabaseAdmin
        .from("workout_generation_requests")
        .update({ workout_id: null })
        .in("workout_id", drop);
      if (e1) throw fail();
      // Kept records must not point at a row that is about to disappear.
      if (drop.includes(id)) {
        const { error: e2 } = await supabaseAdmin.from("workouts").update({ community_source_id: null }).eq("community_source_id", id);
        if (e2) throw fail();
      }
      const copiesFirst = [...drop.filter((x) => x !== id), ...drop.filter((x) => x === id)];
      for (const x of copiesFirst) {
        const { error: e3 } = await supabaseAdmin.from("workouts").delete().eq("id", x);
        if (e3) throw fail();
      }
    }

    const { recomputeProgress } = await import("@/lib/progress.server");
    for (const uid of new Set(targets.map((t) => t.user_id))) {
      await recomputeProgress(supabaseAdmin as never, uid).catch(() => undefined);
    }
    return { ok: true };
  });
