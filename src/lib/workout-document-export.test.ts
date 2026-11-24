import { describe, expect, it } from "vitest";
import { workoutDocumentParts } from "./workout-document-export";
import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";

describe("read-only workout document data", () => {
  it("includes every stored workout block without changing prescriptions or records", () => {
    const workout: WorkoutRow = {
      id: "original", name: "Record", category: "STRENGTH", format: null, focus: null,
      difficulty_stars: 2, difficulty_label: null, duration_min: 30, duration_label: null,
      equipment: ["dumbbells"], location: null, image_url: "https://example.com/cover.jpg",
      description_html: "<p>Original description</p>", main_workout: "<p>4 sets × 8 reps {{exercise:0276:Dead Bug}} — Rest 60 sec</p>",
      instructions_html: "<ol><li>Original instructions</li></ol>", tips_html: "<p>Original tips</p>",
      created_by: "member", status: "completed",
    };
    const before = structuredClone(workout);
    expect(workoutDocumentParts(workout).map(part => part.html)).toEqual([
      workout.description_html, workout.main_workout, workout.instructions_html, workout.tips_html,
    ]);
    expect(workout).toEqual(before);
  });
});