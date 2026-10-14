import { describe, expect, it } from "vitest";
import { improvePicks, memberQualityIssues, movementKey } from "../member-quality";
import { muscleRequestBreak, muscleSpreadGap } from "../muscle-spread";

const ex = (id: string, name: string, target_muscle: string, equipment = "barbell") => ({ id, name, target_muscle, equipment, difficulty: "intermediate" });
const flat = ex("1", "barbell bench press", "pectorals");
const incline = ex("2", "barbell incline bench press", "pectorals");
const decline = ex("3", "barbell decline bench press", "pectorals");
const ohp = ex("4", "barbell seated overhead press", "delts");
const cg = ex("5", "barbell close-grip bench press", "triceps");
const row = ex("6", "barbell bent over row", "upper back");
const pool = [flat, incline, decline, ohp, cg, row];

describe("bench variants and muscle spread", () => {
  it("flat, incline and decline bench are different exercises", () => {
    expect(new Set([flat, incline, decline].map((e) => movementKey(e.name))).size).toBe(3);
  });
  it("chest focus allows every implement as its own exercise", () => {
    expect(movementKey("dumbbell bench press", "CHEST")).not.toBe(movementKey("barbell bench press", "CHEST"));
    expect(muscleSpreadGap([flat, incline, decline], pool, "CHEST").over).toEqual([]);
  });
  it("push spreads over chest, triceps and shoulders", () => {
    const main = [flat, incline, decline, row];
    expect(muscleSpreadGap(main, pool, "UPPER BODY")).toEqual({ over: ["chest"], missing: ["shoulders", "triceps"] });
    expect(memberQualityIssues(main, { level: "intermediate", focus: "UPPER BODY", equipmentExpected: false, pool, minutesFitCount: 4 }).join()).toMatch(/repeats/);
    const fixed = improvePicks(main, pool, { level: "intermediate", focus: "UPPER BODY", equipmentExpected: false, pool });
    expect(muscleSpreadGap(fixed, pool, "UPPER BODY").over).toEqual([]);
  });

  const squat = ex("a", "barbell full squat", "quads");
  const lunge = ex("b", "barbell lunge", "quads");
  const front = ex("c", "barbell front squat", "quads");
  const rdl = ex("d", "barbell romanian deadlift", "hamstrings");
  const thrust = ex("e", "barbell hip thrust", "glutes");
  const calf = ex("f", "barbell standing calf raise", "calves");
  const legs = [squat, lunge, front, rdl, thrust, calf];
  it("legs without a muscle request uses quads, hamstrings, glutes and calves", () => {
    const fixed = improvePicks([squat, lunge, front, rdl], legs, { level: "intermediate", focus: "LEGS", equipmentExpected: false, pool: legs });
    expect(new Set(fixed.map((e) => e.target_muscle)).size).toBe(4);
  });
  it("legs + quads keeps only quad exercises — no deadlifts or calf raises", () => {
    expect(muscleRequestBreak(rdl, "LEGS", "quads")).toMatch(/quads/);
    expect(muscleRequestBreak(calf, "LEGS", "quads")).toMatch(/quads/);
    expect(muscleRequestBreak(front, "LEGS", "quads")).toBeNull();
    expect(muscleSpreadGap([squat, lunge, front], legs, "LEGS", "quads").over).toEqual([]);
  });
});
