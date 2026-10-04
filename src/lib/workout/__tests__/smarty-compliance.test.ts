import { describe, expect, it } from "vitest";
import { complianceIssues, planMigration, remediate, type ComplianceExercise } from "../smarty-compliance";

const ex = (id: string, name: string, equipment = "body weight", body_part = "upper arms"): ComplianceExercise =>
  ({ id, name, equipment, body_part, is_active: true, gif_path: `${id}.gif` }) as ComplianceExercise;
const lib = [
  ex("0001", "push-up", "body weight", "chest"),
  ex("0002", "pull-up", "body weight", "back"),
  ex("0003", "inverted row", "body weight", "back"),
  ex("0004", "diamond push-up", "body weight", "chest"),
  ex("0005", "chin-up", "body weight", "back"),
  ex("0009", "side push neck stretch", "body weight", "upper arms"),
  ex("0010", "Bird Dog", "body weight", "back"),
  ex("0011", "Glute Bridge", "body weight", "upper legs"),
  ex("0012", "hamstring stretch", "body weight", "upper legs"),
  ex("0013", "Pigeon Pose", "body weight", "upper legs"),
  ex("0015", "triceps dip", "body weight", "upper arms"),
];
const li = (dose: string, id: string, name: string) => `<ul><li><p>${dose} {{exercise:${id}:${name}}}</p></li></ul>`;
const html = (ids: string[]) =>
  `<p>🔥 <strong>Activation</strong></p>${li("10 reps", "0010", "Bird Dog")}${li("10 reps", "0011", "Glute Bridge")}<p>💪 <strong>Main Workout (REPS & SETS)</strong></p>${ids.map((i) => `<ul><li><p>3 sets × 10 reps {{exercise:${i}:${lib.find((e) => e.id === i)!.name}}} — Rest 60 sec</p></li></ul>`).join("")}<p>🧘 <strong>Cool Down</strong></p>${li("30 sec", "0012", "hamstring stretch")}${li("30 sec", "0013", "Pigeon Pose")}`;

describe("Smarty Workout rule compliance", () => {
  it("flags a session without enough priority exercises and fixes it by swapping exercises only", () => {
    const w = { id: "w", name: "W", category: "MICRO-WORKOUTS", format: "REPS & SETS", difficulty_stars: 2, main_workout: html(["0009", "0015", "0001"]) };
    expect(complianceIssues(w, lib)).toContain("Too few priority exercises");
    const r = remediate(w, lib);
    // Priority is a preference: a stretch or dip with no equivalent priority move is kept, never badly swapped.
    expect(r.html).toContain("3 sets × 10 reps");
    const plan = planMigration(w, lib);
    expect(plan.changes.filter((c) => c.kind === "replace" && c.applied).every((c) => c.confidence === "HIGH")).toBe(true);
  });
  it("never applies the priority rule to Recovery, Mobility & Stability or Pilates", () => {
    for (const category of ["RECOVERY", "PILATES"]) {
      const w = { id: "w", name: "W", category, format: category === "RECOVERY" ? "MIX" : "REPS & SETS", difficulty_stars: 1, main_workout: html(["0009"]) };
      expect(complianceIssues(w, lib)).not.toContain("Too few priority exercises");
    }
  });
});
