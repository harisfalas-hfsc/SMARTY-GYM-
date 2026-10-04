import { describe, expect, it } from "vitest";
import { exerciseRuleBreaks, holdDoseViolation, isPassiveStretch } from "../rules";
import { PILATES_MAIN_EXERCISES, isPilatesMainExercise } from "../pilates-vocabulary";

const ctx = { category: "PILATES" as const, format: "REPS & SETS" as const };
const ex = (name: string, id?: string, equipment = "body weight", difficulty: string | null = "beginner") => ({
  id, name, equipment, difficulty, body_part: null, target_muscle: null,
});

describe("SmartyGym Pilates exercise list", () => {
  it("has exactly 50 exercises: 28 true Pilates + 22 Pilates-compatible", () => {
    expect(PILATES_MAIN_EXERCISES).toHaveLength(50);
    expect(PILATES_MAIN_EXERCISES.filter((e) => e.group === "true")).toHaveLength(28);
    expect(new Set(PILATES_MAIN_EXERCISES.map((e) => e.id)).size).toBe(50);
  });

  it("allows every listed exercise in Pilates main work, including held positions and stretches", () => {
    for (const e of PILATES_MAIN_EXERCISES) expect(exerciseRuleBreaks(ex(e.name, e.id), ctx)).toEqual([]);
  });

  it("rejects everything else in Pilates main work", () => {
    for (const name of ["push-up", "close-grip push-up", "band close-grip push-up", "pull-in (on stability ball)", "Bicycle Crunch", "jackknife sit-up", "ankle circles", "back extension on exercise ball"])
      expect(exerciseRuleBreaks(ex(name), ctx).join(" ")).toMatch(/not on the SmartyGym Pilates exercise list/);
  });

  it("keeps advanced list items out of Beginner sessions", () => {
    expect(exerciseRuleBreaks(ex("Jackknife", "pilates-jackknife", "body weight", "advanced"), { ...ctx, level: "beginner" })).toHaveLength(1);
  });

  it("matches by id or name", () => {
    expect(isPilatesMainExercise({ id: "pilates-saw", name: "anything" })).toBe(true);
    expect(isPilatesMainExercise({ name: "spine twist pilates" })).toBe(true);
    expect(isPilatesMainExercise({ name: "Pilates Ball Squeeze" })).toBe(false);
  });

  it("treats classical Pilates 'stretch' movements as reps work, not held stretches", () => {
    expect(isPassiveStretch("Double Leg Stretch")).toBe(false);
    expect(holdDoseViolation("Double Leg Stretch", "6 sets × 10 reps Double Leg Stretch")).toBeNull();
    expect(isPassiveStretch("Child's Pose")).toBe(true);
  });

  it("does not change Activation or Cool Down rules", () => {
    expect(exerciseRuleBreaks(ex("Cat-cow"), { ...ctx, section: "activation" })).toEqual([]);
  });
});
