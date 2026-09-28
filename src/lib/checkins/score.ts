// Smarty Check-ins — scoring and windows, ported exactly from the old SmartyGym.
// Pure and deterministic so the server, the UI and the tests agree.

export const MORNING_WINDOW = { start: 7 * 60, end: 10 * 60, label: "07:00–10:00" } as const;
export const NIGHT_WINDOW = { start: 19 * 60, end: 22 * 60, label: "19:00–22:00" } as const;

export type CheckinRow = {
  id: string;
  checkin_date: string;
  morning_completed: boolean;
  night_completed: boolean;
  sleep_hours: number | null;
  sleep_quality: number | null;
  readiness_score: number | null;
  soreness_rating: number | null;
  mood_rating: number | null;
  steps_bucket: number | null;
  hydration_liters: number | null;
  protein_level: number | null;
  day_strain: number | null;
  sleep_score: number | null;
  readiness_score_norm: number | null;
  soreness_score: number | null;
  mood_score: number | null;
  movement_score: number | null;
  hydration_score: number | null;
  protein_score_norm: number | null;
  day_strain_score: number | null;
  daily_smarty_score: number | null;
  score_category: "red" | "orange" | "yellow" | "green" | null;
  status: string;
  morning_modal_shown: boolean;
  night_modal_shown: boolean;
};

export type MorningInput = {
  sleep_hours: number;
  sleep_quality: number;
  readiness_score: number;
  soreness_rating: number;
  mood_rating: number;
};
export type NightInput = {
  steps_bucket: number;
  hydration_liters: number;
  protein_level: number;
  day_strain: number;
};

const five: Record<number, number> = { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };

export function sleepHoursScore(h: number) {
  if (h < 5) return 2;
  if (h < 6) return 4;
  if (h < 7) return 7;
  if (h <= 9) return 10;
  return 7;
}
export const sleepScore = (h: number, q: number) =>
  Math.round((sleepHoursScore(h) + (five[q] ?? 6)) / 2);
export const sorenessScore = (r: number) => Math.max(0, Math.min(10, 10 - r));
export const moodScore = (r: number) => five[r] ?? 6;
export function movementScore(steps: number) {
  if (steps < 2000) return 2;
  if (steps < 5000) return 4;
  if (steps < 8000) return 7;
  if (steps < 10000) return 9;
  return 10;
}
export function hydrationScore(l: number) {
  if (l < 1) return 2;
  if (l < 1.5) return 4;
  if (l < 2) return 7;
  if (l < 2.5) return 9;
  return 10;
}
export const proteinScore = (lvl: number) => ({ 0: 2, 1: 4, 2: 6, 3: 8, 4: 10 })[lvl] ?? 6;
export function dayStrainScore(s: number) {
  if (s <= 2) return 5;
  if (s <= 4) return 8;
  if (s <= 7) return 10;
  return 7;
}
export const stepsFromBucket = (b: number) =>
  ({ 1: 1000, 2: 3500, 3: 6500, 4: 9000, 5: 11000 })[b] ?? 5000;

export function dailyScore(s: {
  sleep: number;
  readiness: number;
  movement: number;
  hydration: number;
  protein: number;
  mood: number;
  dayStrain: number;
}) {
  // Old project: weighted 0–10 sub-scores → 0–100.
  return Math.round(
    10 *
      (0.15 * s.sleep +
        0.15 * s.readiness +
        0.2 * s.movement +
        0.15 * s.hydration +
        0.15 * s.protein +
        0.1 * s.mood +
        0.1 * s.dayStrain),
  );
}

export function scoreCategory(score: number): "red" | "orange" | "yellow" | "green" {
  if (score < 40) return "red";
  if (score < 60) return "orange";
  if (score < 80) return "yellow";
  return "green";
}

/** Recomputes every derived column from the raw answers on a row. */
export function computeScores(r: Partial<CheckinRow>) {
  const out: Record<string, unknown> = {};
  if (r.morning_completed && r.sleep_hours != null && r.sleep_quality != null) {
    out["sleep_score"] = sleepScore(Number(r.sleep_hours), Number(r.sleep_quality));
    out["readiness_score_norm"] = r.readiness_score ?? 5;
    out["soreness_score"] = sorenessScore(r.soreness_rating ?? 3);
    out["mood_score"] = moodScore(r.mood_rating ?? 3);
  }
  if (r.night_completed) {
    out["movement_score"] = movementScore(stepsFromBucket(r.steps_bucket ?? 3));
    out["hydration_score"] = hydrationScore(Number(r.hydration_liters ?? 0));
    out["protein_score_norm"] = proteinScore(r.protein_level ?? 0);
    out["day_strain_score"] = dayStrainScore(r.day_strain ?? 5);
  }
  out["status"] =
    r.morning_completed && r.night_completed
      ? "complete"
      : r.morning_completed
        ? "incomplete_morning_only"
        : r.night_completed
          ? "incomplete_night_only"
          : "incomplete";
  if (r.morning_completed && r.night_completed) {
    const d = dailyScore({
      sleep: out["sleep_score"] as number,
      readiness: out["readiness_score_norm"] as number,
      movement: out["movement_score"] as number,
      hydration: out["hydration_score"] as number,
      protein: out["protein_score_norm"] as number,
      mood: out["mood_score"] as number,
      dayStrain: out["day_strain_score"] as number,
    });
    out["daily_smarty_score"] = d;
    out["score_category"] = scoreCategory(d);
  }
  return out;
}

/** Local minutes-of-day and date in a time zone. */
export function localClock(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    minutes: Number(g("hour")) * 60 + Number(g("minute")),
  };
}

export function windowStatus(minutes: number) {
  const isMorning = minutes >= MORNING_WINDOW.start && minutes < MORNING_WINDOW.end;
  const isNight = minutes >= NIGHT_WINDOW.start && minutes < NIGHT_WINDOW.end;
  let next: "morning" | "night" | null = null;
  let until = 0;
  if (minutes < MORNING_WINDOW.start) {
    next = "morning";
    until = MORNING_WINDOW.start - minutes;
  } else if (minutes >= MORNING_WINDOW.end && minutes < NIGHT_WINDOW.start) {
    next = "night";
    until = NIGHT_WINDOW.start - minutes;
  } else if (minutes >= NIGHT_WINDOW.end) {
    next = "morning";
    until = 24 * 60 - minutes + MORNING_WINDOW.start;
  }
  const h = Math.floor(until / 60);
  const m = until % 60;
  return {
    isMorning,
    isNight,
    next,
    timeUntil: next ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : "",
  };
}

/** Longest run of consecutive complete check-in days (for the badges). */
export function completeStreaks(dates: string[], todayISO: string) {
  const set = new Set(dates);
  const add = (iso: string, d: number) => {
    const x = new Date(`${iso}T12:00:00Z`);
    x.setUTCDate(x.getUTCDate() + d);
    return x.toISOString().slice(0, 10);
  };
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of [...set].sort()) {
    run = prev && add(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let current = 0;
  let c = set.has(todayISO) ? todayISO : add(todayISO, -1);
  while (set.has(c)) {
    current++;
    c = add(c, -1);
  }
  return { current, longest };
}
