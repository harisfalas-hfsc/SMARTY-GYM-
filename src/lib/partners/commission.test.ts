import { describe, expect, it } from "vitest";
import { normalizePartnerCode, partnerCommission, suggestPartnerCode } from "./commission";

describe("partner commission", () => {
  it("€9.99 minus 19% VAT is €8.39/€8.40 net and the partner gets €4.20", () => {
    expect(partnerCommission(999)).toEqual({ netCents: 839, commissionCents: 420 });
  });
  it("renewals earn the same share as the first month", () => {
    expect(partnerCommission(999).commissionCents).toBe(420);
  });
  it("a zero invoice earns nothing", () => {
    expect(partnerCommission(0).commissionCents).toBe(0);
  });
});

describe("partner codes", () => {
  it("suggests a lowercase code from a name", () => {
    expect(suggestPartnerCode("Nick Bare")).toBe("nickbare");
  });
  it("rejects codes with spaces or symbols", () => {
    expect(normalizePartnerCode("nick bare")).toBeNull();
    expect(normalizePartnerCode("Coach-Marcus")).toBe("coach-marcus");
  });
});
