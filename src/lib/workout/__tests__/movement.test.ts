import { describe, expect, it } from "vitest";
import { classify, replacementConfidence } from "../movement";

const bw = (name: string) => ({ name, equipment: "body weight" });

describe("movement-pattern classification and replacement confidence", () => {
  it("classifies the library by pattern", () => {
    expect(classify(bw("close-grip push-up")).primary).toBe("horizontal push");
    expect(classify(bw("pull-up")).primary).toBe("vertical pull");
    expect(classify(bw("reverse lunge")).primary).toBe("lunge");
    expect(classify({ name: "kettlebell swing", equipment: "kettlebell" }).primary).toBe("hinge");
  });
  it("only rates the same base movement as HIGH", () => {
    expect(replacementConfidence(bw("close-grip push-up"), bw("push-up"))).toBe("HIGH");
    expect(replacementConfidence(bw("close-grip push-up"), bw("bench dip (knees bent)"))).not.toBe("HIGH");
    expect(replacementConfidence(bw("push-up to side plank"), bw("lying leg raise flat bench"))).toBe("LOW");
    expect(replacementConfidence(bw("forward jump"), bw("Butt Kicks"))).not.toBe("HIGH");
  });
  it("never rates a big regression/progression jump or a strength-to-cardio swap as HIGH", () => {
    expect(replacementConfidence(bw("push-up (wall)"), bw("diamond push-up"))).not.toBe("HIGH");
    expect(replacementConfidence(bw("squat"), bw("burpee"))).toBe("LOW");
  });
});
