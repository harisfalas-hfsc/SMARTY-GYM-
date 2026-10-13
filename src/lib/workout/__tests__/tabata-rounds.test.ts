import { describe, expect, it } from "vitest";
import { parseStepTiming, statedIntervals } from "../parse-steps";
import { deriveStepTracking } from "../tracking-model";
import { workoutRuleBreaks } from "../rules";
import { summarizeStrength } from "../../performance/load";
import type { SetLogRow } from "../../performance/types";

const step = (prescription: string, name = "High Knees") => ({
  name,
  prescription,
  section: "Main Workout" as const,
  subSection: null,
});

describe("Tabata / circuit rounds", () => {
  it("reads the interval count the step states", () => {
    expect(statedIntervals("20 sec — 4 intervals; rest 10 sec")).toBe(4);
    expect(statedIntervals("20 sec — 4 intervals per block, 8 total")).toBe(8);
    expect(statedIntervals("20 sec — 8 rounds of 20 sec work / 10 sec rest")).toBe(8);
    expect(statedIntervals("10 reps")).toBeNull();
  });

  it("times the stated number of Tabata intervals, defaulting to 8", () => {
    expect(parseStepTiming({ ...step("20 sec — 4 intervals"), subSection: "Tabata" })).toMatchObject({ rounds: 4 });
    expect(parseStepTiming({ ...step("20 sec"), subSection: "Tabata" })).toMatchObject({ rounds: 8 });
  });

  it("asks reps per interval and knows how many intervals there are", () => {
    const t = deriveStepTracking({ step: step("20 sec — 4 intervals"), category: "CALORIE BURNING", format: "TABATA", equipment: "body weight" });
    expect(t.metric).toBe("reps_in_time");
    expect(t.roundsTotal).toBe(4);
    const classic = deriveStepTracking({ step: step("20 sec"), category: "CALORIE BURNING", format: "TABATA", equipment: "body weight" });
    expect(classic.roundsTotal).toBe(8);
  });

  it("counts every logged interval in the training load, never just one", () => {
    const rows = [1, 2, 3, 4].map((n) => ({ workout_id: "w", reps: 10, weight_kg: 12, seconds: 20, distance_m: null, rpe: null, set_number: n })) as unknown as SetLogRow[];
    const s = summarizeStrength(rows);
    expect(s.workingSets).toBe(4);
    expect(s.reps).toBe(40);
    expect(s.externalVolumeKg).toBe(480);
  });

  it("rejects travelling runs inside a Tabata main workout", () => {
    const run = { name: "run", equipment: "body weight" } as never;
    const breaks = workoutRuleBreaks([run], [run], { category: "CALORIE BURNING", format: "TABATA", level: "intermediate" } as never);
    expect(breaks.some((b) => b.includes("travelling run"))).toBe(true);
  });
});
