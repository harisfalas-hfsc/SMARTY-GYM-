import type { CoachDecision, CustomPlan } from "@/lib/coach/recommend";
import type { CoachRecommendation } from "@/lib/coach-rules/types";
import type { ReadinessState } from "@/lib/performance/types";

export type CoachSnapshotAction =
  | { label: string; to: "/smarty-checkins" }
  | { label: string; to: "/logbook"; search?: { view: "list" | "progress"; filter: "all" }; hash?: string }
  | { label: string; to: "/create-your-own-workout" }
  | { label: string; to: "/smarty-workouts/$workoutId"; params: { workoutId: string } }
  | { label: string; to: "/account" }
  | { label: string; to: "/smarty-ritual" }
  | { label: string; to: "/pricing" };

/** One visible Smarty Workout chosen by fixed rules, with the reason it was chosen. */
export type CoachSmartyPick = {
  id: string;
  name: string;
  category: string;
  stars: number;
  minutes: number;
  why: string;
};

/** The member's own weekly Insights, summarised inside the Coach. */
export type CoachInsightsSummary = {
  week: string;
  headline: string;
  workouts: number;
  tip: { title: string; body: string } | null;
};

export type CoachSnapshot = {
  access: "ready" | "locked";
  firstName: string;
  greeting: string;
  readinessDisplay: {
    label: string;
    score: number | null;
    basis: "check-in" | "training-history" | "limited";
  };
  goals: { primary: string | null; secondary: string | null };
  todayFocus: {
    purpose: string;
    category: string | null;
    bodyFocus: string | null;
    intensity: string;
    workoutName: string | null;
    duration: number | null;
    stars: number | null;
  };
  headline: string;
  recommendation: string;
  lastSession: { name: string; date: string; facts: string[] } | null;
  comparison: string;
  personalRecord: string | null;
  nextStep: string;
  reasons: string[];
  equipment: string[];
  smartyPick: CoachSmartyPick | null;
  insights: CoachInsightsSummary | null;
  action: CoachSnapshotAction;
  /** Build-your-own suggestion, only when no Smarty Workout fits. */
  custom?: CustomPlan | null;
  confidence?: "none" | "limited" | "good";
};

export type CoachSnapshotDecisionInput = {
  firstName: string;
  greeting: string;
  readiness: { state: ReadinessState; reason: string };
  readinessScore: number | null;
  recommendation: CoachRecommendation;
  hasCheckin: boolean;
  /** Sessions with logged data in the last 28 days (Training Load window). */
  loggedSessions: number;
  /** Every completed workout ever, so returning members are never told it's their first. */
  totalCompleted: number;
  daysSinceLast: number | null;
  primaryGoal: string | null;
  secondaryGoal: string | null;
  fitnessLevel: string | null;
  equipment: string[];
  upcoming: { name: string; date: string } | null;
  lastSession: CoachSnapshot["lastSession"];
  comparison: string;
  personalRecord: string | null;
  smartyPick: CoachSmartyPick | null;
  insights: CoachInsightsSummary | null;
};

function readable(value: string | null) {
  return value ? value.replaceAll("_", " ").toLowerCase() : null;
}

/** Days without training after which the Coach treats the next session as a restart. */
export const RESTART_AFTER_DAYS = 14;

/** Pure priority layer: recovery > scheduled session > restart > progression/performance > first workout. */
export function decideCoachSnapshot(input: CoachSnapshotDecisionInput): CoachSnapshot {
  const recovery =
    input.readiness.state === "Recovery Recommended" || input.readiness.state === "Caution";
  const reasons: string[] = [];
  if (recovery) reasons.push(input.readiness.reason);
  else if (input.loggedSessions > 0 && input.recommendation.reason) reasons.push(input.recommendation.reason);
  if (input.smartyPick) reasons.push(input.smartyPick.why);
  const goal = readable(input.primaryGoal);
  if (goal) reasons.push(`Your Training Profile goal is "${goal}".`);

  const pickAction: CoachSnapshotAction | null = input.smartyPick
    ? { label: `Open ${input.smartyPick.name}`, to: "/smarty-workouts/$workoutId", params: { workoutId: input.smartyPick.id } }
    : null;
  const readinessBasis: CoachSnapshot["readinessDisplay"]["basis"] =
    input.readinessScore !== null ? "check-in" : input.loggedSessions > 0 ? "training-history" : "limited";
  const base = {
    access: "ready" as const,
    firstName: input.firstName,
    greeting: input.greeting,
    readinessDisplay: {
      label: input.readiness.state,
      score: input.readinessScore,
      basis: readinessBasis,
    },
    goals: { primary: readable(input.primaryGoal), secondary: readable(input.secondaryGoal) },
    todayFocus: {
      purpose: recovery ? "Recovery" : "Training",
      category: input.smartyPick?.category ?? null,
      bodyFocus: null,
      intensity: recovery ? "Light" : "Controlled",
      workoutName: input.smartyPick?.name ?? input.upcoming?.name ?? null,
      duration: input.smartyPick?.minutes ?? null,
      stars: input.smartyPick?.stars ?? null,
    },
    lastSession: input.lastSession,
    comparison: input.comparison,
    personalRecord: input.personalRecord,
    equipment: input.equipment,
    smartyPick: input.smartyPick,
    insights: input.insights,
  };

  if (recovery) {
    return {
      ...base,
      headline: "Recovery comes first today",
      recommendation: input.recommendation.message,
      nextStep: "Choose an easy Recovery or Mobility & Stability session and reassess before adding intensity.",
      reasons: reasons.slice(0, 3),
      action: !input.hasCheckin
        ? { label: "Complete today's check-in", to: "/smarty-checkins" }
        : pickAction ?? { label: "Open my Logbook", to: "/logbook", search: { view: "list", filter: "all" } },
    };
  }

  if (input.upcoming) {
    return {
      ...base,
      headline: "Your next session is already planned",
      recommendation: `${input.upcoming.name} is next on your schedule.`,
      nextStep: input.recommendation.message,
      reasons: [`Scheduled for ${input.upcoming.date}.`, ...reasons].slice(0, 3),
      action: { label: "Open my Logbook", to: "/logbook", search: { view: "list", filter: "all" } },
    };
  }

  if (input.totalCompleted > 0) {
    const restart = input.daysSinceLast !== null && input.daysSinceLast >= RESTART_AFTER_DAYS;
    const fallback: CoachSnapshotAction = { label: "Create a workout", to: "/create-your-own-workout" };
    if (restart) {
      return {
        ...base,
        headline: "Welcome back",
        recommendation: `Your last completed workout was ${input.daysSinceLast} days ago. Restart with a manageable session rather than jumping straight back to your previous level.`,
        nextStep: "Keep the first session back controlled, log your sets or result, and build up from there.",
        reasons: reasons.slice(0, 3),
        action: pickAction ?? fallback,
      };
    }
    return {
      ...base,
      headline: input.recommendation.id.startsWith("progression")
        ? "You are ready to progress"
        : "Build on your last session",
      recommendation: input.recommendation.message,
      nextStep: "Use this as guidance when choosing your next session — nothing changes automatically.",
      reasons: reasons.slice(0, 3),
      action: pickAction ?? fallback,
    };
  }

  const level = readable(input.fitnessLevel);
  return {
    ...base,
    headline: "Let's start your training history",
    recommendation: `You haven't completed a workout yet. Start with a session at your ${level ?? "chosen"} level that uses your available equipment.`,
    lastSession: null,
    comparison: "Complete and log your first workout to unlock automatic comparisons with previous attempts.",
    personalRecord: null,
    nextStep: "Complete the workout and log your sets or result, so your Coach can compare next time.",
    reasons: reasons.length ? reasons.slice(0, 3) : ["Your first recommendation uses your Training Profile."],
    action: pickAction ?? { label: "Create your first workout", to: "/create-your-own-workout" },
  };
}

/** Overlay the decision engine's verdict; engine priorities always win. */
export function applyCoachDecision(snap: CoachSnapshot, d: CoachDecision): CoachSnapshot {
  const out: CoachSnapshot = { ...snap, reasons: d.explanation.length ? d.explanation : snap.reasons, custom: d.custom, confidence: d.confidence };
  if (d.confidence === "limited" && !out.reasons.some((r) => r.startsWith("Based on limited data")))
    out.reasons = [...out.reasons, "Based on limited data."].slice(0, 4);
  if (d.purpose === "recovery") {
    out.headline = "Recovery comes first today";
    out.nextStep = "Keep it easy today and reassess before adding intensity.";
  }
  switch (d.action.kind) {
    case "planned":
      out.headline = d.purpose === "recovery" ? out.headline : "Your planned session fits today";
      out.recommendation = `${d.planned?.name ?? "Your planned session"} is on your schedule and fits today.`;
      out.action = { label: "Open my Logbook", to: "/logbook", search: { view: "list", filter: "all" } };
      break;
    case "smarty_workout":
      if (d.workout) {
        if (d.purpose !== "recovery" && snap.headline === "Your next session is already planned") out.headline = "A lighter option fits better today";
        out.action = { label: `Open ${d.workout.name}`, to: "/smarty-workouts/$workoutId", params: { workoutId: d.workout.id } };
      }
      break;
    case "custom":
      out.smartyPick = null;
      out.recommendation = "No Smarty Workout matches today, so build this short session yourself.";
      out.action = { label: "Build it in Create Your Own Workout", to: "/create-your-own-workout" };
      break;
    case "rest":
      out.smartyPick = null;
      out.headline = "Rest is the smart choice today";
      out.recommendation = "No session fits today's limits. Rest, hydrate and try today's Smarty Ritual.";
      out.action = { label: "Open Smarty Ritual", to: "/smarty-ritual" };
      break;
  }
  out.todayFocus = {
    purpose: d.purpose === "intro" ? "Getting started" : d.purpose.charAt(0).toUpperCase() + d.purpose.slice(1),
    category: d.workout?.category ?? d.planned?.category ?? d.category,
    bodyFocus: d.workout?.focus ?? d.planned?.focus ?? null,
    intensity: d.intensity === "rest" ? "Rest" : d.intensity.charAt(0).toUpperCase() + d.intensity.slice(1),
    workoutName: d.workout?.name ?? d.planned?.name ?? null,
    duration: d.workout?.minutes ?? null,
    stars: d.workout?.stars ?? d.planned?.stars ?? null,
  };
  return out;
}
