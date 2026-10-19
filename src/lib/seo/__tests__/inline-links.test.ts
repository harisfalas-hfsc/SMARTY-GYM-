import { describe, expect, it } from "vitest";
import { linkifyMentions } from "../inline-links";

const TARGETS = [
  { name: "Plank", url: "/exercise-library/plank" },
  { name: "Arm Hypertrophy Blitz", url: "/smarty-workouts/arm-hypertrophy-blitz" },
];

describe("linkifyMentions", () => {
  it("links the first plain-text mention of each target", () => {
    const html = "<p>Try the Plank today. The Plank again.</p>";
    const out = linkifyMentions(html, TARGETS);
    expect(out).toBe(
      '<p>Try the <a href="/exercise-library/plank">Plank</a> today. The Plank again.</p>',
    );
  });

  it("never rewrites inside existing anchors or tags", () => {
    const html = '<p><a href="/x">Plank</a> and <img alt="Plank" src="/a.gif"></p>';
    expect(linkifyMentions(html, TARGETS)).toBe(html);
  });

  it("links workout names and keeps the rest of the sentence intact", () => {
    const html = "<p>Our Arm Hypertrophy Blitz session builds arms.</p>";
    const out = linkifyMentions(html, TARGETS);
    expect(out).toContain('<a href="/smarty-workouts/arm-hypertrophy-blitz">Arm Hypertrophy Blitz</a>');
  });

  it("matches case-insensitively but preserves the article's wording", () => {
    const html = "<p>the plank is simple.</p>";
    expect(linkifyMentions(html, TARGETS)).toBe(
      '<p>the <a href="/exercise-library/plank">plank</a> is simple.</p>',
    );
  });

  it("returns the html unchanged when nothing matches", () => {
    const html = "<p>No known names here.</p>";
    expect(linkifyMentions(html, TARGETS)).toBe(html);
  });
});
