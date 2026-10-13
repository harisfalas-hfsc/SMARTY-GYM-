import { describe, it, expect } from "vitest";
import { conflictsWithLimitations, knownLimitations } from "../limitations";
import { whyThisSession } from "@/lib/coach-rules/why";

describe("limitations", () => {
  it("excludes knee-loading movements", () => {
    expect(conflictsWithLimitations("Bulgarian Split Squat", ["knee"])).toBe(true);
    expect(conflictsWithLimitations("Jump Squat", ["knee"])).toBe(true);
    expect(conflictsWithLimitations("Glute Bridge", ["knee"])).toBe(false);
  });
  it("excludes overhead work for shoulders", () => {
    expect(conflictsWithLimitations("Dumbbell Overhead Press", ["shoulder"])).toBe(true);
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
