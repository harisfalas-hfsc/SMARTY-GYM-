import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exerciseRuleBreaks, holdDoseViolation, isLegalExercise } from "../rules";
import { filterPool, type PoolExercise } from "../pool.server";

const ex = (id: string, name: string, equipment = "body weight"): PoolExercise => ({
  id, name, equipment, body_part: "waist", target_muscle: "abs", secondary_muscles: [], category: "strength",
  difficulty: "beginner", movement_pattern: null, body_region: null, gif_path: "x.gif", smarty_tags: ["challenge"],
});

describe("one rule engine", () => {
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
