import { describe, it, expect } from "vitest";
import { OVERCOMPLICATED_RE } from "../rules";
import { isConditioningListExercise } from "../conditioning-vocabulary";

describe("Haris's 8 Nov 2026 bans", () => {
  it("running is not on the conditioning list", () => {
    for (const n of ["Run", "Short Stride Run", "Wheel Run", "Push to Run"]) expect(isConditioningListExercise({ name: n }, "CARDIO")).toBe(false);
  });
  it("overcomplicated variations are not on the conditioning list", () => {
    for (const n of ["Plyo Push Up", "Clap Push Up", "Lunge With Jump", "Dumbbell Plyo Squat", "Dumbbell Clean", "Kettlebell Hang Clean"]) expect(isConditioningListExercise({ name: n }, "METABOLIC")).toBe(false);
  });
  it("replacements stay allowed", () => {
    for (const n of ["Skater Hops", "Mountain Climber", "Kettlebell Swing", "Dumbbell Push Press"]) expect(isConditioningListExercise({ name: n }, "CARDIO")).toBe(true);
  });
  it("pistol, one-leg, Zercher and good morning are banned; split squats are not", () => {
    for (const n of ["single leg squat (pistol) male", "one leg squat", "barbell zercher squat", "barbell good morning"]) expect(OVERCOMPLICATED_RE.test(n)).toBe(true);
    for (const n of ["dumbbell single leg split squat", "split squats", "barbell front squat"]) expect(OVERCOMPLICATED_RE.test(n)).toBe(false);
  });
});
