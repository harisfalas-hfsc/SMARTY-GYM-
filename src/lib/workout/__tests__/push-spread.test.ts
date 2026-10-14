import { describe, expect, it } from "vitest";
import { improvePicks, memberQualityIssues, movementKey, pushSpreadGap } from "../member-quality";

const ex = (id: string, name: string, target_muscle: string, equipment = "barbell") => ({ id, name, target_muscle, equipment, difficulty: "intermediate" });
const flat = ex("1", "barbell bench press", "pectorals");
const incline = ex("2", "barbell incline bench press", "pectorals");
const decline = ex("3", "barbell decline bench press", "pectorals");
const ohp = ex("4", "barbell seated overhead press", "delts");
const cg = ex("5", "barbell close-grip bench press", "triceps");
const row = ex("6", "barbell bent over row", "upper back");
const pool = [flat, incline, decline, ohp, cg, row];

describe("bench variants and upper push spread", () => {
  it("flat, incline and decline bench are different exercises", () => {
    expect(new Set([flat, incline, decline].map((e) => movementKey(e.name))).size).toBe(3);
  });
  it("chest focus allows every implement as its own exercise", () => {
    expect(movementKey("dumbbell bench press", "CHEST")).not.toBe(movementKey("barbell bench press", "CHEST"));
    expect(movementKey("dumbbell bench press", "UPPER BODY")).toBe(movementKey("barbell bench press", "UPPER BODY"));
  });
  it("chest focus may stack chest variations", () => {
    expect(pushSpreadGap([flat, incline, decline], pool, "CHEST").over).toEqual([]);
  });
  it("upper body spreads push over chest, triceps and shoulders", () => {
    const main = [flat, incline, decline, row];
    expect(pushSpreadGap(main, pool, "UPPER BODY")).toEqual({ over: ["chest"], missing: ["triceps", "shoulders"] });
    expect(memberQualityIssues(main, { level: "intermediate", focus: "UPPER BODY", equipmentExpected: false, pool, minutesFitCount: 4 }).join()).toMatch(/Upper push repeats/);
    const fixed = improvePicks(main, pool, { level: "intermediate", focus: "UPPER BODY", equipmentExpected: false, pool });
    expect(pushSpreadGap(fixed, pool, "UPPER BODY").over).toEqual([]);
    expect(fixed.map((e) => e.id).sort()).toEqual(["1", "4", "5", "6"]);
  });
});
