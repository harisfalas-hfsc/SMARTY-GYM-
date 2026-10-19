import type { SupabaseClient } from "@supabase/supabase-js";
import { getCronConfig, recordRun } from "@/lib/cron/jobs.server";

type DB = SupabaseClient;
const BATCH = 500;
import { publishedWorkoutsAnnouncement, sharedWorkoutAnnouncement, announcementInboxContent, type PublishedWorkout, type PublishAnnouncementResult } from "@/lib/broadcast-content";
export { SHARED_WORKOUT_LINES, sharedWorkoutLine } from "@/lib/broadcast-content";

/** One inbox message per account (except `exclude`); dedupe_key makes repeats impossible. */
async function notifyAll(
  db: DB,
  row: { kind: string; title: string; body: string; dedupeKey: string },
  exclude?: string,
): Promise<number> {
  return (await notifyAllIds(db, row, exclude)).length;
}

/** Same as notifyAll, returning the accounts that newly received it (used for push). */
async function notifyAllIds(
  db: DB,
  row: { kind: string; title: string; body: string; dedupeKey: string },
  exclude?: string,
): Promise<string[]> {
  const { data, error } = await db.from("profiles").select("id").limit(20000);
  if (error) throw new Error(error.message);
  const { data: done, error: doneError } = await db.from("notifications").select("user_id").eq("dedupe_key", row.dedupeKey).limit(20000);
  if (doneError) throw new Error(doneError.message);
  const already = new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id));
  const ids = ((data as { id: string }[] | null) ?? [])
    .map((r) => r.id)
    .filter((id) => id !== exclude && !already.has(id));
  const sent: string[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const rows = ids.slice(i, i + BATCH).map((user_id) => ({
      user_id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      dedupe_key: row.dedupeKey,
    }));
    const { error: e } = await db.from("notifications").insert(rows as never);
    if (e) throw new Error(e.message);
    sent.push(...rows.map((r) => r.user_id));
  }
  return sent;
}

async function pushAnnouncement(db: DB, ids: string[], a: import("@/lib/broadcast-content").WorkoutAnnouncement, exclude?: string): Promise<void> {
  if (!ids.length) return;
  const { sendPushToUsers } = await import("@/lib/push-notify.server");
  await sendPushToUsers(db, ids, { title: a.heading, body: [a.body, a.workoutName].filter(Boolean).join(" — "), path: a.buttonHref, tag: a.dedupeKey }, { exclude });
}

/** One action produces one shared announcement; no origin-based exclusions. */
export async function announcePublishedSmartyWorkouts(db: DB, actionId: string, rows: PublishedWorkout[]): Promise<PublishAnnouncementResult> {
  const result: PublishAnnouncementResult = { inbox: 0, emails: 0 };
  if (!rows.length) return result;
  try {
    const config = await getCronConfig(db, "new-workout-announcement");
    if (!config.enabled) return { ...result, disabled: true };
    const announcement = publishedWorkoutsAnnouncement(actionId, rows);
    const errors: string[] = [];
    try {
      const ids = await notifyAllIds(db, { kind: "new_workout", ...announcementInboxContent(announcement) });
      result.inbox = ids.length;
      await pushAnnouncement(db, ids, announcement);
    }
    catch (e) { errors.push(`Inbox: ${e instanceof Error ? e.message : "failed"}`); }
    try {
      const { sendBroadcastEmail } = await import("@/lib/broadcast-email.server");
      result.emails = await sendBroadcastEmail(db, announcement);
    } catch (e) { errors.push(`Email: ${e instanceof Error ? e.message : "failed"}`); }
    if (errors.length) result.error = errors.join("; ");
  } catch (e) { result.error = e instanceof Error ? e.message : "Announcement failed"; }
  return result;
}

/** Tells every other account that a member shared a workout. Never throws. */
export async function announceSharedWorkout(db: DB, workoutId: string, sharerId: string): Promise<void> {
  try {
    const config = await getCronConfig(db, "shared-workout-announcement");
    if (!config.enabled) return;
    const { data: p } = await db.from("profiles").select("display_name").eq("id", sharerId).maybeSingle();
    const full = String((p as { display_name?: string } | null)?.display_name ?? "").trim();
    const first = full.split(/\s+/)[0] || "A member";
    const { data: workout } = await db.from("workouts").select("name").eq("id", workoutId).maybeSingle();
    const workoutName = (workout as { name?: string } | null)?.name;
    try {
      const announcement = sharedWorkoutAnnouncement(workoutId, workoutName, full, sharerId);
      const ids = await notifyAllIds(db, { kind: "shared_workout", ...announcementInboxContent(announcement) }, sharerId);
      const n = ids.length;
      await pushAnnouncement(db, ids, announcement, sharerId);
      let emails = 0;
      let emailError: string | null = null;
      try {
        const { sendBroadcastEmail } = await import("@/lib/broadcast-email.server");
        emails = await sendBroadcastEmail(db, announcement);
      } catch (e) {
        emailError = e instanceof Error ? e.message : "email error";
      }
      if (n || emails || emailError) {
        const summary = emailError
          ? `${first}'s shared workout announced to ${n} account(s); emails failed: ${emailError}`
          : `${first}'s shared workout announced to ${n} account(s) (${emails} email${emails === 1 ? "" : "s"}).`;
        await recordRun(db, {
          jobKey: "shared-workout-announcement",
          status: emailError ? "failed" : "ok",
          changed: Boolean(n || emails),
          summary,
        });
      }
    } catch (e) {
      await recordRun(db, {
        jobKey: "shared-workout-announcement",
        status: "failed",
        summary: `Shared workout announcement failed: ${e instanceof Error ? e.message : "error"}`,
      });
    }
  } catch (e) {
    console.error("[shared-workout-announcement]", e);
  }
}
