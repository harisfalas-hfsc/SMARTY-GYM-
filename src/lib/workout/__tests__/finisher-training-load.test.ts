import { describe, expect, it } from "vitest";
import { buildFinisherHtml } from "../finisher-length";
import { parseWorkoutSteps } from "../parse-steps";
import { deriveStepTracking } from "../tracking-model";
import { conditioningLoad, strengthLoad } from "@/lib/performance/load";

const ex = [
  { id: "0514", name: "jump squat" },
  { id: "0630", name: "mountain climber" },
  { id: "1160", name: "burpee" },
  { id: "3361", name: "skater hops" },
  { id: "high-knees", name: "High Knees" },
];
const wrap = (fin: string) =>
  `<p class="tiptap-paragraph">💪 <strong><u>Main Workout (CIRCUIT)</u></strong></p>${fin}<p class="tiptap-paragraph">🧘 <strong><u>Cool Down</u></strong></p>`;

/** Logs every programmed round of every Finisher step exactly as the player would. */
function logAll(html: string, mainFormat: string) {
  const steps = parseWorkoutSteps(html).filter((s) => s.section === "Finisher");
  const rows: any[] = [];
  for (const step of steps) {
    const tr = deriveStepTracking({ step, category: "CALORIE BURNING", format: mainFormat, equipment: "body weight" });
    const n = tr.roundsTotal ?? 1;
    for (let k = 0; k < n; k++) rows.push({ reps: tr.autoReps ?? 10, weight_kg: null, seconds: tr.autoSeconds, interval_index: tr.roundsTotal ? k + 1 : null });
  }
  return { steps, rows };
}

describe("finisher Training Load counts every round actually done", () => {
  it.each([
    ["EMOM", 40, 5],
    ["CIRCUIT", 40, 5],
    ["TABATA", 20, 8],
  ])("%s: one logged row per round, seconds summed over all rounds", (format, sec, rounds) => {
    const { html } = buildFinisherHtml({ category: "CALORIE BURNING", stars: 2, exercises: format === "TABATA" ? ex : ex.slice(0, 3), mainFormat: "AMRAP", format });
    const { steps, rows } = logAll(wrap(html), "AMRAP");
    expect(rows.length).toBe(steps.length * rounds);
    expect(conditioningLoad({ sets: rows })).toBe(steps.length * rounds * sec);
    expect(rows.every((r) => r.interval_index !== null)).toBe(true);
  });

  it("FOR TIME: every round of every exercise is logged, bodyweight never gets invented kg", () => {
    const { html } = buildFinisherHtml({ category: "CHALLENGE", stars: 3, exercises: [ex[0]!, ex[2]!], mainFormat: "CIRCUIT", format: "FOR TIME" });
    const rounds = Number(html.match(/(\d+) rounds for time/)![1]);
    const { steps, rows } = logAll(wrap(html), "CIRCUIT");
    expect(rows.length).toBe(steps.length * rounds);
    expect(strengthLoad(rows)).toBeNull();
  });

  it("AMRAP: rounds are open — each round the member logs counts once", () => {
    const { html } = buildFinisherHtml({ category: "CALORIE BURNING", stars: 2, exercises: ex.slice(0, 3), mainFormat: "CIRCUIT", format: "AMRAP" });
    const steps = parseWorkoutSteps(wrap(html)).filter((s) => s.section === "Finisher");
    for (const s of steps) expect(deriveStepTracking({ step: s, category: "CALORIE BURNING", format: "CIRCUIT", equipment: "body weight" }).roundsTotal).toBeNull();
  });
});
