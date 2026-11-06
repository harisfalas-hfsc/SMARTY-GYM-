import { describe, expect, it } from "vitest";
import { stableRank, workoutEquipmentFor } from "../exercise-public.server";

describe("exercise page related workouts", () => {
  it("maps exercise equipment to Smarty Workout equipment", () => {
    expect(workoutEquipmentFor("body weight")).toBe("bodyweight");
    expect(workoutEquipmentFor("dumbbell")).toBe("dumbbells");
    expect(workoutEquipmentFor("cable")).toBe("machines");
    expect(workoutEquipmentFor("smith machine")).toBe("machines");
    expect(workoutEquipmentFor("ez barbell")).toBe("barbell");
    expect(workoutEquipmentFor("kettlebell")).toBe("kettlebells");
    expect(workoutEquipmentFor("band")).toBe("other");
  });
  it("orders related links the same way on every visit", () => {
    expect(stableRank("pallof-press", "dead-bug")).toBe(stableRank("pallof-press", "dead-bug"));
    expect(stableRank("pallof-press", "dead-bug")).not.toBe(stableRank("bird-dog", "dead-bug"));
  });
});
