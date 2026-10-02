import { describe, expect, it } from "vitest";
import { publicationRuleReports } from "../publication-report";
import type { ComplianceExercise, ComplianceWorkout } from "../smarty-compliance";

const exercise = (id: string, name: string, equipment = "body weight"): ComplianceExercise => ({
  id,
  name,
  equipment,
  body_part: "chest",
  target_muscle: "pectorals",
  secondary_muscles: [],
  category: "strength",
  difficulty: "beginner",
  movement_pattern: null,
  body_region: "upper",
  gif_path: `${id}.gif`,
});

const token = (dose: string, row: ComplianceExercise) => `<ul><li><p>${dose} {{exercise:${row.id}:${row.name}}}</p></li></ul>`;
const activation = exercise("a1", "Bodyweight Squat");
const main = exercise("m1", "Push-Up");
const stretch = exercise("c1", "Hamstring Stretch");

function workout(mainWorkout: string): ComplianceWorkout {
  return { id: "w1", name: "Test", category: "STRENGTH", format: "REPS & SETS", difficulty_stars: 1, duration_min: 30, equipment: ["bodyweight"], main_workout: mainWorkout };
}

describe("admin publication reports", () => {
  it("names the exact Activation exercise, current dose, and allowed dose", () => {
    const html = `<h3>🔥 Activation</h3>${token("3 × 10 reps", activation)}<h3>💪 Main Workout</h3>${token("3 sets × 10 reps", main)}<h3>🧊 Cool Down</h3>${token("30 sec", stretch)}`;
    const reports = publicationRuleReports(workout(html), [activation, main, stretch], ["Activation dose above 10 reps / 30 sec or in sets"]);
    expect(reports[0]).toContain("Publication blocked — Activation Rule");
    expect(reports[0]).toContain("Section: Activation");
    expect(reports[0]).toContain("Exercise: Bodyweight Squat");
    expect(reports[0]).toContain("Current: 3 × 10 reps");
    expect(reports[0]).toContain("Allowed: maximum 10 reps total or 30 sec, with no working sets");
    expect(reports[0]).toContain("Reduce the activation dose");
  });

  it("names the Finisher exercise and equipment that introduces a new station", () => {
    const dumbbellRow = exercise("f1", "Dumbbell Row", "dumbbell");
    const html = `<h3>🔥 Activation</h3>${token("8 reps", activation)}<h3>💪 Main Workout</h3>${token("10 reps", main)}<h3>⚡ Finisher</h3>${token("10 reps", dumbbellRow)}<h3>🧊 Cool Down</h3>${token("30 sec", stretch)}`;
    const reports = publicationRuleReports({ ...workout(html), category: "METABOLIC", format: "CIRCUIT" }, [activation, main, dumbbellRow, stretch], ["Finisher introduces new equipment"]);
    expect(reports[0]).toContain("Publication blocked — Equipment Flow Rule");
    expect(reports[0]).toContain("Section: Finisher");
    expect(reports[0]).toContain("Exercise: Dumbbell Row");
    expect(reports[0]).toContain("Equipment: dumbbell");
    expect(reports[0]).toContain("introduces new equipment");
  });
});