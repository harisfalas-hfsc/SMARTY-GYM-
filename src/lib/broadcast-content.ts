const SITE_URL = "https://smartygym.com";

export interface WorkoutAnnouncement {
  dedupeKey: string;
  subject: string;
  heading: string;
  body: string;
  workoutName?: string;
  supportingText?: string;
  buttonHref: string;
  buttonLabel?: string;
  exclude?: string;
}

export const SHARED_WORKOUT_LINES = [
  "{name} just shared a workout. Feeling in the mood to do it?",
  "{name} just shared a workout — let's check it out!",
  "{name} just shared a workout. Let's crush it!",
  "New from {name}: a freshly shared workout is waiting for you.",
  "{name} just shared a workout. Up for the challenge?",
  "{name} just dropped a new shared workout — ready to give it a go?",
  "{name} just shared a workout. Your next session might be right here.",
];

export function sharedWorkoutLine(name: string, workoutId: string): string {
  let h = 0;
  for (const c of workoutId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (SHARED_WORKOUT_LINES[h % SHARED_WORKOUT_LINES.length] ?? "{name} just shared a workout.").replace("{name}", name);
}

export function newWorkoutAnnouncement(id: string, name: string): WorkoutAnnouncement {
  return {
    dedupeKey: `new-workout:${id}`,
    subject: `🏋️ New Workout: ${name}`,
    heading: "New Workout Added!",
    body: "A new workout has been added to the SMARTYGYM library!",
    workoutName: name,
    supportingText: "Designed by Sports Scientist HARIS FALAS to help you achieve your fitness goals.",
    buttonLabel: "View Workout",
    buttonHref: `${SITE_URL}/smarty-workouts/${id}`,
  };
}

export type PublishedWorkout = { id: string; name: string; category: string };

/** One publication action, one destination, regardless of batch size. */
export function publishedWorkoutsAnnouncement(actionId: string, workouts: PublishedWorkout[]): WorkoutAnnouncement {
  const unique = [...new Map(workouts.map((w) => [w.id, w])).values()];
  const first = unique[0];
  if (!first) throw new Error("No workouts were published");
  const categories = [...new Set(unique.map((w) => w.category))];
  const label = (category: string) => category.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const slug = (category: string) => category.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
  const category = categories.length === 1 ? first.category : null;
  const path = unique.length === 1 ? `/smarty-workouts/${first.id}` : category ? `/smarty-workouts/category/${slug(category)}` : "/smarty-workouts";
  const single = unique.length === 1;
  const countText = category ? `${unique.length} new ${label(category)} workouts` : `${unique.length} new workouts`;
  return {
    dedupeKey: `new-workout-publish:${actionId}:${encodeURIComponent(path)}`,
    subject: single ? `🏋️ New Workout: ${first.name}` : `🏋️ ${countText} added`,
    heading: single ? "New Workout Added!" : "New Workouts Added!",
    body: single ? "A new workout has been added to the SMARTYGYM library!" : `${countText} have been added to the SMARTYGYM library!`,
    workoutName: single ? first.name : undefined,
    supportingText: single ? "Designed by Sports Scientist HARIS FALAS to help you achieve your fitness goals." : category ? `Check them in Smarty Workouts → ${label(category)}.` : `Explore ${categories.map(label).join(", ")} in Smarty Workouts.`,
    buttonLabel: single ? "View Workout" : category ? `View ${label(category)} Workouts` : "View Smarty Workouts",
    buttonHref: `${SITE_URL}${path}`,
  };
}

/** Destination is stored with the action key; older single-workout notices still work. */
export function workoutAnnouncementDestination(key: string | null | undefined): string | null {
  if (key?.startsWith("new-workout:")) return `/smarty-workouts/${key.slice("new-workout:".length)}`;
  if (!key?.startsWith("new-workout-publish:")) return null;
  try {
    const path = decodeURIComponent(key.split(":").slice(2).join(":"));
    return /^\/smarty-workouts(?:\/(?:category\/[a-z-]+|[a-zA-Z0-9-]+))?$/.test(path) ? path : null;
  } catch { return null; }
}

export type PublishAnnouncementResult = { inbox: number; emails: number; disabled?: boolean; error?: string };

export function publicationDeliverySummary(result: PublishAnnouncementResult): string {
  if (result.disabled) return "Announcements are disabled.";
  return `${result.inbox} inbox message(s), ${result.emails} email(s) accepted for sending.${result.error ? ` Announcement failed: ${result.error}` : ""}`;
}

export function sharedWorkoutAnnouncement(id: string, name: string | undefined, creator: string, sharerId: string): WorkoutAnnouncement {
  const full = creator.trim();
  const first = full.split(/\s+/)[0] || "A member";
  const line = sharedWorkoutLine(first, id);
  return {
    dedupeKey: `shared-workout:${id}`,
    subject: line,
    heading: "New Shared Workout!",
    body: line,
    workoutName: name,
    supportingText: `Created by ${full || first}.`,
    buttonHref: `${SITE_URL}/community/workout/${id}`,
    buttonLabel: "View Workout",
    exclude: sharerId,
  };
}

/** New blog article — same branded layout as New Smarty Workout emails. */
export function newArticleAnnouncement(slug: string, title: string, excerpt: string): WorkoutAnnouncement {
  return {
    dedupeKey: `new-article:${slug}`,
    subject: `📰 New Article: ${title}`,
    heading: "New Article Published!",
    body: "A new article has been added to the SMARTYGYM blog!",
    workoutName: title,
    supportingText: excerpt.slice(0, 240),
    buttonLabel: "Read Article",
    buttonHref: `${SITE_URL}/blog/${slug}`,
  };
}

/** Manual admin broadcast: same branded email layout, any title/body. */
export function adminBroadcastAnnouncement(title: string, body: string, stamp: string): WorkoutAnnouncement {
  return {
    dedupeKey: `admin-broadcast:${stamp}`,
    subject: title,
    heading: title,
    body,
    buttonHref: SITE_URL,
    buttonLabel: "Open SMARTYGYM",
  };
}


export function announcementInboxContent(announcement: WorkoutAnnouncement) {
  return {
    title: announcement.heading,
    body: [announcement.body, announcement.workoutName, announcement.supportingText].filter(Boolean).join("\n\n"),
    dedupeKey: announcement.dedupeKey,
  };
}

export function wantsAnnouncementEmail(
  preferences: { email_new_workouts?: boolean; email_shared_workouts?: boolean; email_new_articles?: boolean },
  dedupeKey: string,
): boolean {
  if (dedupeKey.startsWith("new-workout:") || dedupeKey.startsWith("new-workout-publish:")) return preferences.email_new_workouts !== false;
  if (dedupeKey.startsWith("shared-workout:")) return preferences.email_shared_workouts !== false;
  if (dedupeKey.startsWith("new-article:")) return preferences.email_new_articles !== false;
  return true;
}