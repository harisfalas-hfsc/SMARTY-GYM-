import { SITE_URL } from "@/lib/seo/site";

export type WorkoutShareTarget = { kind: "smarty" | "community"; id: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Never distribute a private logbook ID, including a member's saved copy. */
export function workoutShareTarget(workout: {
  id: string;
  created_by: string | null;
  community_source_id?: string | null;
  is_shared?: boolean | null;
  deleted_at?: string | null;
}): WorkoutShareTarget | null {
  if (workout.deleted_at) return null;
  const smartyId = workout.created_by?.startsWith("smarty:") ? workout.created_by.slice(7) : null;
  if (smartyId && UUID.test(smartyId)) return { kind: "smarty", id: smartyId };
  if (workout.community_source_id && UUID.test(workout.community_source_id))
    return { kind: "community", id: workout.community_source_id };
  if (workout.is_shared && UUID.test(workout.id)) return { kind: "community", id: workout.id };
  return null;
}

export function workoutShareUrl(target: WorkoutShareTarget): string {
  return `${SITE_URL}/${target.kind === "smarty" ? "smarty-workouts" : "community/workout"}/${target.id}`;
}

/** Capture only the on-screen headline card, never the exercise sections. */
export async function captureWorkoutShareCard(header: HTMLElement, name: string): Promise<File> {
  await document.fonts.ready;
  await Promise.all(Array.from(header.querySelectorAll("img")).map((img) => img.decode().catch(() => undefined)));
  const { default: html2canvas } = await import("html2canvas-pro");
  const canvas = await html2canvas(header, {
    scale: 2, useCORS: true, logging: false,
    backgroundColor: getComputedStyle(header).backgroundColor,
    onclone: (doc) => {
      doc.querySelectorAll<HTMLElement>("[data-share-creator]").forEach((el) => {
        if (el.dataset.shareCreator) el.textContent = el.dataset.shareCreator;
      });
    },
  });
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (value) => value ? resolve(value) : reject(new Error("Could not prepare workout picture")), "image/png",
  ));
  return new File([blob], `${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 80)}-SmartyGym.png`, { type: "image/png" });
}