import { describe, expect, it } from "vitest";
import { focusViolation } from "../doctrine";
import { improvePicks, memberQualityIssues, movementKey } from "../member-quality";

const ex = (id: string, name: string, equipment = "body weight", difficulty = "intermediate") => ({ id, name, equipment, difficulty, body_part: "", target_muscle: "" });

describe("member workout quality", () => {
  it("Core & Glutes accepts real glute work and rejects inner-thigh / quad work", () => {
    for (const n of ["kettlebell swing", "walking lunge", "dumbbell romanian deadlift", "hanging leg raise", "Glute Bridge"])
      expect(focusViolation(ex("x", n), "CORE & GLUTES")).toBeNull();
    for (const n of ["lever seated hip adduction", "barbell front squat", "dumbbell biceps curl"])
      expect(focusViolation(ex("x", n), "CORE & GLUTES")).not.toBeNull();
  });

  it("treats variations as the same movement", () => {
    expect(movementKey("inchworm")).toBe(movementKey("inchworm v. 2"));
  });

  it("uses equipment, covers glutes + core and avoids beginner rows for Advanced", () => {
    const pool = [
      ex("1", "Glute Bridge", "body weight", "beginner"),
      ex("2", "Bird Dog", "body weight", "beginner"),
      ex("3", "Plank", "body weight", "beginner"),
      ex("4", "kettlebell swing", "kettlebell"),
      ex("5", "walking lunge"),
      ex("6", "hanging leg raise", "body weight", "advanced"),
      ex("7", "lying leg raise flat bench"),
      ex("8", "dumbbell romanian deadlift", "dumbbell"),
    ];
    const ctx = { level: "advanced" as const, focus: "CORE & GLUTES" as const, equipmentExpected: true, pool };
    const out = improvePicks(pool.slice(0, 4), pool, ctx);
    expect(memberQualityIssues(out, { ...ctx, minutesFitCount: 4 })).toEqual([]);
    expect(memberQualityIssues(pool.slice(0, 3), { ...ctx, minutesFitCount: 6 }).length).toBeGreaterThan(0);
  });
});
