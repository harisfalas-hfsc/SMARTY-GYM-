import { describe, expect, it } from "vitest";
import { plainExerciseLine, plainParagraph, plainWorkoutHtml, wordyLines } from "../plain-lines";
import { exerciseRuleBreaks } from "../rules";

describe("plain workout text", () => {
  it("drops tempo and cues, keeps dose, side and rest", () => {
    expect(plainExerciseLine("10 reps {{exercise:clamshell:Clamshell}} — 5 each side; tempo 1-sec outward, 2-sec return; rest 15 sec. Use a small range without leaning."))
      .toBe("10 reps {{exercise:clamshell:Clamshell}} — 5 each side, rest 15 sec");
    expect(plainExerciseLine("3 sets × 10 reps {{exercise:0276:dead bug}} — Rest 30 sec between sets. Slow, breath-led control."))
      .toBe("3 sets × 10 reps {{exercise:0276:dead bug}} — Rest 30 sec between sets");
    expect(plainExerciseLine("45 sec {{exercise:1424:seated glute stretch}} — breathe out into the position")).toBe("45 sec {{exercise:1424:seated glute stretch}}");
  });

  it("keeps a dose written after the exercise and Tabata intervals", () => {
    expect(plainExerciseLine("{{exercise:x1:hamstring stretch}} — 1 min each side, breathe slowly")).toBe("{{exercise:x1:hamstring stretch}} — 1 min each side");
    expect(plainExerciseLine("20 sec {{exercise:hk:High Knees}} — 8 rounds of 20 sec work / 10 sec rest, drive the knees")).toBe("20 sec {{exercise:hk:High Knees}} — 8 rounds of 20 sec work / 10 sec rest");
  });

  it("shortens format intros without losing the clock", () => {
    expect(plainParagraph("EMOM 12 min. At the start of every minute do the next exercise in the list: 30 sec work, then rest until the minute ends. Go through the list 4 times."))
      .toBe("EMOM 12 min: 30 sec work, then rest until the next minute. Go through the list 4 times.");
    expect(plainParagraph("Complete straight sets in the order shown, not a circuit. Every repetition takes 5 seconds. The five bilateral entries take 4 minutes each: 35 minutes total, including every prescribed rest."))
      .toBe("Complete all sets of one exercise before moving on.");
  });

  it("flags wordy workouts and is stable once plain", () => {
    const html = '<p>💪 <strong><u>Main Workout (REPS &amp; SETS)</u></strong></p><ul><li><p>3 sets × 10 reps {{exercise:pilates-saw:Saw}} — tempo 2-sec reach, 1-sec pause, 2-sec return; rest 30 sec after every set. Keep knees bent and avoid any change in your lower back.</p></li></ul>';
    expect(wordyLines(html)).toHaveLength(1);
    const plain = plainWorkoutHtml(html);
    expect(wordyLines(plain)).toHaveLength(0);
    expect(plainWorkoutHtml(plain)).toBe(plain);
  });
});

describe("every exercise shows its picture", () => {
  const ctx = { category: "PILATES" as const, format: "REPS & SETS" as const };
  it("rejects a library exercise without a picture in any section", () => {
    const row = { id: "pilates-saw", name: "Saw", equipment: "body weight", difficulty: "beginner", body_part: null, target_muscle: null, gif_path: "" };
    expect(exerciseRuleBreaks(row, ctx).join(" ")).toMatch(/has no picture/);
    expect(exerciseRuleBreaks(row, { ...ctx, section: "activation" }).join(" ")).toMatch(/has no picture/);
    expect(exerciseRuleBreaks({ ...row, gif_path: "legacy/saw.gif" }, ctx)).toEqual([]);
  });
});
