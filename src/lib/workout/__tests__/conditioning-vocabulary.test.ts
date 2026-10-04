import { describe, expect, it } from "vitest";
import { CONDITIONING_EXERCISES, isConditioningListExercise } from "../conditioning-vocabulary";
import { isLegalExercise } from "../rules";

const ctx = (category: any) => ({ category, format: "CIRCUIT" as any, level: "intermediate" as any });

describe("SmartyGym conditioning list", () => {
  it("holds exactly the 60 exercises", () => {
    expect(CONDITIONING_EXERCISES).toHaveLength(63);
    expect(new Set(CONDITIONING_EXERCISES).size).toBe(63);
  });
  it("only list exercises are legal in Calorie Burning, Cardio, Metabolic and Challenge work", () => {
    for (const c of ["CALORIE BURNING", "CARDIO", "METABOLIC", "CHALLENGE"]) {
      expect(isLegalExercise({ name: "push-up", equipment: "body weight" } as any, ctx(c))).toBe(false);
      expect(isLegalExercise({ name: "Crab Walk", equipment: "body weight" } as any, ctx(c))).toBe(false);
    }
    expect(isLegalExercise({ name: "Burpee", equipment: "body weight" } as any, ctx("CALORIE BURNING"))).toBe(true);
    expect(isConditioningListExercise({ name: "kettlebell swing" })).toBe(true);
  });
  it("does not apply to other categories or to Activation / Cool Down", () => {
    expect(isLegalExercise({ name: "push-up", equipment: "body weight" } as any, ctx("STRENGTH"))).toBe(true);
    expect(isLegalExercise({ name: "Cat-cow", equipment: "body weight" } as any, { ...ctx("CARDIO"), section: "activation" })).toBe(true);
  });
});
