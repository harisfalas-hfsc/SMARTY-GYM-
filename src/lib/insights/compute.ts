/**
 * Smarty Insights — one deterministic weekly summary shared by the Logbook
 * section, the inbox message, the weekly email and the PDF. Pure: no I/O.
 */

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
export interface InsightResultRow { performed_at: string; strength_load: number | null; conditioning_load: number | null }
export interface InsightCheckinRow { checkin_date: string; daily_smarty_score: number | null }
export interface InsightProgressRow { score: number; current_streak: number; longest_streak: number; workouts_completed: number }

export interface InsightsInput {
  workouts: InsightWorkoutRow[];
  results: InsightResultRow[];
  checkins: InsightCheckinRow[];
  progress: InsightProgressRow | null;
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
    minutes: number;
    prevMinutes: number;
    currentStreak: number;
    longestStreak: number;
    score: number;
    totalCompleted: number;
  };
  days: { date: string; label: string; count: number }[];
  categories: { category: string; count: number }[];
  missed: { name: string; date: string }[];
  untrained: string[];
  load: { week: number; average: number; trend: "up" | "steady" | "down" | "none"; recent: { weekStart: string; load: number }[] };
  checkins: { days: number; avgScore: number | null };
  upcoming: { name: string; date: string }[];
  tips: InsightTip[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HARD = new Set(["STRENGTH", "MUSCLE BUILDING", "CALORIE BURNING", "CARDIO", "METABOLIC", "CHALLENGE"]);
const TRACKED = ["STRENGTH", "CARDIO", "MOBILITY & STABILITY", "RECOVERY"];

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday on or before the given local date. */
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

  const missed = live
    .filter((w) => w.status !== "completed" && w.scheduled_at)
    .map((w) => ({ name: w.name, date: toLocalDate(w.scheduled_at as string) }))
    .filter((m) => within(m.date, weekStart, weekEnd) && m.date < today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcomingFrom = today;
  const upcoming = live
    .filter((w) => w.status !== "completed" && w.scheduled_at)
    .map((w) => ({ name: w.name, date: toLocalDate(w.scheduled_at as string) }))
    .filter((u) => u.date >= upcomingFrom && u.date <= addDays(upcomingFrom, 7))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const fourteenAgo = addDays(weekEnd, -13);
  const recentCats = new Set(completed.filter((w) => within(w.day, fourteenAgo, weekEnd)).map((w) => w.category));
  const untrained = completed.length ? TRACKED.filter((c) => !recentCats.has(c)) : [];

  // Training load: the stored session loads (same formula as Training Load).
  const loadOf = (from: string, to: string) =>
    Math.round(
      input.results
        .filter((r) => within(toLocalDate(r.performed_at), from, to))
        .reduce((s, r) => s + (Number(r.strength_load) || 0) + (Number(r.conditioning_load) || 0), 0),
    );
  const recent = [-4, -3, -2, -1, 0].map((k) => {
    const s = addDays(weekStart, k * 7);
    return { weekStart: s, load: loadOf(s, addDays(s, 6)) };
  });
  const week = recent[4]!.load;
  const prior = recent.slice(0, 4).map((r) => r.load).filter((v) => v > 0);
  const average = prior.length ? Math.round(prior.reduce((a, b) => a + b, 0) / prior.length) : 0;
  const trend: WeeklyInsights["load"]["trend"] =
    !week && !average ? "none" : !average ? "up" : week > average * 1.3 ? "up" : week < average * 0.7 ? "down" : "steady";

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
    minutes: minutes(thisWeek),
    prevMinutes: minutes(lastWeek),
    currentStreak: p?.current_streak ?? 0,
    longestStreak: p?.longest_streak ?? 0,
    score: p?.score ?? 0,
    totalCompleted: p?.workouts_completed ?? completed.length,
  };

  // Longest run of consecutive hard days this week with no recovery-type session.
  let run = 0;
  let maxHardRun = 0;
  for (const d of days) {
    const sessions = thisWeek.filter((w) => w.day === d.date);
    const hard = sessions.some((w) => HARD.has(w.category));
    const easy = sessions.some((w) => !HARD.has(w.category));
    run = hard && !easy ? run + 1 : 0;
    maxHardRun = Math.max(maxHardRun, run);
  }

  const strengthShare = thisWeek.length
    ? thisWeek.filter((w) => w.category === "STRENGTH" || w.category === "MUSCLE BUILDING").length / thisWeek.length
    : 0;
  const sharedAny = live.some((w) => w.is_shared);
  const createdAny = live.some(
    (w) =>
      !w.community_source_id &&
      !w.is_wod &&
      w.created_by !== "community" &&
      !(w.created_by ?? "").startsWith("smarty:"),
  );
  const nextWeekPlanned = upcoming.length > 0;

  const tips: InsightTip[] = [];
  const add = (t: InsightTip) => tips.push(t);
  if (thisWeek.length === 0)
    add({ id: "restart", emoji: "🌱", title: "A gentle restart", body: "One session is all it takes to get moving again. Today's Workout of the Day is ready for you.", href: "/wod", label: "Open the WOD" });
  if (maxHardRun >= 3 && !thisWeek.some((w) => w.category === "RECOVERY"))
    add({ id: "recovery", emoji: "🧘", title: "Recover to perform", body: `You trained hard ${maxHardRun} days in a row. A Recovery session between harder days helps you come back stronger.`, href: "/smarty-workouts/category/recovery", label: "Recovery workouts" });
  if (thisWeek.length >= 2 && strengthShare > 0.7)
    add({ id: "cardio", emoji: "❤️", title: "Balance your strength with cardio", body: "Most of your week was strength work. Add a Cardio or Metabolic session to build your engine too.", href: "/smarty-workouts/category/cardio", label: "Cardio workouts" });
  if (completed.length && untrained.includes("MOBILITY & STABILITY"))
    add({ id: "mobility", emoji: "🤸", title: "Don't forget mobility", body: "No Mobility & Stability in the last two weeks. A short session keeps your joints happy and your lifts cleaner.", href: "/smarty-workouts/category/mobility-stability", label: "Mobility & Stability" });
  if (trend === "up" && average > 0)
    add({ id: "load", emoji: "📈", title: "Big jump in training load", body: "This week was well above your recent average. Keep the next few days a little lighter so your body adapts.", href: "/training-load-science", label: "About Training Load" });
  if (thisWeek.length >= 5 && !sharedAny)
    add({ id: "share", emoji: "🤝", title: "Share the way you train", body: `${thisWeek.length} workouts this week — impressive! Share one of your own so other members can train your way.`, href: "/shared-workouts", label: "Shared Workouts" });
  if (!createdAny)
    add({ id: "create", emoji: "🛠️", title: "Build your own workout", body: "Let Smarty Coach design a session around your goals and equipment, or build one yourself.", href: "/create-your-own-workout", label: "Create Your Own Workout" });
  if (checkins.days === 0)
    add({ id: "checkins", emoji: "📝", title: "Check in daily", body: "A 30-second check-in on sleep, energy and mood helps you see what really drives your training.", href: "/smarty-checkins", label: "Smarty Check-ins" });
  if (!nextWeekPlanned)
    add({ id: "plan", emoji: "🗓️", title: "Plan your week", body: "Workouts that are scheduled get done. Put your next sessions in your calendar.", href: "/logbook?view=calendar", label: "Open Calendar" });
  if (kpis.currentStreak >= 7)
    add({ id: "streak", emoji: "🔥", title: "Keep the streak alive", body: `${kpis.currentStreak} days in a row! Today's Smarty Ritual keeps the momentum going.`, href: "/smarty-ritual", label: "Smarty Ritual" });
  if (tips.length < 3)
    add({ id: "explore", emoji: "✨", title: "Try something new", body: "Explore a category you haven't tried yet and challenge your body in a new way.", href: "/smarty-workouts", label: "Smarty Workouts" });

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
    missed,
    untrained,
    load: { week, average, trend, recent },
    checkins,
    upcoming,
    tips: tips.slice(0, 5),
  };
}
