import { describe, expect, it } from "vitest";
import { challengeBalanceViolation } from "../doctrine";

const ex = (
  name: string,
  body_part: string,
  equipment = "body weight",
  difficulty: string | null = "intermediate",
) => ({
  name,
  body_part,
  equipment,
  difficulty,
  target_muscle: null,
  secondary_muscles: null,
  category: null,
  movement_pattern: null,
  body_region: null,
});

describe("challengeBalanceViolation", () => {
  it("accepts a balanced full-body bodyweight challenge", () => {
    const block = [
      ex("Burpee", "full body"),
      ex("Push-Up", "chest"),
      ex("Air Squat", "upper legs"),
      ex("Mountain Climber", "waist"),
      ex("Jumping Jack", "full body"),
      ex("Plank Shoulder Tap", "waist"),
    ];
    expect(challengeBalanceViolation(block, "intermediate")).toBeNull();
  });

  it("rejects a one-region challenge block", () => {
    const block = [
      ex("Push-Up", "chest"),
      ex("Incline Push-Up", "chest"),
      ex("Bench Dip", "upper arms"),
      ex("Shoulder Tap", "shoulders"),
    ];
    expect(challengeBalanceViolation(block, "intermediate")).toMatch(/full-body|one body region/i);
  });

  it("rejects a challenge dominated by one region", () => {
    const block = [
      ex("Squat", "upper legs"),
      ex("Lunge", "upper legs"),
      ex("Jump Squat", "upper legs"),
      ex("Step-Up", "upper legs"),
      ex("Push-Up", "chest"),
    ];
    expect(challengeBalanceViolation(block, "intermediate")).toMatch(/never focuses on one body region/i);
  });

  it("rejects a challenge that is not majority bodyweight", () => {
    const block = [
      ex("Kettlebell Swing", "full body", "kettlebell"),
      ex("Dumbbell Thruster", "full body", "dumbbell"),
      ex("Barbell Clean", "full body", "barbell"),
      ex("Push-Up", "chest"),
    ];
    expect(challengeBalanceViolation(block, "intermediate")).toMatch(/majority bodyweight/i);
  });

  it("rejects an intermediate challenge built mostly from beginner material", () => {
    const block = [
      ex("Marching in Place", "full body", "body weight", "beginner"),
      ex("Wall Push-Up", "chest", "body weight", "beginner"),
      ex("Sit-to-Stand", "upper legs", "body weight", "beginner"),
      ex("Burpee", "full body", "body weight", "intermediate"),
    ];
    expect(challengeBalanceViolation(block, "intermediate")).toMatch(/intermediate/i);
  });

  it("ignores blocks too small to judge", () => {
    expect(challengeBalanceViolation([ex("Burpee", "full body")], "intermediate")).toBeNull();
  });
});
