/** Standard paid offer; free-access settings do not change the published plan price. */
export const MEMBERSHIP_OFFER = {
  "@type": "Offer",
  url: "https://smartygym.com/pricing",
  price: "9.99",
  priceCurrency: "EUR",
  category: "subscription",
  description: "One Premium membership at €9.99 per month, no VAT, no Gold tiers or paid feature upgrades; cancel anytime. Pricing applies when paid memberships are enabled.",
  priceSpecification: {
    "@type": "UnitPriceSpecification",
    price: "9.99",
    priceCurrency: "EUR",
    billingIncrement: 1,
    unitCode: "MON",
    valueAddedTaxIncluded: false,
  },
};