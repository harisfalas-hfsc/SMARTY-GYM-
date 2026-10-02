import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { activationRuleBreak, doseRuleBreak, exerciseRuleBreaks, holdDoseViolation, isLegalExercise, workoutRuleBreaks } from "../rules";
import { filterPool, type PoolExercise } from "../pool.server";

const ex = (id: string, name: string, equipment = "body weight"): PoolExercise => ({
  id, name, equipment, body_part: "waist", target_muscle: "abs", secondary_muscles: [], category: "strength",
  difficulty: "beginner", movement_pattern: null, body_region: null, gif_path: "x.gif", smarty_tags: ["challenge"],
});

describe("one rule engine", () => {
  it("keeps loaded strength work out of Recovery", () => {
    expect(isLegalExercise(ex("1684", "dumbbell step up single leg balance with bicep curl", "dumbbell"), { category: "RECOVERY", format: "MIX" })).toBe(false);
    expect(isLegalExercise(ex("b", "Bird Dog"), { category: "RECOVERY", format: "MIX" })).toBe(true);
  });

  it("makes Cardio blocks rhythmic aerobic work with at most one strength move", () => {
    const ctx = { category: "CARDIO" as const, format: "EMOM" as const, level: "intermediate" as const };
    const bad = [ex("1", "Crab Walk"), ex("2", "suspended push-up"), ex("3", "Dumbbell Goblet Squat", "dumbbell"), ex("4", "Bear Crawl"), ex("5", "Butt Kicks")];
    expect(workoutRuleBreaks(bad, bad, ctx, []).some((v) => /rhythmic aerobic/.test(v))).toBe(true);
    const good = [ex("1", "High Knees"), ex("2", "Jumping Jack"), ex("3", "run"), ex("4", "Butt Kicks"), ex("5", "push-up")];
    expect(workoutRuleBreaks(good, good, ctx, []).some((v) => /rhythmic aerobic/.test(v))).toBe(false);
    expect(isLegalExercise(ex("6", "crunch floor"), { category: "CARDIO", format: "EMOM" })).toBe(false);
  });

  it("keeps passive stretches out of Mobility & Stability main work", () => {
    expect(isLegalExercise(ex("1", "circles knee stretch"), { category: "MOBILITY & STABILITY", format: "REPS & SETS" })).toBe(true);
    expect(isLegalExercise(ex("2", "side wrist pull stretch"), { category: "MOBILITY & STABILITY", format: "REPS & SETS" })).toBe(false);
    expect(isLegalExercise(ex("3", "Dead Bug"), { category: "MOBILITY & STABILITY", format: "REPS & SETS" })).toBe(true);
  });

  it("caps Recovery and Mobility & Stability at 4 sets", () => {
    expect(doseRuleBreak("MOBILITY & STABILITY", "6 sets × 10 reps")).not.toBeNull();
    expect(doseRuleBreak("RECOVERY", "4 sets × 8 reps")).toBeNull();
    expect(doseRuleBreak("STRENGTH", "6 sets × 5 reps")).toBeNull();
  });

  it("keeps plyometric and cardio drills out of Strength, isolated core out of Challenge", () => {
    expect(isLegalExercise(ex("1", "high knee against wall"), { category: "STRENGTH", format: "REPS & SETS" })).toBe(false);
    expect(isLegalExercise(ex("2", "dumbbell step-up", "dumbbell"), { category: "STRENGTH", format: "REPS & SETS" })).toBe(true);
    expect(isLegalExercise(ex("3", "russian twist"), { category: "CHALLENGE", format: "AMRAP" })).toBe(false);
  });

  it("times stretches and holds, and keeps Activation active", () => {
    expect(holdDoseViolation("back pec stretch", "4 sets × 8 reps — Rest 20 sec")).not.toBeNull();
    expect(holdDoseViolation("pike-to-cobra push-up", "5 sets × 8 reps")).toBeNull();
    expect(activationRuleBreak(["Cobra Stretch", "overhead triceps stretch", "triceps stretch"])).not.toBeNull();
    expect(activationRuleBreak(["Bird Dog", "overhead triceps stretch", "Clamshell"])).toBeNull();
  });

  it("bans static holds in a Challenge AMRAP", () => {
    expect(exerciseRuleBreaks(ex("3544", "bodyweight incline side plank"), { category: "CHALLENGE", format: "AMRAP" }).length).toBeGreaterThan(0);
    expect(isLegalExercise(ex("0501", "jack burpee"), { category: "CHALLENGE", format: "AMRAP" })).toBe(true);
  });

  it("rejects a hold dosed in reps", () => {
    expect(holdDoseViolation("plank", "10 reps")).not.toBeNull();
    expect(holdDoseViolation("plank", "30 sec")).toBeNull();
  });

  it("keeps work exercises out of Activation and Cool Down", () => {
    expect(isLegalExercise(ex("0662", "Push-Up"), { category: "CHALLENGE", format: "AMRAP", section: "activation" })).toBe(false);
    expect(isLegalExercise(ex("b", "Bird Dog"), { category: "CHALLENGE", format: "AMRAP", section: "activation" })).toBe(true);
  });

  it("the exercise filter only ever returns what the engine allows", () => {
    const all = [ex("0001", "plank"), ex("0002", "jack burpee"), ex("0003", "hamstring stretch"), ex("0004", "squat jump")];
    const pool = filterPool(all, { category: "CHALLENGE", format: "AMRAP", level: "intermediate", equipmentMode: "BODYWEIGHT", selectedEquipment: ["bodyweight"] } as never);
    for (const e of pool) expect(isLegalExercise(e, { category: "CHALLENGE", format: "AMRAP" })).toBe(true);
    expect(pool.some((e) => e.name === "plank")).toBe(false);
  });

  it("no rule pattern is applied outside the engine files", () => {
    const dir = "src/lib/workout";
    const allowed = new Set(["rules.ts", "doctrine.ts", "prep-vocabulary.ts"]);
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts") && !allowed.has(f))) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src, f).not.toMatch(/STATIC_HOLD_RE\.test|humanRealismViolation\(|flowSpecialtyViolation\(|dynamicExerciseViolation\(|categoryExerciseViolation\(/);
    }
  });
});
