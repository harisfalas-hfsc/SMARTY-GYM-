import { describe, expect, it } from "vitest";
import { exerciseUsage, overusedExerciseIds, usageCap } from "../exercise-usage";

const w = (...ids: string[]) =>
  `<p class="tiptap-paragraph">💪 <strong><u>Main Workout (CIRCUIT)</u></strong></p>` +
  ids.map((id) => `<ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">40 sec {{exercise:${id}:ex ${id}}}</p></li></ul>`).join("");

describe("exercise usage cap", () => {
  it("counts each exercise once per workout", () => {
    expect(exerciseUsage([w("0514", "0514", "1160"), w("0514")]).get("0514")).toBe(2);
  });
  it("caps at 1.3 × fair share", () => {
    expect(usageCap(100, 10)).toBe(13);
  });
  it("marks an exercise that dominates the category", () => {
    const htmls = Array.from({ length: 10 }, (_, i) => w("3360", ["0514", "1160", "0630", "1471"][i % 4]!));
    const over = overusedExerciseIds(htmls, ["3360", "0514", "1160", "0630", "1471"]);
    expect([...over]).toEqual(["3360"]);
  });
});
