import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { faqSchema, parseStoredFaq, categoryFaq, METHOD_FAQ } from "../faq";

describe("hidden FAQ data", () => {
  it("builds valid FAQPage and drops empty items", () => {
    const s = faqSchema("https://smartygym.com/x", [...METHOD_FAQ, { question: "", answer: "a" }])!;
    expect(s["@type"]).toBe("FAQPage");
    expect(s.mainEntity).toHaveLength(METHOD_FAQ.length);
    expect(faqSchema("u", [])).toBeNull();
  });
  it("parses stored optimizer pairs safely", () => {
    expect(parseStoredFaq([{ question: "Q", answer: "A" }, { question: "x" }, 5])).toEqual([{ question: "Q", answer: "A" }]);
    expect(parseStoredFaq(null)).toEqual([]);
  });
  it("category FAQ says online, home or gym", () => {
    expect(categoryFaq("Pilates", "D.", "pilates")[1]!.answer).toMatch(/online platform/);
  });
  it("robots names AI crawlers and keeps private areas blocked", () => {
    const r = readFileSync("public/robots.txt", "utf8");
    for (const b of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bingbot", "Applebot-Extended"]) expect(r).toContain(b);
    expect(r.match(/Disallow: \/admin/g)!.length).toBe(2);
    expect(r).toContain("Sitemap: https://smartygym.com/sitemap.xml");
  });
});
