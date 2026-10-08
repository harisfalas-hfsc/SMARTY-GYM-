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

export function announcementInboxContent(announcement: WorkoutAnnouncement) {
  return {
    title: announcement.heading,
    body: [announcement.body, announcement.workoutName, announcement.supportingText].filter(Boolean).join("\n\n"),
    dedupeKey: announcement.dedupeKey,
  };
}

export function wantsAnnouncementEmail(
  preferences: { email_new_workouts?: boolean; email_shared_workouts?: boolean },
  dedupeKey: string,
): boolean {
  if (dedupeKey.startsWith("new-workout:")) return preferences.email_new_workouts !== false;
  if (dedupeKey.startsWith("shared-workout:")) return preferences.email_shared_workouts !== false;
  return true;
}