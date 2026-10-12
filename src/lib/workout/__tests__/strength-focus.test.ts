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
});
