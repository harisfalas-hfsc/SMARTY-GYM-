import { describe, expect, it } from "vitest";
import { exerciseRuleBreaks, workoutRuleBreaks } from "../rules";
import { STRENGTH_EXERCISES, isStrengthListExercise } from "../strength-vocabulary";

const ex = (name: string, equipment: string) => ({ id: name, name, equipment, difficulty: "beginner", body_part: null, target_muscle: null });
const ctx = { category: "STRENGTH" as const, format: "REPS & SETS" as const };

describe("SmartyGym Strength & Muscle Building list", () => {
  it("has 50 machines + 50 free weights", () => {
    expect(STRENGTH_EXERCISES).toHaveLength(100);
    expect(STRENGTH_EXERCISES.filter((e) => e.group === "machine")).toHaveLength(50);
  });
  it("allows listed exercises and blocks other equipment exercises", () => {
    expect(exerciseRuleBreaks(ex("sled 45° leg press", "sled machine"), ctx)).toEqual([]);
    expect(exerciseRuleBreaks(ex("barbell full squat", "barbell"), { ...ctx, category: "MUSCLE BUILDING" })).toEqual([]);
    expect(exerciseRuleBreaks(ex("smith bench press", "smith machine"), ctx).join()).toMatch(/Strength & Muscle Building exercise list/);
    expect(exerciseRuleBreaks(ex("cable incline fly (on stability ball)", "cable"), ctx).length).toBeGreaterThan(0);
  });
  it("blocks bodyweight moves in an equipment workout but keeps bodyweight-only workouts", () => {
    expect(exerciseRuleBreaks(ex("chin-up", "body weight"), { ...ctx, bodyweightOnly: false }).length).toBeGreaterThan(0);
    expect(exerciseRuleBreaks(ex("push-up", "body weight"), ctx)).toEqual([]);
    const work = [ex("barbell bench press", "barbell"), ex("chin-up", "body weight"), ex("barbell deadlift", "barbell")];
    expect(workoutRuleBreaks(work, work, { ...ctx, level: "intermediate" }).join()).toMatch(/chin-up/);
  });
  it("matches by library name or list name", () => {
    expect(isStrengthListExercise({ name: "Lever T-Bar Row" })).toBe(true);
    expect(isStrengthListExercise({ name: "lever t bar row" })).toBe(true);
    expect(isStrengthListExercise({ name: "Kettlebell Romanian Deadlift" })).toBe(false);
  });
});
