import { describe, it, expect } from "vitest";
import { conflictsWithLimitations, knownLimitations } from "../limitations";
import { whyThisSession } from "@/lib/coach-rules/why";

describe("limitations", () => {
  it("excludes knee-loading movements", () => {
    expect(conflictsWithLimitations("Bulgarian Split Squat", ["knee"])).toBe(false);
    expect(conflictsWithLimitations("Jump Squat", ["knee"])).toBe(true);
    expect(conflictsWithLimitations("Glute Bridge", ["knee"])).toBe(false);
  });
  it("excludes overhead work for shoulders", () => {
    expect(conflictsWithLimitations("Behind-the-Neck Press", ["shoulder"])).toBe(true);
    expect(conflictsWithLimitations("Goblet Squat", ["shoulder"])).toBe(false);
  });
  it("ignores unknown ids", () => {
    expect(knownLimitations(["knee", "nope"])).toEqual(["knee"]);
  });
  it("explains limitations, goals and level", () => {
    const lines = whyThisSession({
      readiness: "Ready" as never, overallLoad: "Normal" as never, averageRpe: null,
      recentFeelings: [], deprioritizedFormats: [], avoidedExercises: [], favoredExercises: [],
      loggedSessions: 0, limitationLabels: ["Knee", "Shoulder"], servedGoals: ["Build muscle"],
      autoLevelLabel: "Intermediate", autoStars: 2,
    });
    expect(lines[0]).toContain("knee and shoulder");
    expect(lines.join(" ")).toContain("build muscle");
    expect(lines.join(" ")).toContain("2 stars");
    expect(lines.join(" ")).not.toContain("Built from your Training Profile");
  });
});

import { limitationDecision, limitationAdmits } from "../limitations";
import { exerciseRuleBreaks } from "../rules";
describe("limitation policy", () => {
  const d = (name: string, l: string[], extra: Record<string, unknown> = {}) => limitationDecision({ name, ...extra }, { limitations: l, ...extra });
  it("reads profile labels, not only ids", () => {
    expect(knownLimitations(["Lower back", "Pregnant / postpartum"])).toEqual(["lower_back", "pregnancy"]);
    expect(d("Barbell Deadlift", ["Lower back"]).status).toBe("BLOCKED");
  });
  it("distinguishes hinging from blanket bans", () => {
    expect(d("Dumbbell Romanian Deadlift", ["lower_back"]).status).toBe("RESTRICTED");
    expect(d("Glute Bridge", ["lower_back"]).status).toBe("ALLOWED");
    expect(d("Glute Bridge", ["lower_back"]).preferred).toBe(true);
  });
  it("knee: impact blocked, controlled work allowed or restricted", () => {
    expect(d("Jump Squat", ["knee"]).status).toBe("BLOCKED");
    expect(d("Reverse Lunge", ["knee"]).status).toBe("RESTRICTED");
    expect(d("Leg Press", ["knee"]).status).toBe("ALLOWED");
  });
  it("shoulder does not remove every push or pull", () => {
    expect(d("Upright Row", ["shoulder"]).status).toBe("BLOCKED");
    expect(d("Dumbbell Overhead Press", ["shoulder"]).status).toBe("RESTRICTED");
    expect(d("Seated Cable Row", ["shoulder"]).status).toBe("ALLOWED");
    expect(d("Pull-Up", ["shoulder"]).status).toBe("ALLOWED");
  });
  it("combines limitations conservatively", () => {
    expect(d("Push-Up", ["lower_back"]).status).toBe("ALLOWED");
    expect(d("Push-Up", ["lower_back", "wrist"]).status).toBe("RESTRICTED");
  });
  it("medical restrictions need clearance; blocked never passes", () => {
    expect(limitationAdmits({ name: "Plank" }, { limitations: ["hernia"] }, { allowRestricted: true })).toBe(false);
    expect(limitationAdmits({ name: "Plank" }, { limitations: ["hernia"], clearance: true }, { allowRestricted: true })).toBe(true);
    expect(limitationAdmits({ name: "Crunch" }, { limitations: ["hernia"], clearance: true }, { allowRestricted: true })).toBe(false);
  });
  it("pregnancy is stage-specific", () => {
    expect(limitationDecision({ name: "Glute Bridge" }, { limitations: ["pregnancy"], pregnancyStage: "pregnant_later" }).status).toBe("RESTRICTED");
    expect(limitationDecision({ name: "Glute Bridge" }, { limitations: ["pregnancy"], pregnancyStage: "pregnant_early" }).status).toBe("ALLOWED");
    expect(limitationDecision({ name: "Jump Squat" }, { limitations: ["pregnancy"], pregnancyStage: "postpartum_later" }).status).toBe("RESTRICTED");
    expect(limitationDecision({ name: "Jump Squat" }, { limitations: ["pregnancy"], pregnancyStage: "postpartum_early" }).status).toBe("BLOCKED");
  });
  it("is enforced inside the one rule engine, incl. prep sections", () => {
    const ctx = { category: "STRENGTH" as never, format: "REPS & SETS" as never, limitations: { limitations: ["knee"] } };
    expect(exerciseRuleBreaks({ name: "Jump Squat", equipment: "body weight" }, ctx).join(" ")).toMatch(/Knee limitation/);
    expect(exerciseRuleBreaks({ name: "Jump Squat", equipment: "body weight" }, { ...ctx, section: "activation" as never }).join(" ")).toMatch(/Knee limitation/);
  });
});
