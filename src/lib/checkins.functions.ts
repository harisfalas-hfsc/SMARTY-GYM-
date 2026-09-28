import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  completeStreaks,
  computeScores,
  localClock,
  windowStatus,
  type CheckinRow,
} from "@/lib/checkins/score";

async function todayFor(db: never, userId: string) {
  const { userTimezone } = await import("@/lib/checkins.server");
  const tz = await userTimezone(db, userId);
  return { tz, ...localClock(new Date(), tz) };
}

export const CHECKIN_PREMIUM_REQUIRED = "Premium access required for Smarty Check-ins.";

async function assertPremium(db: never, userId: string) {
  const { getAccessStateForUser } = await import("@/lib/eligibility.server");
  const access = await getAccessStateForUser(db, userId);
  if (!access.premium) throw new Error(CHECKIN_PREMIUM_REQUIRED);
}

/** Whether the signed-in member can use Smarty Check-ins (premium only). */
export const getCheckinAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAccessStateForUser } = await import("@/lib/eligibility.server");
    const access = await getAccessStateForUser(context.supabase as never, context.userId);
    return { premium: Boolean(access.premium) };
  });

export const getCheckinState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i?: { days?: number }) => ({ days: Math.min(365, Math.max(7, i?.days ?? 90)) }))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await assertPremium(db as never, context.userId);
    const { date, minutes, tz } = await todayFor(db as never, context.userId);
    const since = new Date(`${date}T12:00:00Z`);
    since.setUTCDate(since.getUTCDate() - data.days);
    const { data: rows, error } = await db
      .from("smarty_checkins")
      .select("*")
      .eq("user_id", context.userId)
      .gte("checkin_date", since.toISOString().slice(0, 10))
      .order("checkin_date", { ascending: false });
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as unknown as CheckinRow[];
    const today = list.find((r) => r.checkin_date === date) ?? null;
    const completeDates = list.filter((r) => r.status === "complete").map((r) => r.checkin_date);
    const streaks = completeStreaks(completeDates, date);
    const scored = list.filter((r) => r.daily_smarty_score != null);
    return {
      date,
      timezone: tz,
      window: windowStatus(minutes),
      minutes,
      today,
      checkins: list,
      stats: {
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        averageScore: scored.length
          ? Math.round(scored.reduce((s, r) => s + (r.daily_smarty_score ?? 0), 0) / scored.length)
          : null,
        completionRate: list.length ? Math.round((completeDates.length / list.length) * 100) : 0,
        totalComplete: completeDates.length,
      },
    };
  });

const morning = z.object({
  kind: z.literal("morning"),
  sleep_hours: z.number().min(3).max(10),
  sleep_quality: z.number().int().min(1).max(5),
  readiness_score: z.number().int().min(0).max(10),
  soreness_rating: z.number().int().min(0).max(10),
  mood_rating: z.number().int().min(1).max(5),
});
const night = z.object({
  kind: z.literal("night"),
  steps_bucket: z.number().int().min(1).max(5),
  hydration_liters: z.number().min(0).max(6),
  protein_level: z.number().int().min(0).max(4),
  day_strain: z.number().int().min(0).max(10),
});

export const submitCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.discriminatedUnion("kind", [morning, night]).parse(i))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await assertPremium(db as never, context.userId);
    const { date, minutes } = await todayFor(db as never, context.userId);
    const w = windowStatus(minutes);
    if (data.kind === "morning" && !w.isMorning)
      throw new Error("The morning check-in is open between 07:00 and 10:00.");
    if (data.kind === "night" && !w.isNight)
      throw new Error("The night check-in is open between 19:00 and 22:00.");

    const { data: existing } = await db
      .from("smarty_checkins")
      .select("*")
      .eq("user_id", context.userId)
      .eq("checkin_date", date)
      .maybeSingle();
    const row = (existing ?? {}) as Partial<CheckinRow>;
    if (data.kind === "morning" && row.morning_completed)
      throw new Error("You've already completed your morning check-in today.");
    if (data.kind === "night" && row.night_completed)
      throw new Error("You've already completed your night check-in today.");

    const { kind, ...answers } = data;
    const now = new Date().toISOString();
    const merged: Partial<CheckinRow> = {
      ...row,
      ...answers,
      ...(kind === "morning" ? { morning_completed: true } : { night_completed: true }),
    };
    const patch = {
      user_id: context.userId,
      checkin_date: date,
      ...answers,
      ...(kind === "morning"
        ? { morning_completed: true, morning_completed_at: now }
        : { night_completed: true, night_completed_at: now }),
      ...computeScores(merged),
    };
    const { data: saved, error } = await db
      .from("smarty_checkins")
      .upsert(patch as never, { onConflict: "user_id,checkin_date" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (kind === "night") {
      // Check-in badges count towards the Smarty Progress Score.
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { recomputeProgress } = await import("@/lib/progress.server");
        await recomputeProgress(supabaseAdmin as never, context.userId);
      } catch {
        /* progress refreshes next time the Progress tab loads */
      }
    }
    return saved as unknown as CheckinRow;
  });

export const markCheckinModalShown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { kind: "morning" | "night" }) => ({
    kind: i.kind === "night" ? ("night" as const) : ("morning" as const),
  }))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { date } = await todayFor(db as never, context.userId);
    await db.from("smarty_checkins").upsert(
      {
        user_id: context.userId,
        checkin_date: date,
        [data.kind === "morning" ? "morning_modal_shown" : "night_modal_shown"]: true,
      } as never,
      { onConflict: "user_id,checkin_date" },
    );
    return { ok: true };
  });
