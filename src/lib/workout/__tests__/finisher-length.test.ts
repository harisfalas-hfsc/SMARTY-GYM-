import { describe, expect, it } from "vitest";
import { buildFinisherHtml, finisherLengthIssue, finisherRealSeconds, finisherDeclaredMinutes } from "../finisher-length";

const wrap = (fin: string) =>
  `<p class="tiptap-paragraph">💪 <strong><u>Main Workout (CIRCUIT)</u></strong></p>${fin}<p class="tiptap-paragraph">🧘 <strong><u>Cool Down</u></strong></p>`;
const ex = [
  { id: "0514", name: "jump squat" },
  { id: "3361", name: "skater hops" },
  { id: "high-knees", name: "High Knees" },
];

describe("finisher length rule", () => {
  it("flags the old 5-minute finisher that really lasts about one minute", () => {
    const old = wrap(
      `<p class="tiptap-paragraph">⚡ <strong><u>Finisher (5 minutes)</u></strong></p><p class="tiptap-paragraph">3 rounds.</p><ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">20 sec {{exercise:0514:jump squat}}</p></li></ul>`,
    );
    expect(finisherRealSeconds(old)).toBe(60);
    expect(finisherLengthIssue(old, 3)).toBe("Finisher shorter than the level minimum");
  });

  it.each([
    [1, 12],
    [2, 15],
    [3, 20],
  ])("builds a %i-star interval finisher of at least %i honest minutes", (stars, min) => {
    const { html, minutes } = buildFinisherHtml({ category: "CALORIE BURNING", stars, exercises: ex });
    const full = wrap(html);
    expect(minutes).toBeGreaterThanOrEqual(min);
    expect(Math.round(finisherRealSeconds(full)! / 60)).toBe(minutes);
    expect(finisherDeclaredMinutes(full)).toBe(minutes);
    expect(finisherLengthIssue(full, stars)).toBeNull();
  });

  it.each([1, 2, 3])("builds a %i-star strength finisher that meets its minimum", (stars) => {
    const { html } = buildFinisherHtml({ category: "STRENGTH", stars, exercises: ex.slice(0, 2) });
    expect(finisherLengthIssue(wrap(html), stars)).toBeNull();
  });

  it("flags a stated time that does not add up", () => {
    const { html } = buildFinisherHtml({ category: "CARDIO", stars: 2, exercises: ex });
    const lie = wrap(html.replace(/Total: \d+ minutes/, "Total: 30 minutes"));
    expect(finisherLengthIssue(lie, 2)).toBe("Finisher time does not add up");
  });
});
