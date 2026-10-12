import { describe, expect, it } from "vitest";
import { deriveStepTracking } from "../tracking-model";

const t = (name: string, prescription: string, opts: { category?: string; format?: string; equipment?: string; section?: string } = {}) =>
  deriveStepTracking({
    step: { name, prescription, section: (opts.section ?? "Main Workout") as never, subSection: null as never },
    category: opts.category ?? "STRENGTH",
    format: opts.format ?? "SETS & REPS",
    equipment: opts.equipment ?? "barbell",
  });

describe("player tracking rules", () => {
  it("loaded sets and reps ask reps + weight", () => {
    const r = t("Barbell Squat", "4 x 8");
    expect([r.askReps, r.load, r.askSeconds, r.distance]).toEqual([true, true, false, false]);
  });
  it("bodyweight sets and reps ask reps only", () => {
    const r = t("Push-Up", "3 x 12", { equipment: "body weight" });
    expect([r.askReps, r.load, r.askSeconds]).toEqual([true, false, false]);
  });
  it("tabata / timed work asks reps in that time, seconds automatic", () => {
    const r = t("Jump Squat", "20 sec", { format: "TABATA", equipment: "body weight" });
    expect(r.metric).toBe("reps_in_time");
    expect([r.askReps, r.askSeconds, r.autoSeconds, r.distance]).toEqual([true, false, 20, false]);
  });
  it("sprints, shuttle runs and bear crawls never ask distance or seconds held", () => {
    for (const n of ["Sprint", "Shuttle Run", "Bear Crawl"]) {
      const r = t(n, "30 sec", { format: "CIRCUIT", equipment: "body weight" });
      expect([r.askReps, r.askSeconds, r.distance, r.autoSeconds]).toEqual([true, false, false, 30]);
    }
  });
  it("real holds ask seconds held", () => {
    const r = t("Plank", "45 sec", { equipment: "body weight" });
    expect([r.askSeconds, r.secondsLabel, r.askReps]).toEqual([true, "Seconds held", false]);
  });
  it("prescribed distance asks time taken, distance automatic", () => {
    const r = t("Rower", "500 m row", { category: "CARDIO", equipment: "rower" });
    expect([r.askSeconds, r.secondsLabel, r.autoDistanceM, r.distance]).toEqual([true, "Time taken (sec)", 500, false]);
  });
  it("timed cardio asks optional distance covered only", () => {
    const r = t("Bike", "10 min", { category: "CARDIO", equipment: "bike" });
    expect([r.distance, r.askSeconds, r.askReps, r.autoSeconds]).toEqual([true, false, false, 600]);
  });
  it("round circuits with fixed reps need no typing; loaded moves ask weight only", () => {
    const bw = t("Bodyweight Squat", "20 reps", { format: "CIRCUIT", equipment: "body weight" });
    expect([bw.primary, bw.autoReps]).toEqual(["completion", 20]);
    const kb = t("Kettlebell Swing", "20 reps", { format: "CIRCUIT", equipment: "kettlebell" });
    expect([kb.askReps, kb.load, kb.autoReps]).toEqual([false, true, 20]);
  });
  it("warm-up and cool down are completion only", () => {
    for (const section of ["Activation", "Warm-up", "Cool-down"])
      expect(t("Cat-Cow", "10 reps", { section }).primary).toBe("completion");
  });
});
