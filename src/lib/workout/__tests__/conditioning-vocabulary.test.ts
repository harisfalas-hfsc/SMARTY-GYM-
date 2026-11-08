import { describe, expect, it } from "vitest";
import { CONDITIONING_EXERCISES, isConditioningListExercise } from "../conditioning-vocabulary";
import { isLegalExercise } from "../rules";

const ctx = (category: any) => ({ category, format: "CIRCUIT" as any, level: "intermediate" as any });

describe("SmartyGym conditioning list", () => {
  it("holds exactly the 60 exercises", () => {
    expect(CONDITIONING_EXERCISES).toHaveLength(61);
    expect(new Set(CONDITIONING_EXERCISES).size).toBe(61);
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
  it("never allows Inchworm in conditioning work", () => {
    for (const c of ["CALORIE BURNING", "CARDIO", "METABOLIC", "CHALLENGE"]) {
      expect(isLegalExercise({ name: "Inchworm", equipment: "body weight" } as any, ctx(c))).toBe(false);
    }
  });
  it("keeps Calorie Burning continuous: no complex jumps or curl combos", () => {
    for (const n of ["Broad Jump", "Scissor Jumps", "Dumbbell Lunge with Bicep Curl", "Wind Sprints"]) {
      expect(isConditioningListExercise({ name: n }, "CALORIE BURNING" as any)).toBe(false);
    }
    expect(isConditioningListExercise({ name: "Broad Jump" }, "CHALLENGE" as any)).toBe(true);
    expect(isConditioningListExercise({ name: "Mountain Climber" }, "CALORIE BURNING" as any)).toBe(true);
  });
});
