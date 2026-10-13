import { describe, expect, it } from "vitest";
import { buildFinisherHtml, chooseFinisherFormat, finisherFormatIssue, finisherHeadingFormat, finisherLengthIssue, finisherRealSeconds, finisherDeclaredMinutes } from "../finisher-length";

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
  ])("builds a %i-star conditioning finisher of at least %i honest minutes", (stars, min) => {
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
    const lie = wrap(html.replace(/EMOM \d+ min/, "EMOM 30 min").replace(/Total: \d+ minutes/, "Total: 30 minutes"));
    expect(finisherLengthIssue(lie, 2)).toBe("Finisher time does not add up");
  });

  it("never writes the made-up Intervals format", () => {
    for (const category of ["CARDIO", "CALORIE BURNING", "METABOLIC", "CHALLENGE"])
      for (const stars of [1, 2, 3])
        for (const mainFormat of ["CIRCUIT", "EMOM", "AMRAP", "FOR TIME", "TABATA", "MIX"]) {
          const { html, format } = buildFinisherHtml({ category, stars, exercises: ex, mainFormat });
          const full = wrap(html);
          expect(html).not.toMatch(/Intervals/);
          expect(finisherHeadingFormat(full)).toBe(format);
          expect(finisherFormatIssue(full, category)).toBeNull();
          expect(finisherLengthIssue(full, stars)).toBeNull();
          expect(format).not.toBe(mainFormat);
        }
  });

  it("chooses the finisher format from the category purpose, level and main format", () => {
    expect(chooseFinisherFormat({ category: "CARDIO", stars: 2, mainFormat: "TABATA", exerciseCount: 3 })).toBe("EMOM");
    expect(chooseFinisherFormat({ category: "CARDIO", stars: 2, mainFormat: "EMOM", exerciseCount: 3 })).toBe("CIRCUIT");
    expect(chooseFinisherFormat({ category: "CALORIE BURNING", stars: 2, mainFormat: "CIRCUIT", exerciseCount: 3 })).toBe("AMRAP");
    expect(chooseFinisherFormat({ category: "CALORIE BURNING", stars: 1, mainFormat: "CIRCUIT", exerciseCount: 3 })).toBe("TABATA");
    expect(chooseFinisherFormat({ category: "METABOLIC", stars: 3, mainFormat: "EMOM", exerciseCount: 5 })).toBe("TABATA");
    expect(chooseFinisherFormat({ category: "CHALLENGE", stars: 3, mainFormat: "CIRCUIT", exerciseCount: 3 })).toBe("FOR TIME");
    expect(chooseFinisherFormat({ category: "CHALLENGE", stars: 3, mainFormat: "FOR TIME", exerciseCount: 3 })).toBe("AMRAP");
    expect(chooseFinisherFormat({ category: "CHALLENGE", stars: 1, mainFormat: "AMRAP", exerciseCount: 3 })).toBe("EMOM");
    expect(chooseFinisherFormat({ category: "STRENGTH", stars: 2, mainFormat: "REPS & SETS", exerciseCount: 3 })).toBe("REPS & SETS");
  });

  it("flags a finisher whose format is not approved", () => {
    const bad = wrap(`<p class="tiptap-paragraph">⚡ <strong><u>Finisher (Intervals)</u></strong></p><ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">5 rounds × 40 sec {{exercise:0514:jump squat}}</p></li></ul>`);
    expect(finisherFormatIssue(bad, "CARDIO")).toBe("Finisher format not allowed");
  });
});
