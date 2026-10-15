import type { SupabaseClient } from "@supabase/supabase-js";
import { announcePublishedSmartyWorkouts } from "./broadcast-notify.server";
import { publicationDeliverySummary, type PublishedWorkout, type PublishAnnouncementResult } from "./broadcast-content";

export type PublicationChange = { workouts: PublishedWorkout[]; held: number; error?: string };
export type PublicationResult = { count: number; held: number; announcement: PublishAnnouncementResult; publicationError?: string };

/** Existing operational history journals the action, not an email queue. */
export async function runSmartyPublication(
  db: SupabaseClient,
  actionId: string,
  change: () => Promise<PublicationChange>,
): Promise<PublicationResult | { error: string }> {
  const { data: previous, error: readError } = await db.from("cron_runs").select("status,details").eq("id", actionId).eq("job_key", "new-workout-announcement").maybeSingle();
  if (readError) return { error: readError.message };
  const saved = previous?.details as { publication?: PublicationChange; result?: PublicationResult } | undefined;
  if (previous?.status === "ok" && saved?.result) return saved.result;
  if (previous && previous.status !== "failed") return { error: "This publish action is already running or was interrupted. Check its delivery history before publishing again." };
  let publication = saved?.publication;
  if (!previous) {
    const { error } = await db.from("cron_runs").insert({ id: actionId, job_key: "new-workout-announcement", status: "running", trigger: "manual", summary: "Publishing Smarty Workouts", details: {} });
    if (error) return { error: "This publish action could not start. Refresh its delivery history before retrying." };
  } else {
    const { data: claim, error } = await db.from("cron_runs").update({ status: "running" }).eq("id", actionId).eq("status", "failed").select("id");
    if (error || !claim?.length) return { error: "This publish action is already being retried." };
  }
  if (!publication) {
    try { publication = await change(); }
    catch (e) { publication = { workouts: [], held: 0, error: e instanceof Error ? e.message : "Publication failed" }; }
    const { error } = await db.from("cron_runs").update({ details: { publication } }).eq("id", actionId);
    if (error) return { error: `${publication.workouts.length} workouts published, but the action history could not be saved; announcements were not attempted. Check history before retrying.` };
  }
  const announcement = await announcePublishedSmartyWorkouts(db, actionId, publication.workouts);
  const result: PublicationResult = { count: publication.workouts.length, held: publication.held, announcement, ...(publication.error ? { publicationError: publication.error } : {}) };
  const { error } = await db.from("cron_runs").update({
    status: announcement.error ? "failed" : "ok", changed: result.count > 0,
    summary: `${result.count} workout(s) published; ${result.held} held. ${publicationDeliverySummary(announcement)}${publication.error ? ` Publication stopped: ${publication.error}` : ""}`.slice(0, 1000),
    details: { publication, result },
  }).eq("id", actionId);
  if (error) result.announcement.error = [result.announcement.error, "Delivery history could not be finalized; check history before retrying."].filter(Boolean).join("; ");
  return result;
}

/** Only successfully transitioned rows are announced, including partial success. */
export async function publishSmartyIds(db: SupabaseClient, ids: string[], held: number): Promise<PublicationChange> {
  const workouts: PublishedWorkout[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db.from("smarty_workouts").update({ is_visible: true, updated_at: new Date().toISOString() }).in("id", ids.slice(i, i + 100)).eq("is_visible", false).select("id,name,category");
    if (error) return { workouts, held, error: error.message };
    workouts.push(...(data ?? []));
  }
  return { workouts, held };
}