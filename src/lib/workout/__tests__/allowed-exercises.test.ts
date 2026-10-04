import { describe, expect, it } from "vitest";
import { computeAllowedExerciseIds } from "../allowed-exercises.server";
import type { RuleExercise } from "../rules";

const ex = (id: string, name: string, equipment = "Bodyweight", difficulty = "beginner"): RuleExercise => ({
  id,
  name,
  equipment,
  difficulty,
  body_part: "Full Body",
  target_muscle: "Full Body",
});

describe("computeAllowedExerciseIds", () => {
  it("marks prep-vocabulary exercises as allowed (activation / cool down)", () => {
    const allowed = computeAllowedExerciseIds([ex("1", "Cat-Cow")]);
    expect(allowed.has("1")).toBe(true);
  });

  it("marks listed strength and conditioning exercises as allowed", () => {
    const allowed = computeAllowedExerciseIds([
      ex("2", "Push-Up"),
      ex("3", "Burpee"),
      ex("4", "Kettlebell Goblet Squat", "Kettlebell"),
    ]);
    expect(allowed.has("2")).toBe(true);
    expect(allowed.has("3")).toBe(true);
    expect(allowed.has("4")).toBe(true);
  });

  it("exercises legal nowhere stay out of the default liked set", () => {
    const allowed = computeAllowedExerciseIds([ex("5", "Zzz Not A Real Exercise", "Cable Machine")]);
    expect(allowed.has("5")).toBe(false);
  });

  it("skips rows without an id", () => {
    const allowed = computeAllowedExerciseIds([{ name: "Cat-Cow", equipment: "Bodyweight" }]);
    expect(allowed.size).toBe(0);
  });
});
