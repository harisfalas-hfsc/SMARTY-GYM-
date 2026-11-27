import { describe, expect, it } from "vitest";
import { combinedFocus, parseCombinedFocus, matchesMuscleSelection, combinationIssues } from "../muscle-spread";
import { focusViolation } from "../doctrine";
import { focusBreaks } from "../strength-focus";
import { pickCombined, combinedMainCount, combinationFits } from "../combined-picks";
import { buildPackWorkout } from "../pack.server";
import { filterPool, type PoolExercise } from "../pool.server";
import { parseWorkoutSteps } from "../parse-steps";
import { isPriorityExercise } from "../priority";
import { movementKey } from "../member-quality";

const ex = (id: string, name: string, target: string, equipment = "dumbbell"): PoolExercise => ({
  id, name, target_muscle: target, equipment, body_part: target === "pectorals" ? "chest" : target === "quads" ? "upper legs" : "upper arms",
  secondary_muscles: [], category: "strength", difficulty: "intermediate", movement_pattern: null, body_region: null, gif_path: `gifs/${id}.gif`,
});
const chest = ["dumbbell bench press", "dumbbell incline bench press", "dumbbell fly", "dumbbell incline fly", "barbell bench press", "barbell incline bench press", "lever chest press", "lever seated fly"]
  .map((n, i) => ex(`chest${i}`, n, "pectorals", n.startsWith("barbell") ? "barbell" : n.startsWith("lever") ? "leverage machine" : "dumbbell"));
const biceps = ["dumbbell biceps curl", "dumbbell hammer curl", "barbell curl", "cable curl", "dumbbell concentration curl", "dumbbell preacher curl"]
  .map((n, i) => ex(`biceps${i}`, n, "biceps", n.startsWith("barbell") ? "barbell" : n.startsWith("cable") ? "cable" : "dumbbell"));
const pool = [...chest, ...biceps];
const options = { seed: 2, favorites: [] };

describe("two-muscle combinations", () => {
  it("retains independent refinements for chest + biceps and quads + shoulders", () => {
    expect(combinedFocus([{ focus: "CHEST", muscle: "" }, { focus: "ARMS", muscle: "biceps" }])).toBe("CHEST + BICEPS");
    expect(parseCombinedFocus("QUADS + SHOULDERS")).toEqual([{ focus: "LEGS", muscle: "quads" }, { focus: "SHOULDERS", muscle: "" }]);
    expect(parseCombinedFocus("CHEST + BACK + LEGS")).toEqual([]);
  });
  it("uses library muscles, rejecting triceps in chest + biceps and hamstrings in quads + shoulders", () => {
    expect(focusViolation(ex("triceps", "Cable Triceps Pushdown", "triceps"), "CHEST + BICEPS")).not.toBeNull();
    expect(focusViolation(ex("hamstrings", "Romanian Deadlift", "hamstrings"), "QUADS + SHOULDERS")).not.toBeNull();
    expect(focusViolation(ex("quads", "Leg Extension", "quads"), "QUADS + SHOULDERS")).toBeNull();
  });
  it("splits four slots 2/2 and five slots 3/2, never adding two whole workouts", () => {
    for (const count of [4, 5]) {
      const picks = pickCombined(pool, count, "CHEST + BICEPS", options);
      expect(picks).toHaveLength(count);
      expect(picks.filter((e) => e.target_muscle === "pectorals")).toHaveLength(Math.ceil(count / 2));
      expect(picks.filter((e) => e.target_muscle === "biceps")).toHaveLength(Math.floor(count / 2));
    }
  });
  it("keeps every work exercise on the coach priority list", () => {
    const picks = pickCombined([...pool, ex("unapproved", "Imaginary Chest Lift", "pectorals")], 4, "CHEST + BICEPS", options);
    expect(picks).toHaveLength(4);
    expect(picks.every(isPriorityExercise)).toBe(true);
    expect(picks.some((e) => e.id === "unapproved")).toBe(false);
  });
  it("retains equipment and dislike filters before selecting either muscle", () => {
    const filtered = filterPool(pool, { category: "MUSCLE BUILDING", format: "REPS & SETS", level: "intermediate", equipmentMode: "EQUIPMENT", selectedEquipment: ["dumbbells"], focus: "CHEST + BICEPS", dislikedIds: ["chest0"] });
    const picks = pickCombined(filtered, 4, "CHEST + BICEPS", options);
    expect(picks).toHaveLength(4);
    expect(picks.every((e) => e.equipment === "dumbbell")).toBe(true);
    expect(picks.some((e) => e.id === "chest0")).toBe(false);
  });
  it("includes an eligible favorite without overriding legality", () => {
    const favorite = chest[1];
    expect(favorite).toBeDefined();
    const picks = pickCombined(pool, 4, "CHEST + BICEPS", { ...options, favorites: [favorite?.id ?? "missing"] });
    expect(picks.map((e) => e.id)).toContain(favorite?.id);
  });
  it("balances a three-exercise finisher with no main movement repeated", () => {
    const main = pickCombined(pool, 4, "CHEST + BICEPS", options);
    const fin = pickCombined(pool, 3, "CHEST + BICEPS", { ...options, seed: 9, excluded: main });
    expect(fin).toHaveLength(3);
    expect(combinationIssues("CHEST + BICEPS", main, fin)).toEqual([]);
    const keys = [...main, ...fin].map((e) => movementKey(e.name, "CHEST + BICEPS"));
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("keeps coverage enforcement in the shared audit and refuses missing groups", () => {
    expect(focusBreaks("CHEST + BICEPS", chest.slice(0, 4), [])).not.toEqual([]);
    const picks = pickCombined(chest, 4, "CHEST + BICEPS", options);
    expect(picks.length).toBeLessThan(4);
    expect(combinationIssues("CHEST + BICEPS", picks, [])).not.toEqual([]);
  });
  it("offers deterministic grouped and alternating variations without changing volume", () => {
    const grouped = pickCombined(pool, 4, "CHEST + BICEPS", { ...options, seed: 3 });
    const alternating = pickCombined(pool, 4, "CHEST + BICEPS", options);
    expect(grouped.map((e) => e.target_muscle)).toEqual(["pectorals", "pectorals", "biceps", "biceps"]);
    expect(alternating.map((e) => e.target_muscle)).toEqual(["pectorals", "biceps", "pectorals", "biceps"]);
    expect(pickCombined(pool, 4, "CHEST + BICEPS", options)).toEqual(alternating);
  });
  it("reserves approved biceps for the finisher instead of exhausting them in Main", () => {
    expect(combinedMainCount(pool, "CHEST + BICEPS", 7, 5, 3)).toBe(5);
    expect(combinationFits(pool, "CHEST + BICEPS", 5, 3)).toBe(true);
    expect(combinationFits(pool, "CHEST + BICEPS", 6, 3)).toBe(false);
  });
  it("does not lower the advanced minimum or use repeats when the approved pool is insufficient", () => {
    expect(combinedMainCount(pool, "CHEST + BICEPS", 7, 6, 3)).toBe(7);
    const dumbbellsOnly = pool.filter((e) => e.equipment === "dumbbell");
    expect(combinationFits(dumbbellsOnly, "CHEST + BICEPS", 4, 3)).toBe(false);
  });
  it("supports quads and shoulders independently without introducing hamstring work", () => {
    const rows = [ex("quad1", "Leg Extension", "quads"), ex("quad2", "Goblet Squat", "quads"), ex("shoulder1", "dumbbell seated shoulder press", "delts"), ex("shoulder2", "dumbbell standing overhead press", "delts"), ex("hamstring", "Romanian Deadlift", "hamstrings")];
    const picks = pickCombined(rows, 4, "QUADS + SHOULDERS", options);
    expect(picks.map((e) => e.id).sort()).toEqual(["quad1", "quad2", "shoulder1", "shoulder2"]);
    expect(combinationIssues("QUADS + SHOULDERS", picks, [])).toEqual([]);
  });
  it("keeps the existing session counts instead of accumulating both muscles' counts", () => {
    const shoulders = ["dumbbell seated shoulder press", "dumbbell standing overhead press", "dumbbell one arm shoulder press", "Barbell Overhead Press", "Machine Shoulder Press", "Cable Lateral Raise"].map((n, i) => ex(`shoulder${i}`, n, "delts"));
    const sessionPool = [...chest, ...shoulders];
    const input = { category: "MUSCLE BUILDING", format: "REPS & SETS", level: "intermediate", minutes: 45, seed: 2, finisher: true } as const;
    const single = buildPackWorkout(sessionPool, sessionPool, { ...input, focus: "CHEST" });
    const combined = buildPackWorkout(sessionPool, sessionPool, { ...input, focus: "CHEST + SHOULDERS" });
    expect(combined.main.length).toBe(single.main.length);
    const fin = parseWorkoutSteps(combined.html).filter((s) => s.section === "Finisher");
    expect(fin).toHaveLength(3);
    expect(combined.main.some((e) => matchesMuscleSelection(e, { focus: "SHOULDERS", muscle: "" }))).toBe(true);
  });
});