import type { ActivityEvent, ActivityKind } from "./activity";

const LIVE_HOSTS = ["smartygym.com", "www.smartygym.com", "thesmartygym.lovable.app"];

/**
 * Sample activity and sample workouts are shown automatically in the editor preview only
 * (never on the published site), on top of the real data. ?demoActivity=0 hides them for the tab.
 * Nothing is saved to the database.
 */
export function demoActivityOn(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search).get("demoActivity");
  if (p === "0") sessionStorage.setItem("sg-demo-activity", "off");
  if (p === "1") sessionStorage.removeItem("sg-demo-activity");
  if (sessionStorage.getItem("sg-demo-activity") === "off") return false;
  return !LIVE_HOSTS.includes(window.location.hostname);
}

export const SAMPLE_PREFIX = "sample-";
export const isSampleId = (id: string) => id.startsWith(SAMPLE_PREFIX);

const ALL: [ActivityKind, string][] = [
  ["checkin", "Morning Check-in"], ["created", "Cardio Intervals"], ["added", "Workout of the Day"],
  ["favorited", "Cardio Intervals"], ["completed", "Workout of the Day"], ["shared", "Cardio Intervals"],
  ["reaction", "Liked a shared workout"], ["comment", "Commented on a shared workout"], ["rating", "Rated a shared workout"], ["checkin", "Night Check-in"],
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (now: Date) => { const m = startOfDay(now); m.setDate(m.getDate() - (m.getDay() + 6) % 7); return m; };
const shift = (base: Date, days: number, hour: number, minute = 0) => {
  const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(hour, minute, 0, 0); return d;
};

/** Sample events around `now`: Monday and today full, Tuesday empty, last week mixed. */
export function demoEvents(now: Date): ActivityEvent[] {
  const monday = mondayOf(now);
  const out: ActivityEvent[] = [];
  const day = (offset: number, picks: number[]) => picks.forEach((i, n) => {
    const [kind, label] = ALL[i]!; out.push({ at: shift(monday, offset, 7 + n, 10 + n * 3).toISOString(), kind, label, sample: true });
  });
  day(0, ALL.map((_, i) => i));                 // Monday: everything
  const todayOffset = Math.round((startOfDay(now).getTime() - monday.getTime()) / 864e5);
  if (todayOffset > 1) ALL.forEach(([kind, label], n) => { // today: everything, all before now
    out.push({ at: new Date(now.getTime() - (ALL.length - n) * 60_000 * 5).toISOString(), kind, label, sample: true });
  });
  day(-7, [0, 4, 9]); day(-6, [7]); day(-5, [0, 1, 4]); day(-3, [6, 8]); day(-2, [0, 2, 4, 5]); // last week
  return out.filter(e => new Date(e.at) <= now);
}

export type SampleWorkout = {
  id: string; name: string; category: string; duration_min: number; difficulty_stars: number;
  difficulty_label: string | null; mood: string | null; status: string; is_favorite: boolean | null;
  scheduled_at: string | null; completed_at: string | null; created_at: string; is_wod: boolean | null;
  created_by: string | null; equipment: string[] | null;
  workout_feedback: Array<{ difficulty_rating: string | null; feeling: string | null }>;
};

/**
 * Sample workouts so every calendar mark can be seen: planned today and later (green),
 * planned but missed (red), saved but not done (grey) and one completed.
 */
export function demoWorkouts(now: Date): SampleWorkout[] {
  const today = startOfDay(now);
  const monday = mondayOf(now);
  const base = (id: string, name: string, category: string, extra: Partial<SampleWorkout>): SampleWorkout => ({
    id: `${SAMPLE_PREFIX}${id}`, name, category, duration_min: 45, difficulty_stars: 3, difficulty_label: null,
    mood: null, status: "ready", is_favorite: false, scheduled_at: null, completed_at: null,
    created_at: shift(today, -10, 9).toISOString(), is_wod: false, created_by: "smarty:sample", equipment: null,
    workout_feedback: [], ...extra,
  });
  return [
    base("today", "Upper Body Builder", "STRENGTH", { scheduled_at: shift(today, 0, 18).toISOString() }),
    base("soon", "Full Body Burn", "CALORIE BURNING", { duration_min: 30, scheduled_at: shift(today, 2, 7, 30).toISOString() }),
    base("later", "Leg Day Strength", "STRENGTH", { duration_min: 50, scheduled_at: shift(today, 6, 18).toISOString(), equipment: ["dumbbells"] }),
    base("missed", "Core Stability Flow", "MOBILITY & STABILITY", { duration_min: 25, scheduled_at: shift(today, -3, 8).toISOString() }),
    base("saved", "Cardio Intervals", "MY OWN WORKOUT", { duration_min: 35, created_by: null, is_favorite: true, created_at: shift(monday, 0, 8, 13).toISOString() }),
    base("done", "Workout of the Day", "CARDIO", { is_wod: true, status: "completed", created_at: shift(monday, 0, 9, 16).toISOString(), completed_at: shift(monday, 0, 11, 22).toISOString() }),
  ];
}
