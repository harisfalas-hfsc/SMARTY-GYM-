import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BadgeDef, EarnedBadge, ProgressStats } from "@/lib/progress.server";

export type { BadgeDef, EarnedBadge, ProgressStats };

export type ProgressOverview = {
  stats: ProgressStats;
  rank: number;
  totalRanked: number;
  badges: EarnedBadge[];
  definitions: BadgeDef[];
  newlyEarned: { id: string; name: string }[];
};

export type ProgressExportData = ProgressOverview & {
  memberName: string;
  period: { from: string; to: string };
  workouts: Array<{
    id: string;
    name: string;
    category: string;
    format: string | null;
    status: string;
    createdAt: string;
    completedAt: string | null;
    createdBy: string | null;
    isWod: boolean;
  }>;
  sessions: Array<{
    workoutId: string;
    performedAt: string;
    rpe: number | null;
    strengthLoad: number | null;
    conditioningLoad: number | null;
    durationSeconds: number | null;
  }>;
  checkins: Array<Record<string, string | number | boolean | null>>;
};

export const getProgressOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProgressOverview> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recomputeProgress, rankFor } = await import("@/lib/progress.server");
    const userId = context.userId;
    const { stats, definitions, newlyEarned } = await recomputeProgress(supabaseAdmin, userId);
    const [{ rank, total }, { data: badges }] = await Promise.all([
      rankFor(supabaseAdmin, userId, stats),
      supabaseAdmin
        .from("user_badges")
        .select("badge_id,badge_name,category,threshold,points,earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
    ]);
    return {
      stats,
      rank,
      totalRanked: total,
      badges: (badges ?? []) as EarnedBadge[],
      definitions,
      newlyEarned: newlyEarned.map((d) => ({ id: d.id, name: d.name })),
    };
  });

export const getProgressExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { from: string; to: string }) => {
    const date = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.test(input.from) || !date.test(input.to) || input.from > input.to) {
      throw new Error("Choose a valid date range.");
    }
    return input;
  })
  .handler(async ({ context, data }): Promise<ProgressExportData> => {
    await (await import("@/lib/membership.server")).requireActiveMembership(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recomputeProgress, rankFor } = await import("@/lib/progress.server");
    const userId = context.userId;
    const fromIso = `${data.from}T00:00:00.000Z`;
    const toDate = new Date(`${data.to}T00:00:00.000Z`);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    const toExclusive = toDate.toISOString();
    const { stats, definitions, newlyEarned } = await recomputeProgress(supabaseAdmin, userId);

    const [ranking, badgesRes, profileRes, workoutsRes, sessionsRes, checkinsRes] = await Promise.all([
      rankFor(supabaseAdmin, userId, stats),
      supabaseAdmin.from("user_badges").select("badge_id,badge_name,category,threshold,points,earned_at").eq("user_id", userId).order("earned_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("workouts").select("id,name,category,format,status,created_at,completed_at,created_by,is_wod").eq("user_id", userId).is("deleted_at", null).or(`and(created_at.gte.${fromIso},created_at.lt.${toExclusive}),and(completed_at.gte.${fromIso},completed_at.lt.${toExclusive})`).order("created_at", { ascending: true }).limit(20000),
      supabaseAdmin.from("workout_results").select("workout_id,performed_at,rpe,strength_load,conditioning_load,duration_seconds").eq("user_id", userId).gte("performed_at", fromIso).lt("performed_at", toExclusive).order("performed_at", { ascending: true }).limit(10000),
      supabaseAdmin.from("smarty_checkins").select("*").eq("user_id", userId).gte("checkin_date", data.from).lte("checkin_date", data.to).order("checkin_date", { ascending: true }).limit(5000),
    ]);
    const firstError = [badgesRes.error, profileRes.error, workoutsRes.error, sessionsRes.error, checkinsRes.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);

    return {
      stats,
      rank: ranking.rank,
      totalRanked: ranking.total,
      badges: (badgesRes.data ?? []) as EarnedBadge[],
      definitions,
      newlyEarned: newlyEarned.map((d) => ({ id: d.id, name: d.name })),
      memberName: (profileRes.data as { display_name?: string | null } | null)?.display_name?.trim() || "SMARTYGYM member",
      period: data,
      workouts: ((workoutsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row["id"]),
        name: String(row["name"]),
        category: String(row["category"]),
        format: row["format"] == null ? null : String(row["format"]),
        status: String(row["status"]),
        createdAt: String(row["created_at"]),
        completedAt: row["completed_at"] == null ? null : String(row["completed_at"]),
        createdBy: row["created_by"] == null ? null : String(row["created_by"]),
        isWod: Boolean(row["is_wod"]),
      })),
      sessions: ((sessionsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        workoutId: String(row["workout_id"]),
        performedAt: String(row["performed_at"]),
        rpe: row["rpe"] == null ? null : Number(row["rpe"]),
        strengthLoad: row["strength_load"] == null ? null : Number(row["strength_load"]),
        conditioningLoad: row["conditioning_load"] == null ? null : Number(row["conditioning_load"]),
        durationSeconds: row["duration_seconds"] == null ? null : Number(row["duration_seconds"]),
      })),
      checkins: (checkinsRes.data ?? []) as Array<Record<string, string | number | boolean | null>>,
    };
  });

async function assertAdmin(ctx: { userId: string; claims: any }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
}

export const adminListBadgeDefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ definitions: BadgeDef[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("badge_definitions")
      .select("*")
      .order("sort_order");
    return { definitions: (data ?? []) as BadgeDef[] };
  });

export const adminSaveBadgeDef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<BadgeDef> & { id: string }) => input)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      id: data.id,
      category: data.category ?? "completed",
      name: data.name ?? data.id,
      description: data.description ?? "",
      threshold: Number(data.threshold ?? 0),
      icon: data.icon ?? "trophy",
      points: Number(data.points ?? 25),
      sort_order: Number(data.sort_order ?? 0),
      is_active: data.is_active ?? true,
    };
    const { error } = await supabaseAdmin
      .from("badge_definitions")
      .upsert(row as never, { onConflict: "id" });
    return error ? { error: error.message } : { ok: true };
  });

export type AdminUserProgress = ProgressOverview & { email: string | null };

export const adminGetUserProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ context, data }): Promise<AdminUserProgress | { error: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recomputeProgress, rankFor } = await import("@/lib/progress.server");
    try {
      const { stats, definitions } = await recomputeProgress(supabaseAdmin, data.userId);
      const [{ rank, total }, { data: badges }, userRes] = await Promise.all([
        rankFor(supabaseAdmin, data.userId, stats),
        supabaseAdmin
          .from("user_badges")
          .select("badge_id,badge_name,category,threshold,points,earned_at")
          .eq("user_id", data.userId)
          .order("earned_at", { ascending: false }),
        supabaseAdmin.auth.admin.getUserById(data.userId),
      ]);
      return {
        stats,
        rank,
        totalRanked: total,
        badges: (badges ?? []) as EarnedBadge[],
        definitions,
        newlyEarned: [],
        email: userRes.data.user?.email ?? null,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });
