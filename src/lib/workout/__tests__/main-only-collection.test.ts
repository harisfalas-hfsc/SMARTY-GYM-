import { describe, expect, it } from "vitest";
import { isMainOnlyWorkout, MAIN_ONLY_WORKOUT_IDS } from "../main-only-collection";
describe("main-only Muscle Building collection", () => {
  it("lists exactly 30 workouts and applies only to MUSCLE BUILDING", () => {
    expect(MAIN_ONLY_WORKOUT_IDS.size).toBe(30);
    const id = [...MAIN_ONLY_WORKOUT_IDS][0];
    expect(isMainOnlyWorkout({ id, category: "MUSCLE BUILDING" })).toBe(true);
    expect(isMainOnlyWorkout({ id, category: "STRENGTH" })).toBe(false);
    expect(isMainOnlyWorkout({ id: "other", category: "MUSCLE BUILDING" })).toBe(false);
  });
});
