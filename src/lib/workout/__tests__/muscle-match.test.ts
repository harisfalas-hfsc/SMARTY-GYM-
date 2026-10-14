import { describe, expect, it } from "vitest";
import { focusBreaks, focusGroups, muscleFocusBreak } from "../strength-focus";
import { crossSectionRepeats } from "../section-repeats";
import { focusViolation } from "../doctrine";

const calf = { name: "one leg floor calf raise", target_muscle: "calves", body_part: "lower legs" };
const legCurl = { name: "inverse leg curl (bench support)", target_muscle: "hamstrings", body_part: "upper legs" };
const lunge = { name: "walking lunge", target_muscle: "quads", body_part: "upper legs" };
const bridge = { name: "Glute Bridge", target_muscle: "Glutes", body_part: "Upper Legs" };
const sitUp = { name: "sit-up v. 2", target_muscle: "abs", body_part: "waist" };

describe("muscle match from library data (Coach Haris, 14 Oct 2026)", () => {
  it("rejects a calf raise and a hamstring curl in CORE & GLUTES, in Main and Finisher", () => {
    expect(muscleFocusBreak("CORE & GLUTES", calf, "finisher")).toMatch(/calves/);
    expect(muscleFocusBreak("CORE & GLUTES", legCurl, "main")).toMatch(/hamstrings/);
    expect(focusBreaks("CORE & GLUTES", [bridge, sitUp, bridge, sitUp], [calf]).some((v) => /calves/.test(v))).toBe(true);
    expect(focusViolation({ ...calf, equipment: "body weight" } as never, "CORE & GLUTES")).not.toBeNull();
  });
  it("accepts glute-dominant lunges and core work in CORE & GLUTES", () => {
    expect(muscleFocusBreak("CORE & GLUTES", lunge)).toBeNull();
    expect(muscleFocusBreak("CORE & GLUTES", bridge)).toBeNull();
    expect(muscleFocusBreak("CORE & GLUTES", sitUp)).toBeNull();
  });
  it("decides push / pull from the library muscle when the coach list has no entry", () => {
    expect(focusGroups({ name: "cable rear delt row", target_muscle: "delts" })).toEqual(["upper pull"]);
    expect(focusGroups({ name: "dumbbell lateral raise v. 3", target_muscle: "delts" })).toEqual(["upper push"]);
    expect(focusGroups({ name: "some press", target_muscle: "pectorals" })).toEqual(["upper push"]);
    expect(focusGroups({ name: "odd move", target_muscle: "lats" })).toEqual(["upper pull"]);
    expect(focusGroups(legCurl)).toEqual(["lower pull"]);
  });
  it("rejects lower-body muscles in an UPPER BODY workout but lets core into its Finisher", () => {
    expect(muscleFocusBreak("UPPER BODY", { name: "barbell squat", target_muscle: "quads" })).not.toBeNull();
    expect(muscleFocusBreak("UPPER BODY", { name: "Bird Dog", target_muscle: "Spine" }, "finisher")).toBeNull();
  });
});

describe("no exercise repeated across sections", () => {
  const html = (act: string, main: string, fin: string) =>
    `<h3>🔥 Activation</h3><ul><li>10 reps {{exercise:a:${act}}}</li></ul><h3>💪 Main Workout (REPS & SETS)</h3><ul><li>3 sets × 10 reps {{exercise:m:${main}}}</li></ul><h3>⚡ Finisher (REPS & SETS)</h3><ul><li>3 sets × 12 reps {{exercise:f:${fin}}}</li></ul><h3>🧘 Cool Down</h3><ul><li>45 sec {{exercise:c:${main}}}</li></ul>`;
  it("flags Bird Dog in Activation and Finisher", () => {
    const r = crossSectionRepeats(html("Bird Dog", "Glute Bridge", "Bird Dog"));
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: "Bird Dog", first: "Activation", again: "Finisher" });
  });
  it("flags a variant (inchworm / inchworm v. 2) and ignores Cool Down", () => {
    expect(crossSectionRepeats(html("inchworm", "inchworm v. 2", "sit-up"))).toHaveLength(1);
    expect(crossSectionRepeats(html("cat cow", "Glute Bridge", "sit-up"))).toHaveLength(0);
  });
});
