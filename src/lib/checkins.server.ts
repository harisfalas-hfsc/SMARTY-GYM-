import type { SupabaseClient } from "@supabase/supabase-js";
import { localClock, type CheckinRow } from "@/lib/checkins/score";
import type { CheckinSignal } from "@/lib/coach-rules/types";

export async function userTimezone(db: SupabaseClient, userId: string) {
  const { data } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  return ((data as { timezone?: string | null } | null)?.timezone || "Europe/Nicosia") as string;
}

export function yesterdayOf(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Today's morning answers + yesterday's evening, for the coaching rules. */
export async function loadCheckinSignal(
  db: SupabaseClient,
  userId: string,
): Promise<CheckinSignal | null> {
  const tz = await userTimezone(db, userId);
  const today = localClock(new Date(), tz).date;
  const { data } = await db
    .from("smarty_checkins")
    .select("*")
    .eq("user_id", userId)
    .in("checkin_date", [today, yesterdayOf(today)]);
  const rows = (data ?? []) as unknown as CheckinRow[];
  const t = rows.find((r) => r.checkin_date === today && r.morning_completed) ?? null;
  const y = rows.find((r) => r.checkin_date !== today) ?? null;
  if (!t && !(y && y.night_completed)) return null;
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    sleepHours: n(t?.sleep_hours),
    sleepQuality: n(t?.sleep_quality),
    readiness: n(t?.readiness_score),
    soreness: n(t?.soreness_rating),
    mood: n(t?.mood_rating),
    yesterdayStrain: y?.night_completed ? n(y.day_strain) : null,
    yesterdayScore: n(y?.daily_smarty_score),
  };
}

/** Completed morning check-ins from the N days before `today` (newest first). Missing days are skipped, never zero. */
export async function loadPriorCheckins(db: SupabaseClient, userId: string, today: string, days: number): Promise<CheckinSignal[]> {
  const dates: string[] = [];
  let d = today;
  for (let i = 0; i < days; i++) { d = yesterdayOf(d); dates.push(d); }
  const { data } = await db.from("smarty_checkins").select("*").eq("user_id", userId).in("checkin_date", dates);
  const rows = ((data ?? []) as unknown as CheckinRow[]).filter((r) => r.morning_completed);
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return rows
    .sort((a, b) => (a.checkin_date < b.checkin_date ? 1 : -1))
    .map((r) => ({ sleepHours: n(r.sleep_hours), sleepQuality: n(r.sleep_quality), readiness: n(r.readiness_score), soreness: n(r.soreness_rating), mood: n(r.mood_rating), yesterdayStrain: null, yesterdayScore: null }));
}
