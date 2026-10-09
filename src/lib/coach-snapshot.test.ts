import { describe, expect, it } from "vitest";
import { decideCoachSnapshot, type CoachSnapshotDecisionInput } from "./coach-snapshot";

const base: CoachSnapshotDecisionInput = {
  firstName: "Alex",
  readiness: { state: "Ready", reason: "Your recent load is manageable." },
  recommendation: { id: "steady.ok", message: "Train as planned.", reason: "Two sessions logged.", suggestedStars: null, priority: 5 },
  hasCheckin: true,
  loggedSessions: 2,
  primaryGoal: "strength",
  fitnessLevel: "intermediate",
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
    const result = decideCoachSnapshot({ ...base, loggedSessions: 0, lastSession: null, comparison: "" });
    expect(result.comparison).toMatch(/first completed session/);
    expect(result.lastSession).toBeNull();
  });
});