import { describe, expect, it } from "vitest";
import { flowSpecialtyViolation, humanRealismViolation, dynamicExerciseViolation } from "../doctrine";

const ex = (name: string, equipment = "body weight") => ({ name, equipment }) as never;

describe("master engine rules", () => {
  it("rejects balance tools and isolation machines in a Challenge", () => {
    for (const n of ["lever leg extension", "lever pec deck fly", "lever seated calf raise", "bosu squat", "cable curl"])
      expect(flowSpecialtyViolation(ex(n, "leverage machine"), "CHALLENGE", "CIRCUIT")).not.toBeNull();
  });
  it("keeps machines legal in Strength / Muscle Building", () => {
    expect(flowSpecialtyViolation(ex("lever leg extension", "leverage machine"), "MUSCLE BUILDING", "REPS & SETS")).toBeNull();
  });
  it("allows balance tools in Mobility & Stability reps & sets", () => {
    expect(flowSpecialtyViolation(ex("bosu squat", "bosu ball"), "MOBILITY & STABILITY", "REPS & SETS")).toBeNull();
  });
  it("treats dumbbell/kettlebell snatch and clean as fundamental", () => {
    expect(humanRealismViolation(ex("dumbbell snatch", "dumbbell"))).toBeNull();
    expect(dynamicExerciseViolation(ex("kettlebell clean and press", "kettlebell"), "METABOLIC", "AMRAP")).toBeNull();
    expect(humanRealismViolation(ex("barbell snatch", "barbell"))).not.toBeNull();
  });
});
