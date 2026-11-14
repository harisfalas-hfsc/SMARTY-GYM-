import { describe, expect, it } from "vitest";
import { iconInk, toneIndex } from "@/lib/icon-tone";

describe("permanent icon identity colours", () => {
  it("same feature gets the same colour under any wording", () => {
    expect(toneIndex("Smarty Tools")).toBe(toneIndex("tools"));
    expect(toneIndex("Exercise Library")).toBe(toneIndex("library"));
    expect(toneIndex("Blog & Insights")).toBe(toneIndex("Coaching Articles"));
    expect(toneIndex("Create Your Own Workout")).toBe(toneIndex("Build My Workout"));
    expect(toneIndex("MOBILITY & STABILITY")).toBe(toneIndex("Mobility & Stability"));
  });
  it("the nine categories each have a distinct colour", () => {
    const cats = ["STRENGTH","MUSCLE BUILDING","CALORIE BURNING","CARDIO","METABOLIC","CHALLENGE","MOBILITY & STABILITY","PILATES","RECOVERY"];
    expect(new Set(cats.map(toneIndex)).size).toBe(9);
  });
  it("homepage quick links differ from each other", () => {
    const q = ["Smarty Ritual","Smarty Tools","Exercise Library","Blog & Insights"].map(iconInk);
    expect(new Set(q).size).toBe(4);
  });
});
