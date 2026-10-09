import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CoachRequest } from "@/lib/workout/create.server";
import type { CoachSnapshot } from "@/lib/coach-snapshot";

export type { CoachRequest };

/** Read-only, deterministic coaching snapshot for the persistent header Coach. */
export const getCoachSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoachSnapshot> => {
    const { getAccessStateForUser } = await import("@/lib/eligibility.server");
    const access = await getAccessStateForUser(context.supabase as never, context.userId);
    if (!access.premium) {
      return {
        access: "locked",
        firstName: "there",
        headline: "Your coach is ready when you return",
        recommendation: "Renew your membership to reconnect Smarty Coach with your saved training history.",
        lastSession: null,
        comparison: "Your history stays safely stored while access is paused.",
        personalRecord: null,
        nextStep: "Restart your membership to continue from where you left off.",
        reasons: ["Protected training history remains locked until membership access is active."],
        equipment: [],
        action: { label: "View membership", to: "/account" },
      };
    }

    const db = context.supabase;
    const now = new Date().toISOString();
    const [{ data: profile }, { data: lastWorkout }, { data: scheduled }, { data: record }] =
      await Promise.all([
        db
          .from("profiles")
          .select("display_name,fitness_level,experience,primary_goal,preferred_equipment,timezone")
          .eq("id", context.userId)
          .maybeSingle(),
        db
          .from("workouts")
          .select("id,name,category,format,difficulty_stars,duration_min,completed_at")
          .eq("user_id", context.userId)
          .eq("status", "completed")
          .is("deleted_at", null)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db
          .from("workouts")
          .select("id,name,scheduled_at")
          .eq("user_id", context.userId)
          .eq("status", "scheduled")
          .gte("scheduled_at", now)
          .is("deleted_at", null)
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        db
          .from("personal_records")
          .select("label,metric,value,achieved_at")
          .eq("user_id", context.userId)
          .order("achieved_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const { loadPerformanceOverview, loadWorkoutPerformance } = await import("@/lib/performance.server");
    const { loadCheckinSignal } = await import("@/lib/checkins.server");
    const [overview, checkin, performance] = await Promise.all([
      loadPerformanceOverview(db as never, context.userId),
      loadCheckinSignal(db as never, context.userId).catch(() => null),
      lastWorkout?.id
        ? loadWorkoutPerformance(db as never, context.userId, lastWorkout.id)
        : Promise.resolve(null),
    ]);
    const { recommend } = await import("@/lib/coach-rules");
    const { decideCoachSnapshot } = await import("@/lib/coach-snapshot");

    const level = String(profile?.fitness_level ?? profile?.experience ?? "").toLowerCase();
    const selectedStars = level.includes("adv") ? 3 : level.includes("inter") ? 2 : 1;
    const recommendation = recommend({
      selectedStars,
      category: lastWorkout?.category ?? null,
      format: lastWorkout?.format ?? null,
      confidence: overview.confidence,
      readiness: overview.readiness.state,
      readinessReason: overview.readiness.reason,
      strengthLoad: overview.load.strength,
      conditioningLoad: overview.load.conditioning,
      overallLoad: overview.load.overall,
      sessionsLast7: overview.sessionsLast7,
      consecutiveDays: overview.consecutiveDays,
      loggedSessions: overview.loggedSessions,
      progressionReady: overview.progressionReady,
      recentShortfalls: overview.recentShortfalls,
      checkin,
    });

    const timezone = profile?.timezone || "Europe/Nicosia";
    const fmtDate = (value: string | null | undefined) =>
      value
        ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: timezone }).format(new Date(value))
        : "";
    const latestAttempt = performance?.attempts.at(-1) ?? null;
    const facts: string[] = [];
    if (latestAttempt?.resultText) facts.push(latestAttempt.resultText);
    if (latestAttempt?.totalVolumeKg !== null && latestAttempt?.totalVolumeKg !== undefined)
      facts.push(`${Math.round(latestAttempt.totalVolumeKg)} kg total volume`);
    if (latestAttempt?.totalReps !== null && latestAttempt?.totalReps !== undefined)
      facts.push(`${latestAttempt.totalReps} reps logged`);
    if (latestAttempt?.rpe !== null && latestAttempt?.rpe !== undefined) facts.push(`RPE ${latestAttempt.rpe}/10`);
    if (!facts.length && lastWorkout) {
      facts.push(`${lastWorkout.duration_min} min · ${lastWorkout.difficulty_stars} star${lastWorkout.difficulty_stars === 1 ? "" : "s"}`);
    }

    const comparisonData = latestAttempt?.comparison ?? null;
    let comparison = "No comparable previous attempt yet. Log this workout again to see a like-for-like comparison.";
    if (comparisonData?.reason === "version_changed") {
      comparison = "The workout prescription changed, so this attempt is not presented as a direct comparison.";
    } else if (comparisonData?.comparable) {
      const changed = comparisonData.metrics.find((metric) =>
        metric.verdict === "better" || metric.verdict === "worse" || metric.verdict === "same");
      if (changed) {
        comparison = changed.verdict === "better"
          ? `${changed.label} improved compared with your previous attempt.`
          : changed.verdict === "same"
            ? `${changed.label} held steady compared with your previous attempt.`
            : `${changed.label} was below your previous attempt; keep the next progression controlled.`;
      }
    }

    const recordText = record
      ? `${record.label}: ${Number(record.value).toLocaleString("en-GB")} ${record.metric}`.trim()
      : null;
    const firstName = String(profile?.display_name ?? "there").trim().split(/\s+/)[0] || "there";
    return decideCoachSnapshot({
      firstName,
      readiness: overview.readiness,
      recommendation,
      hasCheckin: Boolean(checkin),
      loggedSessions: overview.loggedSessions,
      primaryGoal: profile?.primary_goal ?? null,
      fitnessLevel: profile?.fitness_level ?? profile?.experience ?? null,
      equipment: (profile?.preferred_equipment ?? []).filter(Boolean),
      upcoming: scheduled?.scheduled_at
        ? { name: scheduled.name, date: fmtDate(scheduled.scheduled_at) }
        : null,
      lastSession: lastWorkout
        ? { name: lastWorkout.name, date: fmtDate(lastWorkout.completed_at), facts: facts.slice(0, 3) }
        : null,
      comparison,
      personalRecord: recordText,
    });
  });

/** The only failure wording an athlete ever sees. */
const GENERIC_APOLOGY =
  "We hit a temporary snag building your workout. Your answers are safe, we are already on it, and it will arrive shortly — nothing for you to do.";

export const generateWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CoachRequest & { refinementText?: string }) => input)
  .handler(async ({ data, context }) => {
    const { withProblemReport } = await import("@/lib/errors/report.server");
    return withProblemReport(
      { source: "workout-generation", route: "/create-your-own-workout", userId: context.userId },
      async () => {
        const { requireWorkoutAccess } = await import("@/lib/eligibility.server");
        await requireWorkoutAccess(context.supabase as never, context.userId, {
          countsAgainstDailyQuota: true,
        });
        const { runTrackedGeneration } = await import("@/lib/workout-generation.server");
        const { refinementText, ...request } = data;
        const res = await runTrackedGeneration({
          db: context.supabase as never,
          userId: context.userId,
          stage: refinementText ? "refinement" : "initial",
          request,
          refinementText: refinementText ?? null,
        });
        if (!res.ok) {
          // Never expose the internal cause — the retry cron takes it from here.
          throw new Error(GENERIC_APOLOGY);
        }
        return { id: res.workoutId, notes: res.notes, requestId: res.requestId };
      },
    );
  });

/** Any session still being recovered for this member — drives the "we are on it" card. */
export const getPendingGeneration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("workout_generation_requests")
      .select("id,status,stage,attempt_count,created_at,workout_id")
      .eq("user_id", context.userId)
      .in("status", ["failed", "building"])
      .is("workout_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = (data ?? null) as
      | { id: string; status: string; stage: string; attempt_count: number; created_at: string }
      | null;
    if (!row) return { pending: null };
    return { pending: row };
  });

export const getExerciseDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => ({
    ids: (input.ids ?? []).map(String).slice(0, 60),
  }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (!data.ids.length) return { exercises: [] };
    const { data: rows, error } = await supabase
      .from("exercises")
      .select(
        "id,name,body_part,target_muscle,secondary_muscles,equipment,difficulty,category,description,instructions,gif_path",
      )
      .in("id", data.ids);
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as Array<Record<string, unknown> & { gif_path: string | null }>;
    const paths = list.map((row) => row.gif_path).filter((path): path is string => Boolean(path));
    const signedUrls = new Map<string, string>();
    if (paths.length) {
      const { data: signed, error: signedError } = await supabase.storage
        .from("exercise-library")
        .createSignedUrls(paths, 60 * 60 * 24);
      if (signedError) throw new Error(signedError.message);
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
      }
    }
    return {
      exercises: list.map((r) => ({
        ...r,
        gif_url: r.gif_path ? (signedUrls.get(r.gif_path) ?? null) : null,
      })),
    };
  });

/**
 * The member-chosen workout name — required right after Smarty Coach finishes.
 * Only the name is editable by the member; category, difficulty, equipment and
 * every other label stay system-set.
 */
export const nameWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workoutId: string; name: string }) => input)
  .handler(async ({ data, context }) => {
    await (await import("@/lib/membership.server")).requireActiveMembership(context);
    const name = String(data.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60) {
      throw new Error("Give your workout a name between 2 and 60 characters.");
    }
    // Only the creator of a Smarty Coach or Build It Yourself workout can (re)name it.
    const { data: row, error: readErr } = await context.supabase
      .from("workouts")
      .select("id,user_id,created_by,community_source_id,is_wod,deleted_at")
      .eq("id", data.workoutId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    const o = row as {
      user_id: string; created_by: string | null; community_source_id: string | null;
      is_wod: boolean | null; deleted_at: string | null;
    } | null;
    if (!o || o.user_id !== context.userId || o.deleted_at) throw new Error("Only the creator can rename this workout.");
    if (String(o.created_by ?? "").startsWith("smarty:") || o.is_wod || o.community_source_id || o.created_by === "community") {
      throw new Error("Only the creator can rename this workout.");
    }
    const { error } = await context.supabase
      .from("workouts")
      .update({ name } as never)
      .eq("id", data.workoutId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    // Members who saved it from Shared Workouts see the new name too.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: copyErr } = await supabaseAdmin
      .from("workouts")
      .update({ name } as never)
      .eq("community_source_id", data.workoutId);
    if (copyErr) throw new Error(copyErr.message);
    return { ok: true, name };
  });

export const setWorkoutMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      workoutId: string;
      is_favorite?: boolean;
      rating?: number | null;
      user_note?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/membership.server")).requireActiveMembership(context);
    const patch: Record<string, unknown> = {};
    if (typeof data.is_favorite === "boolean") patch["is_favorite"] = data.is_favorite;
    if (data.rating !== undefined) patch["rating"] = data.rating;
    if (data.user_note !== undefined) patch["user_note"] = data.user_note;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await context.supabase
      .from("workouts")
      .update(patch as never)
      .eq("id", data.workoutId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setWorkoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { workoutId: string; status?: string; scheduled_at?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/membership.server")).requireActiveMembership(context);
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch["status"] = data.status;
      patch["completed_at"] = data.status === "completed" ? new Date().toISOString() : null;
    }
    if (data.scheduled_at !== undefined) patch["scheduled_at"] = data.scheduled_at;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await context.supabase
      .from("workouts")
      .update(patch as never)
      .eq("id", data.workoutId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
