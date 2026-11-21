import { describe, expect, it } from "vitest";
import { readinessBand } from "./readiness-tone";

describe("readiness display bands", () => {
  it("uses red for scores 0–3", () => {
    for (const score of [0, 1, 2, 3]) expect(readinessBand(score)).toBe("low");
  });
  it("uses blue for scores 4–7", () => {
    for (const score of [4, 5, 6, 7]) expect(readinessBand(score)).toBe("moderate");
  });
  it("uses green for scores 8–10", () => {
    for (const score of [8, 9, 10]) expect(readinessBand(score)).toBe("ready");
  });
  it("never treats missing calibration as ready", () => {
    expect(readinessBand(null)).toBe("uncalibrated");
    expect(readinessBand(undefined)).toBe("uncalibrated");
  });
});