import { describe, expect, it } from "vitest";
import { afterPlayerSet, playerLogStepIndex, playerSetTarget, prescribedRestSeconds } from "../player-flow";
import { deriveStepTracking } from "../tracking-model";
import { buildSlides, type WorkoutStep } from "../parse-steps";

describe("gym-floor player", () => {
  it("logs the original exercise position, excluding preparation and transition slides", () => {
    const steps: WorkoutStep[] = [
      { exerciseId: "1", name: "Squat", prescription: "10 reps", section: "Activation", subSection: null },
      { exerciseId: "2", name: "Press", prescription: "4 × 10 reps", section: "Main Workout", subSection: null },
    ];
    const slides = buildSlides(steps, ["Foam roll"]);
    expect(slides.map(playerLogStepIndex)).toEqual([null, 0, null, 1]);
  });
  it("uses only stated rest and converts minutes to seconds", () => {
    expect(prescribedRestSeconds("4 × 10 reps. Rest 60 sec.")).toBe(60);
    expect(prescribedRestSeconds("12 reps; rest 1.5 min")).toBe(90);
    expect(prescribedRestSeconds("30 sec plank")).toBe(0);
  });
  it("keeps all four strength sets on the exercise before advancing", () => {
    expect(playerSetTarget("4 × 10 reps", null)).toBe(4);
    expect(afterPlayerSet({ logged: 1, target: 4, restSeconds: 60 })).toEqual({ nextExercise: false, restSeconds: 60 });
    expect(afterPlayerSet({ logged: 4, target: 4, restSeconds: 60 }).nextExercise).toBe(true);
  });
  it("keeps each of eight Tabata intervals separate", () => {
    const tracking = deriveStepTracking({ step: { name: "Squat", prescription: "20 sec work, 10 sec rest, 8 intervals", section: "Main Workout", subSection: "Tabata" }, equipment: "body weight" });
    expect(playerSetTarget("20 sec work, 10 sec rest, 8 intervals", tracking)).toBe(8);
    expect(afterPlayerSet({ logged: 7, target: 8, restSeconds: 10 }).nextExercise).toBe(false);
  });
});