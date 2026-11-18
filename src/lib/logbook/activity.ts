import { dayKey } from "./rows";

/** Every member action recorded in the Logbook calendar and the home weekly strip. */
export type ActivityKind = "completed" | "created" | "added" | "shared" | "favorited" | "checkin" | "comment" | "reaction" | "rating";
export type ActivityEvent = { at: string; kind: ActivityKind; label: string };

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  completed: "Workout completed", created: "Workout created", added: "Workout added to Logbook",
  shared: "Workout shared", favorited: "Workout favourited", checkin: "Smarty Check-in",
  comment: "Comment posted", reaction: "Workout liked", rating: "Workout rated",
};

type WorkoutRow = { name: string | null; created_by: string | null; created_at: string | null; completed_at: string | null; status: string | null; shared_at: string | null; favorited_at: string | null };
type CheckinRow = { morning_completed_at: string | null; night_completed_at: string | null };
export type ActivitySource = { workouts: WorkoutRow[]; checkins: CheckinRow[]; comments: { created_at: string }[]; reactions: { created_at: string }[]; ratings: { created_at: string }[] };

/** Pure: turns owner rows into dated events. */
export function activityEvents(s: ActivitySource): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  const push = (at: string | null, kind: ActivityKind, label: string) => { if (at) out.push({ at, kind, label }); };
  for (const w of s.workouts) {
    const name = w.name ?? "Workout";
    const origin = w.created_by ?? "";
    push(w.created_at, origin.startsWith("smarty") || origin === "community" ? "added" : "created", name);
    if (w.status === "completed") push(w.completed_at, "completed", name);
    push(w.shared_at, "shared", name);
    push(w.favorited_at, "favorited", name);
  }
  for (const c of s.checkins) { push(c.morning_completed_at, "checkin", "Morning Check-in"); push(c.night_completed_at, "checkin", "Night Check-in"); }
  for (const c of s.comments) push(c.created_at, "comment", "Community");
  for (const r of s.reactions) push(r.created_at, "reaction", "Community");
  for (const r of s.ratings) push(r.created_at, "rating", "Community");
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/** Local day key → events of that day, ignoring anything in the future. */
export function eventsByDay(events: ActivityEvent[], now = new Date()) {
  const map = new Map<string, ActivityEvent[]>();
  for (const e of events) {
    const d = new Date(e.at);
    if (!Number.isFinite(d.getTime()) || d > now) continue;
    const k = dayKey(d);
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return map;
}

/** Short one-line summary such as "1 workout completed · 1 Smarty Check-in". */
export function briefing(events: ActivityEvent[]) {
  const counts = new Map<ActivityKind, number>();
  for (const e of events) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  return [...counts].map(([k, n]) => `${n} × ${ACTIVITY_LABEL[k]}`).join(" · ");
}
