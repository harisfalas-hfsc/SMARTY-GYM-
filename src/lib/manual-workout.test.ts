import { describe, expect, it } from "vitest";
import { buildManualWorkoutHtml } from "./manual-workout";
import { findTokens } from "./workout/tokens";
describe("manual workout html", () => {
  it("builds sections with library tokens the player reads", () => {
    const html = buildManualWorkoutHtml({
      activation: [{ id: "cat-cow-stretch", name: "Cat-cow", dose: "10 reps" }],
      main: [{ id: "0001", name: "Push {Up}", dose: "<b>3 × 10" }],
      finisher: [],
      cooldown: [],
    });
    expect(html).toContain("Activation");
    expect(html).not.toContain("Finisher");
    expect(html).not.toContain("<b>");
    expect(findTokens(html).map((t) => t.id)).toEqual(["cat-cow-stretch", "0001"]);
  });
});
