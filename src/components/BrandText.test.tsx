import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandText } from "./BrandText";

const render = (text: string, name?: string | null) => renderToStaticMarkup(<BrandText text={text} name={name} />);

describe("BrandText", () => {
  it("colours the Coach name inside ordinary copy", () => {
    const html = render("Renew your membership to reconnect Smarty Coach with your saved training history.");
    expect(html).toContain('<span class="text-primary">Smarty Coach</span>');
    expect(html).toContain("Renew your membership to reconnect");
  });

  it("colours the member's own name inside the greeting", () => {
    const html = render("Good evening, Haris!", "Haris");
    expect(html).toContain('<span class="text-primary">Haris</span>');
    expect(html).toContain("Good evening, ");
    expect(html).toContain("!");
  });

  it("colours both the Coach name and the member's name in one sentence", () => {
    const html = render("Smarty Coach kept Haris on plan.", "Haris");
    expect(html.match(/class="text-primary"/g)).toHaveLength(2);
  });

  it("leaves copy without those words untouched", () => {
    const html = render("Readiness 9/10 — rested.");
    expect(html).not.toContain("text-primary");
    expect(html).toContain("Readiness 9/10");
  });

  it("never colours the neutral 'there' fallback", () => {
    const html = render("Good morning, there!", "there");
    expect(html).not.toContain("text-primary");
  });

  it("handles a name with regular-expression characters safely", () => {
    const html = render("Welcome back, A+B!", "A+B");
    expect(html).toContain('<span class="text-primary">A+B</span>');
  });
});
