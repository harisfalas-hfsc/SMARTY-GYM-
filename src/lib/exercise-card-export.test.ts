import { describe, expect, it } from "vitest";
import { exerciseFacts, exerciseFilename, type ExportExercise } from "./exercise-card-export";

const exercise: ExportExercise = {
  id: "0276", name: "Dead Bug", body_part: "waist", equipment: "body weight",
  target_muscle: "abs", secondary_muscles: ["hip flexors", "lower back"],
  difficulty: "Beginner", description: "Original library description.",
  instructions: ["First original instruction.", "Second original instruction."], gif_path: "gifs/0276.gif",
};

describe("exercise download data", () => {
  it("preserves the original library facts without replacing the exercise", () => {
    expect(exerciseFacts(exercise)).toEqual([
      ["Body part", "waist"], ["Target", "abs"], ["Equipment", "body weight"],
      ["Level", "Beginner"], ["Secondary muscles", "hip flexors, lower back"],
    ]);
    expect(exercise.instructions).toEqual(["First original instruction.", "Second original instruction."]);
  });
  it("keeps distinct exercise IDs in portable filenames", () => {
    expect(exerciseFilename(exercise)).toBe("dead-bug-0276");
    expect(exerciseFilename({ ...exercise, id: "9999" })).toBe("dead-bug-9999");
  });
});