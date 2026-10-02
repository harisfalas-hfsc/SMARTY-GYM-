import { describe, expect, it } from "vitest";
import { prepAllowed } from "../prep-vocabulary";

describe("activation and cool down vocabulary", () => {
  it("rejects work exercises", () => {
    for (const n of ["Push-Up", "Reverse Lunge", "Donkey Kick", "Crab Walk", "Bear Crawl", "Inverted Row"]) {
      expect(prepAllowed(n, "activation")).toBe(false);
      expect(prepAllowed(n, "cooldown")).toBe(false);
    }
  });
  it("accepts mobility, stability and stretches", () => {
    expect(prepAllowed("Bird Dog", "activation")).toBe(true);
    expect(prepAllowed("Glute Bridge", "activation")).toBe(true);
    expect(prepAllowed("Pigeon Pose", "cooldown")).toBe(true);
    expect(prepAllowed("hamstring stretch", "cooldown")).toBe(true);
    expect(prepAllowed("Bird Dog", "cooldown")).toBe(false);
  });
});
