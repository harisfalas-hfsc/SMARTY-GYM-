import { describe, expect, it } from "vitest";
import { activationDoseViolation, clampActivationDoses, prepAllowed } from "../prep-vocabulary";

describe("activation and cool down vocabulary", () => {
  it("rejects work, conditioning and loaded exercises", () => {
    for (const n of ["Donkey Kick", "Crab Walk", "Bear Crawl", "Inverted Row", "Burpee", "Jump Squat", "dumbbell rear lunge", "barbell full squat", "diamond push-up", "Dumbbell Upright Row"]) {
      expect(prepAllowed(n, "activation")).toBe(false);
      expect(prepAllowed(n, "cooldown")).toBe(false);
    }
  });
  it("never allows training moves (push-ups, lunges, squats) in Activation or Cool Down", () => {
    for (const n of ["Squat", "Reverse Lunge", "Forward Lunge", "walking lunge", "push-up", "Push-Up", "incline push-up", "Wide-Grip Push-Up"]) {
      expect(prepAllowed(n, "activation")).toBe(false);
      expect(prepAllowed(n, "cooldown")).toBe(false);
    }
    expect(prepAllowed("scapula push-up", "activation")).toBe(true);
  });
  it("accepts mobility, stability and stretches", () => {
    expect(prepAllowed("Bird Dog", "activation")).toBe(true);
    expect(prepAllowed("Glute Bridge", "activation")).toBe(true);
    expect(prepAllowed("Pigeon Pose", "cooldown")).toBe(true);
    expect(prepAllowed("hamstring stretch", "cooldown")).toBe(true);
    expect(prepAllowed("Bird Dog", "cooldown")).toBe(false);
  });
  it("caps Activation at one pass of 10 reps or 30 sec", () => {
    expect(activationDoseViolation("Squat", "10 reps")).toBeNull();
    expect(activationDoseViolation("Squat", "5-10 reps")).toBeNull();
    expect(activationDoseViolation("Bird Dog", "30 sec")).toBeNull();
    expect(activationDoseViolation("Squat", "12 reps")).not.toBeNull();
    expect(activationDoseViolation("Squat", "3 sets × 10 reps")).not.toBeNull();
    expect(activationDoseViolation("Squat", "3 x 10")).not.toBeNull();
    expect(activationDoseViolation("Plank", "45 sec")).not.toBeNull();
  });
  it("repairs over-dosed Activation lines without touching the Main Workout", () => {
    const html = '<p>🔥 Activation</p><ul><li><p>3 sets × 15 reps {{exercise:1:Squat}}</p></li><li><p>60 sec {{exercise:2:plank}}</p></li></ul><p>💪 Main Workout</p><ul><li><p>3 sets × 15 reps {{exercise:3:push-up}}</p></li></ul>';
    const out = clampActivationDoses(html, (n) => n === "plank");
    expect(out).toContain("8 reps {{exercise:1:Squat}}");
    expect(out).toContain("30 sec {{exercise:2:plank}}");
    expect(out).toContain("3 sets × 15 reps {{exercise:3:push-up}}");
  });
});
