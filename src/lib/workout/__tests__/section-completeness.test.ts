import { describe, expect, it } from "vitest";
import { pickPrep, type PoolExercise } from "../pool.server";
import { complianceIssues, type ComplianceExercise } from "../smarty-compliance";
import { manualStructureIssues } from "../../manual-workout";

const prep = (id: string, name: string, body_part: string) => ({ id, name, body_part, equipment: "body weight" }) as PoolExercise;

describe("every workout keeps complete sections", () => {
  it("Activation picker returns the requested count (seed 24399 used to lock onto one body part)", () => {
    const pool = [
      prep("1", "dynamic chest stretch", "chest"),
      prep("2", "wrist circles", "lower arms"),
      prep("3", "scapula push-up", "chest"),
      prep("4", "Bird Dog", "Back"),
      prep("5", "Cat-cow", "Back"),
      prep("6", "Spine Stretch Forward", "back"),
    ];
    for (const seed of [24399, 1, 7, 101, 99999]) {
      const picks = pickPrep(pool, 4, seed);
      expect(picks).toHaveLength(4);
      expect(new Set(picks.map((p) => p.id)).size).toBe(4);
    }
  });

  it("flags an empty Activation and a Finisher with fewer than 3 exercises", () => {
    const ex = (id: string, name: string, body_part = "chest") => ({ id, name, equipment: "body weight", body_part, is_active: true, gif_path: `${id}.gif` }) as ComplianceExercise;
    const lib = [ex("0101", "push-up"), ex("0102", "pull-up", "back"), ex("0103", "inverted row", "back"), ex("0104", "diamond push-up"), ex("s1", "hamstring stretch", "upper legs"), ex("s2", "Pigeon Pose", "upper legs")];
    const li = (t: string) => `<ul><li><p>${t}</p></li></ul>`;
    const html = `<p>🔥 <strong>Activation</strong></p><p>💪 <strong>Main Workout (REPS & SETS)</strong></p>${li("3 sets × 10 reps {{exercise:0101:push-up}} — Rest 60 sec")}${li("3 sets × 10 reps {{exercise:0102:pull-up}} — Rest 60 sec")}${li("3 sets × 10 reps {{exercise:0103:inverted row}} — Rest 60 sec")}<p>⚡ <strong>Finisher</strong></p>${li("3 sets × 10 reps {{exercise:0104:diamond push-up}} — Rest 60 sec")}<p>🧘 <strong>Cool Down</strong></p>${li("30 sec {{exercise:s1:hamstring stretch}}")}${li("30 sec {{exercise:s2:Pigeon Pose}}")}`;
    const issues = complianceIssues({ id: "w", name: "W", category: "MUSCLE BUILDING", format: "REPS & SETS", difficulty_stars: 2, main_workout: html }, lib);
    expect(issues).toContain("Activation has fewer than 2 movements");
    expect(issues).toContain("Finisher has fewer than 3 exercises");
  });

  it("member-built workouts need Activation, Main Workout and Cool Down, without repeats", () => {
    const e = (id: string) => ({ id });
    expect(manualStructureIssues({ activation: [], main: [e("1"), e("2"), e("3")], finisher: [], cooldown: [e("4"), e("5")] })[0]).toMatch(/Activation/);
    expect(manualStructureIssues({ activation: [e("a"), e("b")], main: [e("1"), e("2")], finisher: [], cooldown: [e("4"), e("5")] })[0]).toMatch(/Main Workout/);
    expect(manualStructureIssues({ activation: [e("a"), e("b")], main: [e("1"), e("2"), e("3")], finisher: [], cooldown: [e("4")] })[0]).toMatch(/Cool Down/);
    expect(manualStructureIssues({ activation: [e("a"), e("b")], main: [e("1"), e("2"), e("3")], finisher: [e("1")], cooldown: [e("4"), e("5")] })[0]).toMatch(/both/);
    expect(manualStructureIssues({ activation: [e("a"), e("b")], main: [e("1"), e("2"), e("3")], finisher: [], cooldown: [e("4"), e("5")] })).toEqual([]);
  });
});
