import type { SupabaseClient } from "@supabase/supabase-js";
import { getCronConfig, recordRun } from "@/lib/cron/jobs.server";

type DB = SupabaseClient;
const BATCH = 500;
import { newWorkoutAnnouncement, sharedWorkoutAnnouncement, announcementInboxContent } from "@/lib/broadcast-content";
export { SHARED_WORKOUT_LINES, sharedWorkoutLine } from "@/lib/broadcast-content";

/** One inbox message per account (except `exclude`); dedupe_key makes repeats impossible. */
async function notifyAll(
  db: DB,
  row: { kind: string; title: string; body: string; dedupeKey: string },
  exclude?: string,
): Promise<number> {
  const { data, error } = await db.from("profiles").select("id").limit(20000);
  if (error) throw new Error(error.message);
  const { data: done } = await db.from("notifications").select("user_id").eq("dedupe_key", row.dedupeKey).limit(20000);
  const already = new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id));
  const ids = ((data as { id: string }[] | null) ?? [])
    .map((r) => r.id)
    .filter((id) => id !== exclude && !already.has(id));
  let sent = 0;
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
    sent += rows.length;
  }
  return sent;
}

/** "New workout available" for each Smarty Workout the admin publishes for the first time. Never throws. */
export async function announceNewSmartyWorkouts(db: DB, workoutIds: string[]): Promise<void> {
  if (!workoutIds.length) return;
  try {
    const config = await getCronConfig(db, "new-workout-announcement");
    if (!config.enabled) return;
    const { data } = await db
      .from("smarty_workouts")
      .select("id,name,is_visible,legacy_id")
      .in("id", workoutIds);
    // Only workouts created in this admin panel (not the transferred library).
    const rows = ((data as { id: string; name: string; is_visible: boolean; legacy_id: string | null }[] | null) ?? [])
      .filter((r) => r.is_visible && !r.legacy_id);
    for (const w of rows) {
      try {
        const announcement = newWorkoutAnnouncement(w.id, w.name);
        const n = await notifyAll(db, { kind: "new_workout", ...announcementInboxContent(announcement) });
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
            ? `“${w.name}” announced to ${n} account(s); emails failed: ${emailError}`
            : `“${w.name}” announced to ${n} account(s) (${emails} email${emails === 1 ? "" : "s"}).`;
          await recordRun(db, {
            jobKey: "new-workout-announcement",
            status: emailError ? "failed" : "ok",
            changed: Boolean(n || emails),
            summary,
          });
        }
      } catch (e) {
        await recordRun(db, {
          jobKey: "new-workout-announcement",
          status: "failed",
          summary: `“${w.name}” announcement failed: ${e instanceof Error ? e.message : "error"}`,
        });
      }
    }
  } catch (e) {
    console.error("[new-workout-announcement]", e);
  }
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
      const n = await notifyAll(db, { kind: "shared_workout", ...announcementInboxContent(announcement) }, sharerId);
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
