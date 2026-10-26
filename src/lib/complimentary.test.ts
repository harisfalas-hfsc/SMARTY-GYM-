import { describe, expect, it } from "vitest";
import { COMPLIMENTARY_MONTH_OPTIONS, complimentaryUntil, isComplimentaryMonths } from "./complimentary";

describe("complimentary members", () => {
  it("offers exactly 1, 2, 3, 6 and 12 months", () => {
    expect([...COMPLIMENTARY_MONTH_OPTIONS]).toEqual([1, 2, 3, 6, 12]);
    expect(isComplimentaryMonths(4)).toBe(false);
  });

  it("12 months from 26 Oct 2026 ends 26 Oct 2027", () => {
    const until = complimentaryUntil(new Date("2026-10-26T12:00:00Z"), 12);
    expect(until.toISOString().slice(0, 10)).toBe("2027-10-26");
  });
});
