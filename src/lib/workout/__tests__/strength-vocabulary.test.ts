import { describe, expect, it } from "vitest";
import { exerciseRuleBreaks, workoutRuleBreaks } from "../rules";
import { STRENGTH_EXERCISES, isStrengthBodyweightListExercise, isStrengthEquipmentListExercise } from "../strength-vocabulary";

const ex = (name: string, equipment: string) => ({ id: name, name, equipment, difficulty: "beginner", body_part: null, target_muscle: null });
const ctx = { category: "STRENGTH" as const, format: "REPS & SETS" as const };

describe("SmartyGym Strength & Muscle Hypertrophy list", () => {
  it("has 50 bodyweight + 50 machines + 50 free weights", () => {
    expect(STRENGTH_EXERCISES).toHaveLength(150);
    expect(STRENGTH_EXERCISES.filter((e) => e.group === "bodyweight")).toHaveLength(50);
    expect(STRENGTH_EXERCISES.filter((e) => e.group === "machine")).toHaveLength(50);
    expect(STRENGTH_EXERCISES.filter((e) => e.group === "free")).toHaveLength(50);
  });
  it("allows listed equipment exercises and blocks others", () => {
    expect(exerciseRuleBreaks(ex("sled 45° leg press", "sled machine"), ctx)).toEqual([]);
    expect(exerciseRuleBreaks(ex("barbell full squat", "barbell"), { ...ctx, category: "MUSCLE BUILDING" })).toEqual([]);
    expect(exerciseRuleBreaks(ex("smith bench press", "smith machine"), ctx).join()).toMatch(/equipment Strength & Muscle Hypertrophy list/);
    expect(exerciseRuleBreaks(ex("dumbbell fly", "dumbbell"), ctx).length).toBeGreaterThan(0);
  });
  it("bodyweight workouts use only the bodyweight list", () => {
    expect(exerciseRuleBreaks(ex("push-up", "body weight"), { ...ctx, bodyweightOnly: true })).toEqual([]);
    expect(exerciseRuleBreaks(ex("mountain climber", "body weight"), { ...ctx, bodyweightOnly: true })).toEqual([]);
    expect(exerciseRuleBreaks(ex("chin-up", "body weight"), { ...ctx, bodyweightOnly: true }).join()).toMatch(/bodyweight Strength/);
    const work = [ex("push-up", "body weight"), ex("chin-up", "body weight")];
    expect(workoutRuleBreaks(work, work, { ...ctx, level: "intermediate" }).join()).toMatch(/chin-up/);
  });
  it("equipment workouts never mix bodyweight-list moves in", () => {
    expect(exerciseRuleBreaks(ex("push-up", "body weight"), { ...ctx, bodyweightOnly: false }).length).toBeGreaterThan(0);
    const work = [ex("barbell bench press", "barbell"), ex("push-up", "body weight")];
    expect(workoutRuleBreaks(work, work, { ...ctx, level: "intermediate" }).join()).toMatch(/push-up/);
  });
  it("matches by library name", () => {
    expect(isStrengthEquipmentListExercise({ name: "Lever T-Bar Row" })).toBe(true);
    expect(isStrengthEquipmentListExercise({ name: "farmers walk" })).toBe(true);
    expect(isStrengthBodyweightListExercise({ name: "inverted row" })).toBe(true);
    expect(isStrengthBodyweightListExercise({ name: "Superman" })).toBe(false);
  });
});
