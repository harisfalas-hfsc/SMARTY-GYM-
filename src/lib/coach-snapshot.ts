import type { CoachRecommendation } from "@/lib/coach-rules/types";
import type { ReadinessState } from "@/lib/performance/types";

export type CoachSnapshotAction =
  | { label: string; to: "/smarty-checkins" }
  | { label: string; to: "/logbook"; search?: { view: "list" | "progress"; filter: "all" } }
  | { label: string; to: "/create-your-own-workout" }
  | { label: string; to: "/account" }
  | { label: string; to: "/pricing" };

export type CoachSnapshot = {
  access: "ready" | "locked";
  firstName: string;
  headline: string;
  recommendation: string;
  lastSession: { name: string; date: string; facts: string[] } | null;
  comparison: string;
  personalRecord: string | null;
  nextStep: string;
  reasons: string[];
  equipment: string[];
  action: CoachSnapshotAction;
};

export type CoachSnapshotDecisionInput = {
  firstName: string;
  readiness: { state: ReadinessState; reason: string };
  recommendation: CoachRecommendation;
  hasCheckin: boolean;
  loggedSessions: number;
  primaryGoal: string | null;
  fitnessLevel: string | null;
  equipment: string[];
  upcoming: { name: string; date: string } | null;
  lastSession: CoachSnapshot["lastSession"];
  comparison: string;
  personalRecord: string | null;
};

function readable(value: string | null) {
  return value ? value.replaceAll("_", " ").toLowerCase() : null;
}

/** Pure priority layer: recovery > scheduled session > progression/performance > profile start. */
export function decideCoachSnapshot(input: CoachSnapshotDecisionInput): CoachSnapshot {
  const recovery =
    input.readiness.state === "Recovery Recommended" || input.readiness.state === "Caution";
  const reasons: string[] = [];
  if (recovery) reasons.push(input.readiness.reason);
  else if (input.recommendation.reason) reasons.push(input.recommendation.reason);
  const goal = readable(input.primaryGoal);
  const level = readable(input.fitnessLevel);
  if (goal) reasons.push(`Your Training Profile goal is ${goal}.`);
  if (input.equipment.length) reasons.push(`Available equipment: ${input.equipment.join(", ")}.`);

  if (recovery) {
    return {
      access: "ready",
      firstName: input.firstName,
      headline: "Recovery comes first today",
      recommendation: input.recommendation.message,
      lastSession: input.lastSession,
      comparison: input.comparison,
      personalRecord: input.personalRecord,
      nextStep: "Use an easy Mobility & Stability or Recovery session, and reassess before adding intensity.",
      reasons: reasons.slice(0, 3),
      equipment: input.equipment,
      action: { label: input.hasCheckin ? "Open my Logbook" : "Complete today's check-in", to: input.hasCheckin ? "/logbook" : "/smarty-checkins", ...(input.hasCheckin ? { search: { view: "list", filter: "all" } } : {}) } as CoachSnapshotAction,
    };
  }

  if (input.upcoming) {
    return {
      access: "ready",
      firstName: input.firstName,
      headline: "Your next session is already planned",
      recommendation: `${input.upcoming.name} is next on your schedule.`,
      lastSession: input.lastSession,
      comparison: input.comparison,
      personalRecord: input.personalRecord,
      nextStep: input.recommendation.message,
      reasons: [`Scheduled for ${input.upcoming.date}.`, ...reasons].slice(0, 3),
      equipment: input.equipment,
      action: { label: "Open my Logbook", to: "/logbook", search: { view: "list", filter: "all" } },
    };
  }

  if (input.loggedSessions > 0) {
    return {
      access: "ready",
      firstName: input.firstName,
      headline: input.recommendation.id.startsWith("progression")
        ? "You are ready to progress"
        : "Build on your last session",
      recommendation: input.recommendation.message,
      lastSession: input.lastSession,
      comparison: input.comparison,
      personalRecord: input.personalRecord,
      nextStep: "Use this evidence when choosing your next session; the recommendation is guidance, not an automatic change.",
      reasons: reasons.slice(0, 3),
      equipment: input.equipment,
      action: { label: "Choose my next workout", to: "/create-your-own-workout" },
    };
  }

  return {
    access: "ready",
    firstName: input.firstName,
    headline: `Welcome${level ? `, ${level} athlete` : ""}`,
    recommendation: "Start with a session that matches your Training Profile and available equipment.",
    lastSession: null,
    comparison: "Log your first completed session to unlock automatic comparisons with previous attempts.",
    personalRecord: null,
    nextStep: "Choose a manageable first workout and log the sets or result you complete.",
    reasons: reasons.length ? reasons.slice(0, 3) : ["Your first recommendation uses your Training Profile."],
    equipment: input.equipment,
    action: { label: "Choose my first workout", to: "/create-your-own-workout" },
  };
}