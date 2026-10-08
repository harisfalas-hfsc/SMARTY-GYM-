import type { SupabaseClient } from "@supabase/supabase-js";
import { getCronConfig, recordRun } from "@/lib/cron/jobs.server";

type DB = SupabaseClient;
const BATCH = 500;

export const SHARED_WORKOUT_LINES = [
  "{name} just shared a workout. Feeling in the mood to do it?",
  "{name} just shared a workout — let's check it out!",
  "{name} just shared a workout. Let's crush it!",
  "New from {name}: a freshly shared workout is waiting for you.",
  "{name} just shared a workout. Up for the challenge?",
  "{name} just dropped a new shared workout — ready to give it a go?",
  "{name} just shared a workout. Your next session might be right here.",
];

/** Picks one line per workout, so the wording changes from share to share. */
export function sharedWorkoutLine(name: string, workoutId: string): string {
  let h = 0;
  for (const c of workoutId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SHARED_WORKOUT_LINES[h % SHARED_WORKOUT_LINES.length]!.replace("{name}", name);
}

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
        const dedupeKey = `new-workout:${w.id}`;
        const n = await notifyAll(db, {
          kind: "new_workout",
          title: "New workout available",
          body: `${w.name} is now live in Smarty Workouts — tap “Open workout” to see it.`,
          dedupeKey,
        });
        let emails = 0;
        let emailError: string | null = null;
        try {
          const { sendBroadcastEmail } = await import("@/lib/broadcast-email.server");
          emails = await sendBroadcastEmail(db, {
            dedupeKey,
            subject: "New workout available",
            heading: "New workout available",
            body: `${w.name} is now live in Smarty Workouts.`,
            buttonHref: `${SITE_URL}/smarty-workouts/${w.id}`,
          });
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
    const line = sharedWorkoutLine(first, workoutId);
    try {
      const n = await notifyAll(
        db,
        { kind: "shared_workout", title: line, body: "Tap “Open workout” to see it in Shared Workouts.", dedupeKey: `shared-workout:${workoutId}` },
        sharerId,
      );
      if (n) {
        await recordRun(db, {
          jobKey: "shared-workout-announcement",
          status: "ok",
          changed: true,
          summary: `${first}'s shared workout announced to ${n} account(s).`,
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
