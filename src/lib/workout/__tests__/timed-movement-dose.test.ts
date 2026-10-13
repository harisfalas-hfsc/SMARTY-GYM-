import { describe, expect, it } from "vitest";
import { isTimeBasedMovement, timedMovementDoseViolation } from "../rules";

describe("timed movements are dosed in time", () => {
  it("flags reps on runs, steps, carries and crawls", () => {
    for (const n of ["Butt Kicks", "Farmers Walk", "Farmer's Carry", "Bear Crawl", "High Knees", "run", "Battling Ropes", "Jump Rope"])
      expect(timedMovementDoseViolation(n, "12 reps")).not.toBeNull();
  });
  it("accepts seconds and leaves countable moves alone", () => {
    expect(timedMovementDoseViolation("Butt Kicks", "40 sec")).toBeNull();
    expect(timedMovementDoseViolation("Farmers Walk", "3 sets × 40 sec — Rest 60 sec")).toBeNull();
    expect(timedMovementDoseViolation("Jump Squat", "12 reps")).toBeNull();
    expect(isTimeBasedMovement("walking high knees lunge")).toBe(false);
  });
});
