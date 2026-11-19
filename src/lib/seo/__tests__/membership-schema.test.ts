import { describe, expect, it } from "vitest";
import { MEMBERSHIP_OFFER } from "../membership-schema";

describe("standard Premium membership schema", () => {
  it("publishes the flat €9.99 monthly price", () => {
    expect(MEMBERSHIP_OFFER.price).toBe("9.99");
    expect(MEMBERSHIP_OFFER.priceCurrency).toBe("EUR");
    expect(MEMBERSHIP_OFFER.priceSpecification.price).toBe("9.99");
    expect(MEMBERSHIP_OFFER.priceSpecification.billingIncrement).toBe(1);
    expect(MEMBERSHIP_OFFER.priceSpecification.unitCode).toBe("MON");
  });

  it("does not represent VAT as part of the membership price", () => {
    expect(MEMBERSHIP_OFFER.priceSpecification.valueAddedTaxIncluded).toBe(false);
  });
});