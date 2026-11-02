import type { SupabaseClient } from "@supabase/supabase-js";
import { localClock } from "@/lib/checkins/score";

/** Local hours (inside each window) when the inbox reminder is sent: 08:05 and 20:05. */
export const CHECKIN_REMINDER_HOURS = { morning: 8, night: 20 } as const;

/**
 * Posts one inbox message per open check-in window (morning and night) to every
 * Premium member who has not done that check-in yet. Deduplicated per day.
 */
/** Keeps admin-chosen reminder hours inside their check-in windows. */
export function checkinReminderHours(morning?: number, night?: number) {
  const clamp = (v: number | undefined, lo: number, hi: number, d: number) =>
    Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v as number))) : d;
  return {
    morning: clamp(morning, 7, 9, CHECKIN_REMINDER_HOURS.morning),
    night: clamp(night, 19, 21, CHECKIN_REMINDER_HOURS.night),
  };
}

export async function runCheckinReminders(
  db: SupabaseClient,
  now = new Date(),
  hours: { morning: number; night: number } = CHECKIN_REMINDER_HOURS,
): Promise<number> {
  const { data, error } = await db.from("profiles").select("id, timezone").limit(5000);
  if (error) throw new Error(error.message);
  const { getAccessStateForUser } = await import("@/lib/eligibility.server");
  let sent = 0;
  for (const p of (data ?? []) as { id: string; timezone: string | null }[]) {
    const tz = p.timezone || "Europe/Nicosia";
    const { date, minutes } = localClock(now, tz);
    const hour = Math.floor(minutes / 60);
    const kind =
      hour === hours.morning ? "morning" : hour === hours.night ? "night" : null;
    if (!kind) continue;
    const { data: row } = await db
      .from("smarty_checkins")
      .select("morning_completed, night_completed")
      .eq("user_id", p.id)
      .eq("checkin_date", date)
      .maybeSingle();
    const r = row as { morning_completed?: boolean; night_completed?: boolean } | null;
    if (kind === "morning" ? r?.morning_completed : r?.night_completed) continue;
    const access = await getAccessStateForUser(db, p.id);
    if (!access.premium) continue;
    const { error: insErr } = await db.from("notifications").insert({
      user_id: p.id,
      kind: "checkin",
      title: kind === "morning" ? "Your Morning Smarty Check-in is open" : "Your Night Smarty Check-in is open",
      body:
        kind === "morning"
          ? "Takes 30 seconds. Open until 10:00 — start your day with intention."
          : "Review your day in 30 seconds. Open until 22:00 — keep your score on track.",
      dedupe_key: `checkin:${kind}:${date}`,
    } as never);
    if (!insErr) sent += 1;
  }
  return sent;
}
