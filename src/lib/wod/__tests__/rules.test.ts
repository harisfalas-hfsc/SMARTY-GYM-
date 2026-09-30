import { describe, expect, it } from "vitest";
import { PERIODIZATION_84DAY, getDayIn84Cycle } from "@/lib/wod-cycle";
import { candidatesForSlot, eligibleForSlot, slotsForDay, type WodCandidate } from "@/lib/wod/rules";

const w = (id: string, over: Partial<WodCandidate> = {}): WodCandidate => ({
  id, name: id, category: "STRENGTH", difficulty_stars: 3, location: "anywhere", focus: null,
  is_visible: true, image_url: "/x.jpg", main_workout: "<p>x</p>", ...over,
});
const day2 = PERIODIZATION_84DAY[1]!; // STRENGTH Advanced LOWER BODY

describe("shared Workout of the Day rules", () => {
  it("keeps the old 84-day cycle anchored on 2025-11-25", () => {
    expect(getDayIn84Cycle("2025-11-25")).toBe(1);
    expect(getDayIn84Cycle("2026-02-17")).toBe(1);
    expect(PERIODIZATION_84DAY).toHaveLength(84);
    expect(PERIODIZATION_84DAY.filter((d) => d.category === "RECOVERY")).toHaveLength(9);
  });
  it("two slots on training days, one on recovery days", () => {
    expect(slotsForDay(day2)).toEqual(["BODYWEIGHT", "EQUIPMENT"]);
    expect(slotsForDay(PERIODIZATION_84DAY[9]!)).toEqual(["RECOVERY"]);
  });
  it("matches category, exact level and equipment slot only", () => {
    const pool = [w("a"), w("b", { difficulty_stars: 2 }), w("c", { location: "gym" }), w("d", { category: "CARDIO" }), w("e", { is_visible: false })];
    expect(eligibleForSlot(pool, day2, "BODYWEIGHT").map((x) => x.id)).toEqual(["a"]);
    expect(eligibleForSlot(pool, day2, "EQUIPMENT").map((x) => x.id)).toEqual(["c"]);
  });
  it("never-used first with focus on top, then least recently used", () => {
    const pool = [w("used-old"), w("used-new"), w("fresh"), w("focus", { focus: "LOWER BODY" })];
    const last = new Map([["used-old", "2026-01-01"], ["used-new", "2026-05-01"]]);
    expect(candidatesForSlot(pool, day2, "BODYWEIGHT", last, () => 0.5).map((x) => x.id)).toEqual(["focus", "fresh", "used-old", "used-new"]);
  });
});
