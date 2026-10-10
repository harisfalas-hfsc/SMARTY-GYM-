/**
 * Smarty Insights — one deterministic weekly summary shared by the Logbook
 * section, the inbox message and the weekly email. Pure: no I/O.
 * Weeks are Monday–Sunday in the member's own timezone.
 */
import type { LoadState } from "@/lib/performance/types";

export interface InsightWorkoutRow {
  id: string;
  name: string;
  category: string;
  status: string;
  completed_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  duration_min: number | null;
  is_shared: boolean | null;
  is_wod: boolean | null;
  created_by: string | null;
  community_source_id: string | null;
  deleted_at: string | null;
}
export interface InsightCheckinRow {
  checkin_date: string;
  daily_smarty_score: number | null;
}
export interface InsightProgressRow { score: number; current_streak: number; longest_streak: number; workouts_completed: number }

/** Training Load for the reported week, produced by the existing src/lib/performance functions. */
export interface InsightsLoad {
  state: LoadState;
  /** Logged sessions (set logs or results) per week, oldest first; last = reported week. */
  recent: { weekStart: string; sessions: number }[];
}

export interface InsightsInput {
  workouts: InsightWorkoutRow[];
  checkins: InsightCheckinRow[];
  progress: InsightProgressRow | null;
  load: InsightsLoad;
  /** Monday of the reported week, YYYY-MM-DD (member's local calendar). */
  weekStart: string;
  /** Today's local date, YYYY-MM-DD. */
  today: string;
  /** Converts a timestamp to the member's local YYYY-MM-DD. */
  toLocalDate: (iso: string) => string;
}

export interface InsightTip { id: string; emoji: string; title: string; body: string; href: string; label: string }

export interface WeeklyInsights {
  weekStart: string;
  weekEnd: string;
  hasHistory: boolean;
  headline: { emoji: string; text: string };
  kpis: {
    completed: number;
    prevCompleted: number;
    activeDays: number;
    /** Planned length of completed workouts, in minutes. */
    plannedMinutes: number;
    prevPlannedMinutes: number;
    /** null = no saved progress yet (missing data, not zero). */
    currentStreak: number | null;
    longestStreak: number | null;
    score: number | null;
    totalCompleted: number | null;
  };
  days: { date: string; label: string; count: number }[];
  categories: { category: string; count: number }[];
  /** Workouts with status "scheduled" whose date passed this week without completion. */
  notCompleted: { name: string; date: string }[];
  untrained: string[];
  load: InsightsLoad;
  /** days = check-ins this week; avgScore null = no scored check-ins. */
  checkins: { days: number; avgScore: number | null };
  upcoming: { name: string; date: string }[];
  tips: InsightTip[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Real Smarty category taxonomy. */
export const HARD_CATEGORIES = new Set(["STRENGTH", "MUSCLE BUILDING", "CALORIE BURNING", "CARDIO", "METABOLIC", "CHALLENGE"]);
const TRACKED = ["STRENGTH", "CARDIO", "MOBILITY & STABILITY", "RECOVERY"];

/** Explicit coaching thresholds. */
export const TIP_RULES = {
  strengthShare: 0.7,
  strengthShareMinWorkouts: 2,
  hardDaysInARow: 3,
  untrainedDays: 14,
  shareMinWorkouts: 5,
  streakDays: 7,
  minTips: 3,
  maxTips: 5,
} as const;

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday on or before the given local date. Calendar maths only, so DST never shifts it. */
export function mondayOf(iso: string): string {
  const dow = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

export function titleCase(category: string): string {
  return category
    .toLowerCase()
    .split(" ")
    .map((w) => (w === "&" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

const within = (d: string, from: string, to: string) => d >= from && d <= to;

const TIP_LIBRARY: Record<string, (x: { n: number }) => InsightTip> = {
  recovery: ({ n }) => ({ id: "recovery", emoji: "🧘", title: "Recover to perform", body: `You trained hard ${n} days in a row. A Recovery session between harder days helps you come back stronger.`, href: "/smarty-workouts/category/recovery", label: "Recovery workouts" }),
  load: () => ({ id: "load", emoji: "📈", title: "High training load", body: "Your Training Load is high compared with your own recent weeks. Keep the next few days a little lighter so your body adapts.", href: "/training-load-science", label: "About Training Load" }),
  restart: () => ({ id: "restart", emoji: "🌱", title: "A gentle restart", body: "One session is all it takes to get moving again. Today's Workout of the Day is ready for you.", href: "/wod", label: "Open the WOD" }),
  cardio: () => ({ id: "cardio", emoji: "❤️", title: "Balance your strength with cardio", body: "Most of your week was strength work. Add a Cardio or Metabolic session to build your engine too.", href: "/smarty-workouts/category/cardio", label: "Cardio workouts" }),
  mobility: () => ({ id: "mobility", emoji: "🤸", title: "Don't forget mobility", body: "No Mobility & Stability in the last two weeks. A short session keeps your joints happy and your lifts cleaner.", href: "/smarty-workouts/category/mobility-stability", label: "Mobility & Stability" }),
  plan: () => ({ id: "plan", emoji: "🗓️", title: "Plan your week", body: "Workouts that are scheduled get done. Put your next sessions in your calendar.", href: "/logbook?view=calendar", label: "Open Calendar" }),
  checkins: () => ({ id: "checkins", emoji: "📝", title: "Check in daily", body: "A 30-second check-in on sleep, energy and mood helps you see what really drives your training.", href: "/smarty-checkins", label: "Smarty Check-ins" }),
  create: () => ({ id: "create", emoji: "🛠️", title: "Build your own workout", body: "Let Smarty Coach design a session around your goals and equipment, or build one yourself.", href: "/create-your-own-workout", label: "Create Your Own Workout" }),
  share: ({ n }) => ({ id: "share", emoji: "🤝", title: "Share the way you train", body: `${n} workouts this week — impressive! Share one of your own so other members can train your way.`, href: "/shared-workouts", label: "Shared Workouts" }),
  streak: ({ n }) => ({ id: "streak", emoji: "🔥", title: "Keep the streak alive", body: `${n} days in a row! Today's Smarty Ritual keeps the momentum going.`, href: "/smarty-ritual", label: "Smarty Ritual" }),
  explore: () => ({ id: "explore", emoji: "✨", title: "Try something new", body: "Explore a category you haven't tried yet and challenge your body in a new way.", href: "/smarty-workouts", label: "Smarty Workouts" }),
  ritual: () => ({ id: "ritual", emoji: "🌅", title: "Start your day with the Ritual", body: "Small daily habits build big results. Today's Smarty Ritual takes only a few minutes.", href: "/smarty-ritual", label: "Smarty Ritual" }),
  library: () => ({ id: "library", emoji: "📚", title: "Learn a new exercise", body: "Browse the Exercise Library and add a movement you like to your favourites.", href: "/exercise-library", label: "Exercise Library" }),
};
/** Fixed filler order used to guarantee the minimum number of tips. */

/**
 * Priority order (first wins when more than five apply):
 * 1 safety (recovery, load) · 2 restart · 3 balance (cardio, mobility)
 * 4 habits (plan, check-ins) · 5 growth (create, share, streak) · 6 fillers.
 * Conflicts: a zero-workout week gets no load/share/streak/balance tips;
 * the recovery tip suppresses the "add more" cardio tip in the same week.
 */
export function selectTips(f: {
  completed: number;
  maxHardRun: number;
  hadRecovery: boolean;
  strengthShare: number;
  mobilityMissing: boolean;
  loadHigh: boolean;
  plannedAhead: boolean;
  checkinDays: number;
  createdAny: boolean;
  sharedAny: boolean;
  streak: number | null;
}): InsightTip[] {
  const ids: { id: string; n?: number }[] = [];
  const zero = f.completed === 0;
  const recovery = !zero && f.maxHardRun >= TIP_RULES.hardDaysInARow && !f.hadRecovery;
  if (recovery) ids.push({ id: "recovery", n: f.maxHardRun });
  if (!zero && f.loadHigh) ids.push({ id: "load" });
  if (!zero && !recovery && f.completed >= TIP_RULES.strengthShareMinWorkouts && f.strengthShare > TIP_RULES.strengthShare) ids.push({ id: "cardio" });
  if (!zero && f.mobilityMissing) ids.push({ id: "mobility" });
  if (!f.plannedAhead) ids.push({ id: "plan" });
  if (f.checkinDays === 0) ids.push({ id: "checkins" });
  if (!f.createdAny) ids.push({ id: "create" });
  if (!zero && f.completed >= TIP_RULES.shareMinWorkouts && !f.sharedAny) ids.push({ id: "share", n: f.completed });
  if (!zero && (f.streak ?? 0) >= TIP_RULES.streakDays) ids.push({ id: "streak", n: f.streak ?? 0 });
  return ids.slice(0, TIP_RULES.maxTips).map((x) => TIP_LIBRARY[x.id]!({ n: x.n ?? 0 }));
}

export function computeWeeklyInsights(input: InsightsInput): WeeklyInsights {
  const { weekStart, today, toLocalDate } = input;
  const weekEnd = addDays(weekStart, 6);
  const prevStart = addDays(weekStart, -7);
  const live = input.workouts.filter((w) => !w.deleted_at);
  const completed = live
    .filter((w) => w.status === "completed" && w.completed_at)
    .map((w) => ({ ...w, day: toLocalDate(w.completed_at as string) }));

  const thisWeek = completed.filter((w) => within(w.day, weekStart, weekEnd));
  const lastWeek = completed.filter((w) => within(w.day, prevStart, addDays(weekStart, -1)));
  const minutes = (rows: typeof thisWeek) => rows.reduce((s, w) => s + (w.duration_min ?? 0), 0);

  const days = DAY_LABELS.map((label, i) => {
    const date = addDays(weekStart, i);
    return { date, label, count: thisWeek.filter((w) => w.day === date).length };
  });

  const catMap = new Map<string, number>();
  for (const w of thisWeek) catMap.set(w.category, (catMap.get(w.category) ?? 0) + 1);
  const categories = [...catMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  // Only an explicit "scheduled" status counts; any other status is not inferred as missed.
  const scheduled = live
    .filter((w) => w.status === "scheduled" && w.scheduled_at)
    .map((w) => ({ name: w.name, date: toLocalDate(w.scheduled_at as string) }));
  const notCompleted = scheduled
    .filter((m) => within(m.date, weekStart, weekEnd) && m.date < today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = scheduled
    .filter((u) => u.date >= today && u.date <= addDays(today, 7))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const windowStart = addDays(weekEnd, -(TIP_RULES.untrainedDays - 1));
  const recentCats = new Set(completed.filter((w) => within(w.day, windowStart, weekEnd)).map((w) => w.category));
  const untrained = completed.length ? TRACKED.filter((c) => !recentCats.has(c)) : [];

  const weekCheckins = input.checkins.filter((c) => within(c.checkin_date, weekStart, weekEnd));
  const scored = weekCheckins.map((c) => c.daily_smarty_score).filter((v): v is number => typeof v === "number");
  const checkins = {
    days: weekCheckins.length,
    avgScore: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
  };
  const p = input.progress;
  const kpis = {
    completed: thisWeek.length,
    prevCompleted: lastWeek.length,
    activeDays: days.filter((d) => d.count > 0).length,
    plannedMinutes: minutes(thisWeek),
    prevPlannedMinutes: minutes(lastWeek),
    currentStreak: p ? p.current_streak : null,
    longestStreak: p ? p.longest_streak : null,
    score: p ? p.score : null,
    totalCompleted: p ? p.workouts_completed : null,
  };

  let run = 0;
  let maxHardRun = 0;
  for (const d of days) {
    const sessions = thisWeek.filter((w) => w.day === d.date);
    const hard = sessions.some((w) => HARD_CATEGORIES.has(w.category));
    const easy = sessions.some((w) => !HARD_CATEGORIES.has(w.category));
    run = hard && !easy ? run + 1 : 0;
    maxHardRun = Math.max(maxHardRun, run);
  }

  const tips = selectTips({
    completed: thisWeek.length,
    maxHardRun,
    hadRecovery: thisWeek.some((w) => w.category === "RECOVERY"),
    strengthShare: thisWeek.length
      ? thisWeek.filter((w) => w.category === "STRENGTH" || w.category === "MUSCLE BUILDING").length / thisWeek.length
      : 0,
    mobilityMissing: untrained.includes("MOBILITY & STABILITY"),
    loadHigh: input.load.state === "High" || input.load.state === "Very High",
    plannedAhead: upcoming.length > 0,
    checkinDays: checkins.days,
    createdAny: live.some(
      (w) => !w.community_source_id && !w.is_wod && w.created_by !== "community" && !(w.created_by ?? "").startsWith("smarty:"),
    ),
    sharedAny: live.some((w) => w.is_shared),
    streak: kpis.currentStreak,
  });

  const headline =
    thisWeek.length === 0
      ? { emoji: "🌱", text: "Your next week starts now" }
      : thisWeek.length > lastWeek.length && thisWeek.length >= 3
        ? { emoji: "💪", text: "Your strongest week in a while" }
        : thisWeek.length > lastWeek.length
          ? { emoji: "🚀", text: "More training than last week" }
          : thisWeek.length === lastWeek.length
            ? { emoji: "🎯", text: "Steady and consistent" }
            : { emoji: "⚡", text: "Every session counts — keep going" };

  return {
    weekStart,
    weekEnd,
    hasHistory: completed.length > 0,
    headline,
    kpis,
    days,
    categories,
    notCompleted,
    untrained,
    load: input.load,
    checkins,
    upcoming,
    tips,
  };
}
