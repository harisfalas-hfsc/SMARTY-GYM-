// Today's training state — pure and deterministic. Shared by the arrival floor
// and Smarty Coach so both always say the same thing about the member's day.
//
// Priority: completed today > unfinished today > scheduled today > recently
// created own workout > ready to train (today's Workouts of the Day).

export type DailyStatusKind = "completed" | "unfinished" | "scheduled" | "custom_ready" | "ready";

export type DailyWorkoutRow = {
  id: string;
  name: string;
  status: string;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
};

export type DailyStatus = {
  kind: DailyStatusKind;
  workout: { id: string; name: string; smartyId: string | null } | null;
  /** Unfinished only: true when sets were logged today (started), false when only opened. */
  started?: boolean;
  title: string;
  message: string;
};

/** Days an own, never-trained workout stays "ready" on the arrival floor. */
export const CUSTOM_READY_DAYS = 2;

const smartyIdOf = (c: string | null) => (c && c.startsWith("smarty:") ? c.slice(7) : null);

export function dailyStatus(input: {
  /** Local yyyy-mm-dd for the member. */
  today: string;
  /** Converts an ISO time into the member's local yyyy-mm-dd. */
  dayOf: (iso: string) => string;
  workouts: DailyWorkoutRow[];
  /** Workouts with sets logged today. */
  loggedTodayIds: string[];
  now?: Date;
}): DailyStatus {
  const { today, dayOf, workouts } = input;
  const now = input.now ?? new Date();
  const ref = (w: DailyWorkoutRow) => ({ id: w.id, name: w.name, smartyId: smartyIdOf(w.created_by) });
  const latest = (rows: DailyWorkoutRow[], key: (w: DailyWorkoutRow) => string) =>
    [...rows].sort((a, b) => key(b).localeCompare(key(a)))[0];

  const done = workouts.filter((w) => w.status === "completed" && w.completed_at && dayOf(w.completed_at) === today);
  if (done.length) {
    const w = latest(done, (r) => r.completed_at ?? "");
    return {
      kind: "completed", workout: ref(w),
      title: "Session complete",
      message: `Great work on ${w.name} today. Your focus now is recovery: do today's Smarty Ritual and check your updated Training Load.`,
    };
  }

  const logged = new Set(input.loggedTodayIds);
  const open = workouts.filter((w) => w.status !== "completed" && w.status !== "scheduled" &&
    (logged.has(w.id) || (smartyIdOf(w.created_by) !== null && dayOf(w.created_at) === today)));
  if (open.length) {
    const started = open.filter((w) => logged.has(w.id));
    const w = latest(started.length ? started : open, (r) => r.updated_at);
    return started.length
      ? { kind: "unfinished", workout: ref(w), started: true, title: "Finish your session",
          message: `You started ${w.name} today. Finish it, or mark it complete so your Logbook and Training Load stay accurate.` }
      : { kind: "unfinished", workout: ref(w), started: false, title: "Did you train today?",
          message: `You opened ${w.name} today. If you did it, mark it complete and log your numbers so your Training Load stays accurate.` };
  }

  const planned = workouts.filter((w) => w.status === "scheduled" && w.scheduled_at && dayOf(w.scheduled_at) === today);
  if (planned.length) {
    const w = [...planned].sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))[0];
    return {
      kind: "scheduled", workout: ref(w),
      title: "Scheduled for today",
      message: `${w.name} is on your calendar today. Start it now, or choose one of today's Workouts of the Day instead.`,
    };
  }

  const cutoff = now.getTime() - CUSTOM_READY_DAYS * 86_400_000;
  const own = workouts.filter((w) => w.status === "created" && !smartyIdOf(w.created_by) && w.created_by !== "community" &&
    !w.completed_at && new Date(w.created_at).getTime() >= cutoff);
  if (own.length) {
    const w = latest(own, (r) => r.created_at);
    return {
      kind: "custom_ready", workout: ref(w),
      title: "Your workout is ready",
      message: `You built ${w.name} and haven't trained it yet. Start it today, or take on one of today's Workouts of the Day.`,
    };
  }

  return { kind: "ready", workout: null, title: "Workouts of the Day", message: "" };
}
