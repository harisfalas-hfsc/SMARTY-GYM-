import { describe, expect, it } from "vitest";
import { decideCoachSnapshot, type CoachSnapshotDecisionInput } from "./coach-snapshot";

const base: CoachSnapshotDecisionInput = {
  firstName: "Alex",
  greeting: "Good morning, Alex.",
  readiness: { state: "Ready", reason: "Your recent load is manageable." },
  readinessScore: 8,
  recommendation: { id: "steady.ok", message: "Train as planned.", reason: "Two sessions logged.", suggestedStars: null, priority: 5 },
  hasCheckin: true,
  loggedSessions: 2,
  primaryGoal: "strength",
  secondaryGoal: "mobility",
  fitnessLevel: "intermediate",
  totalCompleted: 2,
  daysSinceLast: 2,
  smartyPick: null,
  insights: null,
  equipment: ["Dumbbell"],
  upcoming: null,
  lastSession: { name: "Solid Lift", date: "8 Oct", facts: ["RPE 7/10"] },
  comparison: "Held steady compared with your previous attempt.",
  personalRecord: null,
};

describe("Smarty Coach snapshot priorities", () => {
  it("puts recovery ahead of a scheduled workout and progression", () => {
    const result = decideCoachSnapshot({
      ...base,
      readiness: { state: "Recovery Recommended", reason: "Recent load is very high." },
      recommendation: { ...base.recommendation, id: "progression.step-up", message: "Progress next time." },
      upcoming: { name: "Heavy Strength", date: "10 Oct" },
    });
    expect(result.headline).toBe("Recovery comes first today");
    expect(result.nextStep).toMatch(/Recovery/);
  });

  it("uses a confirmed scheduled workout when readiness is clear", () => {
    const result = decideCoachSnapshot({ ...base, upcoming: { name: "Tempo Session", date: "10 Oct" } });
    expect(result.recommendation).toContain("Tempo Session");
    expect(result.reasons[0]).toContain("Scheduled");
  });

  it("does not fabricate comparisons for a new member", () => {
    const result = decideCoachSnapshot({ ...base, loggedSessions: 0, totalCompleted: 0, lastSession: null, comparison: "" });
    expect(result.comparison).toMatch(/first workout/);
    expect(result.lastSession).toBeNull();
  });
});
describe("returning members", () => {
  it("never calls a returning member's next workout their first", () => {
    const r = decideCoachSnapshot({ ...base, loggedSessions: 0, totalCompleted: 1, daysSinceLast: 35 });
    expect(r.headline).toBe("Welcome back");
    expect(r.action.label).not.toMatch(/first/i);
  });
  it("opens the recommended Smarty Workout", () => {
    const r = decideCoachSnapshot({ ...base, smartyPick: { id: "x", name: "Lift", category: "STRENGTH", stars: 2, minutes: 30, why: "Because." } });
    expect(r.action.to).toBe("/smarty-workouts/$workoutId");
  });
  it("exposes the real readiness score and both goals", () => {
    const r = decideCoachSnapshot(base);
    expect(r.readinessDisplay).toEqual({ label: "Ready", score: 8, basis: "check-in" });
    expect(r.goals).toEqual({ primary: "strength", secondary: "mobility" });
  });
});
