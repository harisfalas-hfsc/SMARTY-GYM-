import { describe, expect, it } from "vitest";
import { complianceIssues, remediate, type ComplianceExercise } from "../smarty-compliance";

const ex = (id: string, name: string, equipment = "body weight", body_part = "upper arms"): ComplianceExercise =>
  ({ id, name, equipment, body_part, is_active: true, gif_path: `${id}.gif` }) as ComplianceExercise;
const lib = [
  ex("1", "push-up", "body weight", "chest"),
  ex("2", "pull-up", "body weight", "back"),
  ex("3", "inverted row", "body weight", "back"),
  ex("4", "diamond push-up", "body weight", "chest"),
  ex("5", "chin-up", "body weight", "back"),
  ex("9", "side push neck stretch", "body weight", "upper arms"),
];
const html = (ids: string[]) =>
  `<p>💪 <strong>Main Workout (REPS & SETS)</strong></p>${ids.map((i) => `<ul><li><p>3 sets × 10 reps {{exercise:${i}:${lib.find((e) => e.id === i)!.name}}} — Rest 60 sec</p></li></ul>`).join("")}<p>🧘 <strong>Cool Down</strong></p>`;

describe("Smarty Workout rule compliance", () => {
  it("flags a session without enough priority exercises and fixes it by swapping exercises only", () => {
    const w = { id: "w", name: "W", category: "STRENGTH", format: "REPS & SETS", difficulty_stars: 2, main_workout: html(["9", "1", "2"]) };
    expect(complianceIssues(w, lib)).toContain("Too few priority exercises");
    const r = remediate(w, lib);
    expect(r.after).toEqual([]);
    expect(r.html).toContain("3 sets × 10 reps");
  });
  it("never applies the priority rule to Recovery, Mobility & Stability or Pilates", () => {
    for (const category of ["RECOVERY", "PILATES"]) {
      const w = { id: "w", name: "W", category, format: category === "RECOVERY" ? "MIX" : "REPS & SETS", difficulty_stars: 1, main_workout: html(["9"]) };
      expect(complianceIssues(w, lib)).not.toContain("Too few priority exercises");
    }
  });
});
