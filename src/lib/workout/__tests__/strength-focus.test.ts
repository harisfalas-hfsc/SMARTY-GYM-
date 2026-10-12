import { describe, expect, it } from "vitest";
import { focusBreaks, focusGroup, focusGroups } from "../strength-focus";
import { ALL_PRIORITY_NAMES, PRIORITY_MOVEMENT_PATTERN } from "../priority";

describe("strength focus", () => {
  it("classifies push and pull correctly", () => {
    for (const n of ["push-up", "diamond push-up", "incline push-up", "barbell bench press", "dumbbell arnold press"]) expect(focusGroup(n)).toBe("upper push");
    for (const n of ["inverted row", "suspended row", "lever front pulldown", "dumbbell biceps curl"]) expect(focusGroup(n)).toBe("upper pull");
    for (const n of ["one leg squat", "walking lunge", "bodyweight standing calf raise", "sled 45° leg press"]) expect(focusGroup(n)).toBe("lower push");
    for (const n of ["barbell romanian deadlift", "glute bridge", "lever lying leg curl"]) expect(focusGroup(n)).toBe("lower pull");
    expect(focusGroup("mountain climber")).toBe("conditioning");
    expect(focusGroup("side bridge v. 2")).toBe("core");
  });
  it("rejects push-ups in a Low Push & Upper Pull workout", () => {
    const main = ["bodyweight standing calf raise", "decline push-up", "mountain climber", "diamond push-up", "incline push-up", "one leg squat"];
    expect(focusBreaks("LOW PUSH & UPPER PULL", main, ["inverted row", "crunch floor", "push-up"]).length).toBeGreaterThan(0);
  });
  it("accepts a correct Low Push & Upper Pull workout", () => {
    const main = ["bodyweight standing calf raise", "inverted row", "suspended row", "walking lunge", "forward lunge", "one leg squat"];
    expect(focusBreaks("LOW PUSH & UPPER PULL", main, ["inverted row", "crunch floor", "quads (bodyweight squat)"])).toEqual([]);
  });
  it("every coach-classified movement is one of the coach's priority exercises", () => {
    for (const name of Object.keys(PRIORITY_MOVEMENT_PATTERN)) expect(ALL_PRIORITY_NAMES).toContain(name);
  });
  it("applies the coach's movement-pattern classification", () => {
    expect(focusGroups("Shoulder Tap")).toEqual(["upper push"]);
    expect(focusGroups("Pec Deck")).toEqual(["upper push"]);
    expect(focusGroups("Cable Lateral Raise")).toEqual(["upper push"]);
    expect(focusGroups("Hip Thrust")).toEqual(["lower pull"]);
    expect(focusGroups("Inchworm")).toEqual(["core"]);
    // Conditioning moves the coach lists under Core are NOT core for the engine.
    expect(focusGroups("Burpee")).toEqual(["conditioning"]);
    expect(focusGroups("Shuttle Run")).toEqual(["conditioning"]);
    expect(focusGroups("Medicine Ball Slam")).toEqual(["conditioning"]);
    // Compound thrusters count as both lower-body and upper-body push.
    expect(focusGroups("Dumbbell Thruster")).toEqual(["lower push", "upper push"]);
    expect(focusGroups("Medicine Ball Squat to Press")).toEqual(["lower push", "upper push"]);
  });
  it("lets a compound thruster satisfy either side of a focus", () => {
    expect(focusBreaks("LOW PUSH & UPPER PULL", ["dumbbell thruster", "inverted row", "suspended row"], [])).toEqual([]);
    expect(focusBreaks("LOW PULL & UPPER PUSH", ["barbell deadlift", "dumbbell thruster", "dumbbell bench press"], [])).toEqual([]);
  });
});
