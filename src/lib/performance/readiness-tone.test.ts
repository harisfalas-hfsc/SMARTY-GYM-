import { describe, expect, it } from "vitest";
import { readinessBand } from "./readiness-tone";

describe("readiness display bands", () => {
  it("groups recovery and caution scores in the low band", () => {
    for (const score of [0, 1, 2, 3, 4, 5]) expect(readinessBand(score)).toBe("low");
  });
  it("keeps the existing moderate range at 6–7", () => {
    expect(readinessBand(6)).toBe("moderate");
    expect(readinessBand(7)).toBe("moderate");
  });
  it("keeps the existing ready range at 8–10", () => {
    for (const score of [8, 9, 10]) expect(readinessBand(score)).toBe("ready");
  });
  it("never treats missing calibration as ready", () => {
    expect(readinessBand(null)).toBe("uncalibrated");
    expect(readinessBand(undefined)).toBe("uncalibrated");
  });
});