// Smarty Coach decision engine — pure, deterministic, zero AI.
// Same inputs + same library => same recommendation. No I/O here: the server
// loads and normalizes data, this module only decides.
//
// Priority order (a lower step can never undo a higher one):
//   1. Safety & recovery   2. Workload context   3. Session purpose
//   4. Calendar            5. Smarty Workout search   6. Build-your-own fallback

import type { CheckinSignal } from "@/lib/coach-rules/types";
import type { LoadState, ReadinessState } from "@/lib/performance/types";

export type Intensity = "light" | "moderate" | "hard";
const RANK: Record<Intensity, number> = { light: 1, moderate: 2, hard: 3 };
const BY_RANK: Intensity[] = ["light", "light", "moderate", "hard"];

export const RECOVERY_CATEGORIES = ["RECOVERY", "MOBILITY & STABILITY"];
export const EASY_CATEGORIES = ["MOBILITY & STABILITY", "RECOVERY", "PILATES", "CARDIO"];
export const CONDITIONING_CATEGORIES = ["CARDIO", "CALORIE BURNING", "METABOLIC", "CHALLENGE"];
const STRENGTH_CATEGORIES = ["STRENGTH", "MUSCLE BUILDING"];

/** Thresholds — mirror the existing check-in rule in coach-rules (not a new scale). */
export const THRESHOLDS = {
  poorSleepHours: 5.5,
  poorSleepQuality: 2,
  highSoreness: 7,
  severeSoreness: 8,
  lowReadiness: 3,
  severeLowReadiness: 2,
  hardYesterday: 8,
  /** RPE at/above which a logged session counts as hard regardless of stars. */
  hardRpe: 8,
  /** RPE at/below which a logged session counts as light regardless of stars. */
  lightRpe: 4,
  consecutiveHardDays: 3,
  priorPoorDaysForCap: 2,
  priorCheckinDays: 3,
  recentRepeatDays: 14,
} as const;

export type CompletedSession = {
  id: string;
  /** Smarty Workout id this session came from, when known (tag smarty:<id>). */
  smartyId: string | null;
  name: string;
  category: string;
  /** Stored body focus only (e.g. "LOWER BODY"). null = unknown, never guessed. */
  focus: string | null;
  stars: number;
  /** Logged RPE; null = not logged (never zero). */
  rpe: number | null;
  /** Local calendar day yyyy-mm-dd. */
  day: string;
  /** Latest post-workout feeling for this attempt, when recorded. */
  feeling?: string | null;
};

export type LibraryWorkout = {
  id: string;
  name: string;
  category: string;
  focus: string | null;
  stars: number;
  minutes: number;
  equipment: string[];
};

export type PlannedSession = { id: string; name: string; category: string; focus: string | null; stars: number; date: string };

export type FallbackExercise = { id: string; name: string; kind: "recovery" | "mobility" | "strength" | "conditioning" };

export type CoachEngineInput = {
  today: string;
  readiness: { state: ReadinessState; reason: string };
  overallLoad: LoadState;
  consecutiveDays: number;
  /** Today's (and yesterday evening's) check-in; null = not completed. */
  checkin: CheckinSignal | null;
  /** Morning check-ins from the previous days (newest first), only completed ones. */
  priorCheckins: CheckinSignal[];
  /** Completed sessions, last 14 days, newest first. */
  recent: CompletedSession[];
  totalCompleted: number;
  /** Smarty Workout ids/names ever completed by the member. */
  everDone: { ids: string[]; names: string[] };
  level: "beginner" | "intermediate" | "advanced" | null;
  primaryGoalCategory: string | null;
  secondaryGoalCategory: string | null;
  /** Recorded profile limitations; used as safety evidence, never guessed. */
  limitations: string[];
  equipment: string[];
  typicalMinutes: number | null;
  planned: PlannedSession | null;
  library: LibraryWorkout[];
  fallbackExercises: FallbackExercise[];
};

export type CoachAction =
  | { kind: "smarty_workout"; workoutId: string }
  | { kind: "planned"; workoutId: string }
  | { kind: "custom" }
  | { kind: "rest" };

export type CustomPlan = {
  purpose: string;
  intensity: Intensity;
  dose: string;
  rest: string;
  effort: string;
  exercises: Array<{ id: string; name: string }>;
};

export type CoachDecision = {
  action: CoachAction;
  workout: LibraryWorkout | null;
  planned: PlannedSession | null;
  category: string | null;
  intensity: Intensity | "rest";
  purpose: Purpose;
  reasonCodes: string[];
  explanation: string[];
  usedFallback: boolean;
  confidence: "none" | "limited" | "good";
  custom: CustomPlan | null;
};

export type Purpose = "recovery" | "easy" | "strength" | "conditioning" | "intro" | "goal";

// ---------- 1. normalization helpers ----------
export function sessionIntensity(s: { stars: number; rpe: number | null }): Intensity {
  if (s.rpe !== null && s.rpe >= THRESHOLDS.hardRpe) return "hard";
  if (s.rpe !== null && s.rpe <= THRESHOLDS.lightRpe) return "light";
  return BY_RANK[Math.min(3, Math.max(1, Math.round(s.stars)))];
}

export function poorSignals(c: CheckinSignal | null): string[] {
  if (!c) return [];
  const out: string[] = [];
  const t = THRESHOLDS;
  if (c.sleepHours !== null && c.sleepHours < t.poorSleepHours) out.push(`you slept ${c.sleepHours} hours`);
  if (c.sleepQuality !== null && c.sleepQuality <= t.poorSleepQuality) out.push("your sleep quality was poor");
  if (c.soreness !== null && c.soreness >= t.highSoreness) out.push(`soreness is ${c.soreness}/10`);
  if (c.readiness !== null && c.readiness <= t.lowReadiness) out.push(`readiness is ${c.readiness}/10`);
  if (c.yesterdayStrain !== null && c.yesterdayStrain >= t.hardYesterday) out.push(`yesterday felt hard (${c.yesterdayStrain}/10)`);
  return out;
}

function prevDay(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Consecutive calendar days (ending today or yesterday) that each held a hard session. */
export function consecutiveHardDays(recent: CompletedSession[], today: string): number {
  const hardDays = new Set(recent.filter((s) => sessionIntensity(s) === "hard").map((s) => s.day));
  let day = hardDays.has(today) ? today : prevDay(today);
  let n = 0;
  while (hardDays.has(day)) {
    n++;
    day = prevDay(day);
  }
  return n;
}

const label = (c: string) => c.toLowerCase().replace(/(^|\s|&\s)\w/g, (m) => m.toUpperCase());

// ---------- 2. recovery gate ----------
type Gate = { cap: Intensity; forceRecovery: boolean; codes: string[]; why: string[] };

export function recoveryGate(i: CoachEngineInput): Gate {
  let cap: Intensity = "hard";
  let forceRecovery = false;
  const codes: string[] = [];
  const why: string[] = [];
  const lower = (to: Intensity) => {
    if (RANK[to] < RANK[cap]) cap = to;
  };

  if (i.readiness.state === "Recovery Recommended") {
    lower("light"); forceRecovery = true; codes.push("readiness.recovery"); why.push(i.readiness.reason);
  }
  if (i.overallLoad === "Very High") {
    lower("light"); forceRecovery = true; codes.push("load.very_high"); why.push("Your recent Training Load is very high.");
  }
  if (i.overallLoad === "High") { lower("moderate"); codes.push("load.high"); why.push("Your recent Training Load is high, so no hard session today."); }
  if (i.readiness.state === "Caution") { lower("moderate"); codes.push("readiness.caution"); why.push(i.readiness.reason); }

  const hardRun = consecutiveHardDays(i.recent, i.today);
  if (hardRun >= THRESHOLDS.consecutiveHardDays) {
    lower("light"); forceRecovery = true; codes.push("history.hard_streak");
    why.push(`You trained hard ${hardRun} days in a row.`);
  }

  const poor = poorSignals(i.checkin);
  const c = i.checkin;
  const severe = c && ((c.soreness ?? 0) >= THRESHOLDS.severeSoreness || (c.readiness ?? 10) <= THRESHOLDS.severeLowReadiness);
  if (poor.length >= 2 || severe) {
    lower("light"); forceRecovery = true; codes.push("checkin.poor");
    why.push(`In today's Smarty Check-in ${poor.slice(0, 3).join(", ")}.`);
  } else if (poor.length === 1) {
    lower("moderate"); codes.push("checkin.one_signal"); why.push(`In today's Smarty Check-in ${poor[0]}.`);
  }

  const poorDays = i.priorCheckins.slice(0, THRESHOLDS.priorCheckinDays).filter((p) => poorSignals(p).length >= 2).length;
  if (poorDays >= THRESHOLDS.priorPoorDaysForCap) {
    lower("moderate"); codes.push("checkin.poor_trend");
    why.push(`${poorDays} of your last ${THRESHOLDS.priorCheckinDays} check-ins showed poor recovery signals.`);
  }
  const latestFeeling = i.recent[0]?.feeling?.toLowerCase() ?? null;
  if (latestFeeling === "exhausted") {
    lower("light"); forceRecovery = true; codes.push("feedback.exhausted");
    why.push("You reported feeling exhausted after your last workout.");
  } else if (latestFeeling === "tired") {
    lower("moderate"); codes.push("feedback.tired");
    why.push("You reported feeling tired after your last workout, so intensity stays controlled.");
  }
  return { cap, forceRecovery, codes, why };
}

// ---------- 3/4. purpose ----------
type PurposePlan = {
  purpose: Purpose;
  categories: string[];
  preferFocus: string[];
  avoidFocus: string[];
  cap: Intensity;
  codes: string[];
  why: string[];
};

export function selectPurpose(i: CoachEngineInput, gate: Gate): PurposePlan {
  const base = { preferFocus: [] as string[], avoidFocus: [] as string[], codes: [] as string[], why: [] as string[] };
  const goals = [i.primaryGoalCategory, i.secondaryGoalCategory].filter((value): value is string => Boolean(value));
  if (gate.forceRecovery) return { ...base, purpose: "recovery", categories: RECOVERY_CATEGORIES, cap: "light" };

  const last = i.recent[0] ?? null;
  if (!last) {
    if (i.totalCompleted === 0) {
      return {
        ...base, purpose: "intro", cap: "light",
        categories: [...new Set([...goals.map((goal) => goal === "MUSCLE BUILDING" ? "STRENGTH" : goal), "STRENGTH", "CARDIO", "MOBILITY & STABILITY"])],
        codes: ["history.none"], why: ["No completed workouts yet, so an introductory 1-star session is suggested — no assumptions about your ability."],
      };
    }
    return {
      ...base, purpose: "goal", cap: gate.cap === "hard" ? "moderate" : gate.cap,
      categories: goals.length ? goals : ["STRENGTH", "CARDIO"],
      codes: ["history.restart"], why: ["No completed workout in the last 14 days, so the next session stays controlled."],
    };
  }

  const cat = last.category.toUpperCase();
  const focus = last.focus?.toUpperCase() ?? null;
  const lastHard = sessionIntensity(last) === "hard";
  const lastName = `${last.name} (${label(cat)}${focus ? `, ${label(focus)}` : ""})`;

  if (STRENGTH_CATEGORIES.includes(cat)) {
    if (focus === "LOWER BODY")
      return { ...base, purpose: "strength", cap: gate.cap, categories: ["STRENGTH"], preferFocus: ["UPPER BODY"], avoidFocus: ["LOWER BODY", "FULL BODY"], codes: ["rotation.lower_to_upper"], why: [`Your last session was lower-body strength (${last.name}), so upper body is next.`] };
    if (focus === "UPPER BODY")
      return { ...base, purpose: "strength", cap: gate.cap, categories: ["STRENGTH"], preferFocus: ["LOWER BODY"], avoidFocus: ["UPPER BODY", "FULL BODY"], codes: ["rotation.upper_to_lower"], why: [`Your last session was upper-body strength (${last.name}), so lower body is next.`] };
    if (focus === "FULL BODY")
      return { ...base, purpose: "easy", cap: RANK[gate.cap] > 2 ? "moderate" : gate.cap, categories: EASY_CATEGORIES, codes: ["rotation.full_body_to_easy"], why: [`Your last session was full-body strength (${last.name}), so easier conditioning or mobility balances it.`] };
    return {
      ...base, purpose: "conditioning", cap: gate.cap, categories: CONDITIONING_CATEGORIES.filter((c) => c !== "CHALLENGE"),
      avoidFocus: focus ? [focus] : [], codes: [focus ? "rotation.strength_to_conditioning" : "rotation.strength_unknown_focus"],
      why: [focus ? `Your last session was ${lastName}, so conditioning is next.` : `Your last session was strength (${last.name}); its body focus isn't recorded, so conditioning is chosen instead of guessing.`],
    };
  }
  if (CONDITIONING_CATEGORIES.includes(cat)) {
    if (lastHard || RANK[gate.cap] < 3)
      return { ...base, purpose: "easy", cap: RANK[gate.cap] > 2 ? "moderate" : gate.cap, categories: ["MOBILITY & STABILITY", "PILATES", "RECOVERY"], codes: ["rotation.hard_conditioning_to_easy"], why: [`Your last session (${lastName}) was demanding, so easier work comes next.`] };
    return { ...base, purpose: "strength", cap: gate.cap, categories: ["STRENGTH"], codes: ["rotation.conditioning_to_strength"], why: [`Your last session was ${lastName}; with a manageable workload, strength is next.`] };
  }
  // Mobility, Pilates, Recovery → resume normal training.
  return {
    ...base, purpose: "goal", cap: gate.cap,
    categories: goals.length ? goals.map((goal) => goal === "MUSCLE BUILDING" ? "STRENGTH" : goal) : ["STRENGTH", "CARDIO"],
    codes: ["rotation.resume"], why: [`Your last session was ${lastName}, so normal training resumes.`],
  };
}

function levelStars(level: CoachEngineInput["level"]) {
  return level === "advanced" ? 3 : level === "intermediate" ? 2 : 1;
}

// ---------- 5. library filter + rank ----------
export function rankLibrary(i: CoachEngineInput, plan: PurposePlan): LibraryWorkout[] {
  const maxStars = Math.min(RANK[plan.cap], plan.purpose === "intro" ? 1 : levelStars(i.level));
  const owned = new Set([...i.equipment.map((e) => e.toLowerCase()), "bodyweight"]);
  const recentSmarty = new Set(i.recent.map((r) => r.smartyId).filter(Boolean) as string[]);
  const recentNames = new Set(i.recent.map((r) => r.name));
  const everIds = new Set(i.everDone.ids);
  const everNames = new Set(i.everDone.names);
  const cats = plan.categories.map((c) => (c === "MUSCLE BUILDING" ? "STRENGTH" : c));

  const eligible = i.library.filter((w) => {
    if (!cats.includes(w.category.toUpperCase())) return false;
    if (w.stars > maxStars) return false;
    if (!(w.equipment ?? []).every((e) => owned.has(e.toLowerCase()))) return false;
    const f = w.focus?.toUpperCase() ?? null;
    if (f && plan.avoidFocus.includes(f)) return false;
    if (recentSmarty.has(w.id) || recentNames.has(w.name)) return false;
    return true;
  });

  const target = maxStars;
  const primaryGoal = i.primaryGoalCategory === "MUSCLE BUILDING" ? "STRENGTH" : i.primaryGoalCategory;
  const secondaryGoal = i.secondaryGoalCategory === "MUSCLE BUILDING" ? "STRENGTH" : i.secondaryGoalCategory;
  const key = (w: LibraryWorkout): Array<number | string> => [
    cats.indexOf(w.category.toUpperCase()) === 0 && plan.purpose === "recovery" ? 0 : 1,
    plan.preferFocus.length ? (plan.preferFocus.includes(w.focus?.toUpperCase() ?? "") ? 0 : 1) : 0,
    primaryGoal && w.category.toUpperCase() === primaryGoal ? 0 : 1,
    secondaryGoal && w.category.toUpperCase() === secondaryGoal ? 0 : 1,
    everIds.has(w.id) || everNames.has(w.name) ? 1 : 0,
    Math.abs(w.stars - target),
    i.typicalMinutes ? Math.abs(w.minutes - i.typicalMinutes) : 0,
    w.id,
  ];
  return eligible.sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let n = 0; n < ka.length; n++) {
      if (ka[n] < kb[n]) return -1;
      if (ka[n] > kb[n]) return 1;
    }
    return 0;
  });
}

// ---------- 6. fallback ----------
const DOSE: Record<Intensity, { dose: string; rest: string; effort: string }> = {
  light: { dose: "2 rounds · 40 seconds each", rest: "20 seconds between exercises", effort: "Easy — about 3–4 out of 10" },
  moderate: { dose: "3 sets · 10 reps", rest: "60 seconds between sets", effort: "Controlled — about 6 out of 10" },
  hard: { dose: "4 sets · 8 reps", rest: "90 seconds between sets", effort: "Challenging — about 7–8 out of 10" },
};

export function buildCustomPlan(i: CoachEngineInput, plan: PurposePlan): CustomPlan | null {
  const kinds: FallbackExercise["kind"][] =
    plan.purpose === "recovery" ? ["recovery", "mobility"]
    : plan.purpose === "easy" || plan.purpose === "intro" ? ["mobility", "recovery"]
    : plan.purpose === "strength" ? ["strength"]
    : plan.purpose === "conditioning" ? ["conditioning"]
    : ["strength", "conditioning"];
  const picked = [...i.fallbackExercises]
    .filter((e) => kinds.includes(e.kind) && e.id && e.name)
    .sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .slice(0, 5);
  if (picked.length < 3) return null;
  const intensity: Intensity = plan.purpose === "intro" ? "light" : plan.cap;
  return { purpose: plan.purpose, intensity, ...DOSE[intensity], exercises: picked.map(({ id, name }) => ({ id, name })) };
}

// ---------- 7. main ----------
export function recommendNext(i: CoachEngineInput): CoachDecision {
  const gate = recoveryGate(i);
  const plan = selectPurpose(i, gate);
  const codes = [...gate.codes, ...plan.codes];
  const why = [...gate.why, ...plan.why];
  const primaryGoal = i.primaryGoalCategory === "MUSCLE BUILDING" ? "STRENGTH" : i.primaryGoalCategory;
  const secondaryGoal = i.secondaryGoalCategory === "MUSCLE BUILDING" ? "STRENGTH" : i.secondaryGoalCategory;
  if (primaryGoal) {
    const selectedCategory = plan.categories[0] ?? null;
    why.push(
      selectedCategory === primaryGoal
        ? `${label(primaryGoal)} is your primary Training Profile goal, so today's direction continues that focus.`
        : `${label(primaryGoal)} is your primary goal; today's ${label(plan.purpose)} direction supports your next safe step toward it.`,
    );
    codes.push("goal.primary");
  }
  if (secondaryGoal && plan.categories.includes(secondaryGoal)) {
    why.push(`${label(secondaryGoal)} is your secondary goal and helped rank suitable options.`);
    codes.push("goal.secondary");
  }
  if (i.limitations.length) {
    why.push(`Your ${i.limitations.length === 1 ? "recorded limitation remains" : "recorded limitations remain"} a safety boundary for today's choice.`);
    codes.push("profile.limitations");
  }

  const hasLoad = i.overallLoad !== "None" && i.overallLoad !== "Limited Data";
  const confidence: CoachDecision["confidence"] =
    i.totalCompleted === 0 && !i.checkin ? "none" : !hasLoad ? "limited" : "good";
  if (!hasLoad && i.totalCompleted > 0) { codes.push("load.limited"); why.push("Based on limited data: Training Load needs more logged sessions."); }
  if (!i.checkin) codes.push("checkin.missing");

  const common = { purpose: plan.purpose, reasonCodes: codes, confidence };

  // Calendar: keep the planned session only if it fits the gate and purpose.
  if (i.planned) {
    const p = i.planned;
    const pIntensity = sessionIntensity({ stars: p.stars, rpe: null });
    const fits =
      RANK[pIntensity] <= RANK[plan.cap] &&
      (!gate.forceRecovery || RECOVERY_CATEGORIES.includes(p.category.toUpperCase())) &&
      !(p.focus && plan.avoidFocus.includes(p.focus.toUpperCase()));
    if (fits) {
      return { ...common, action: { kind: "planned", workoutId: p.id }, workout: null, planned: p, category: p.category, intensity: pIntensity,
        reasonCodes: [...codes, "calendar.planned_fits"], explanation: [`${p.name} is planned for ${p.date} and fits today.`, ...why].slice(0, 4), usedFallback: false, custom: null };
    }
    codes.push("calendar.planned_conflict");
    why.unshift(`${p.name} is planned for ${p.date}, but a lighter option fits better today.`);
  }

  const ranked = rankLibrary(i, plan);
  const best = ranked[0];
  if (best) {
    return { ...common, action: { kind: "smarty_workout", workoutId: best.id }, workout: best, planned: null, category: best.category,
      intensity: sessionIntensity({ stars: best.stars, rpe: null }), explanation: why.slice(0, 4), usedFallback: false, custom: null };
  }

  const custom = buildCustomPlan(i, plan);
  if (custom) {
    return { ...common, reasonCodes: [...codes, "fallback.custom"], action: { kind: "custom" }, workout: null, planned: null, category: null,
      intensity: custom.intensity, explanation: [...why, "No Smarty Workout matches today, so here is a short session you can build yourself."].slice(0, 4), usedFallback: true, custom };
  }
  return { ...common, reasonCodes: [...codes, "fallback.rest"], action: { kind: "rest" }, workout: null, planned: null, category: null,
    intensity: "rest", explanation: [...why, "No suitable session fits today's limits, so rest is recommended."].slice(0, 4), usedFallback: true, custom: null };
}

/** Destination for each action — only routes that exist in the app. */
export function decisionDestination(d: CoachDecision):
  | { to: "/smarty-workouts/$workoutId"; params: { workoutId: string } }
  | { to: "/logbook" }
  | { to: "/create-your-own-workout" }
  | { to: "/smarty-ritual" } {
  switch (d.action.kind) {
    case "smarty_workout": return { to: "/smarty-workouts/$workoutId", params: { workoutId: d.action.workoutId } };
    case "planned": return { to: "/logbook" };
    case "custom": return { to: "/create-your-own-workout" };
    case "rest": return { to: "/smarty-ritual" };
  }
}
