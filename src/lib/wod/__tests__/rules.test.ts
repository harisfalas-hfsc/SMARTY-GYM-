import { describe, expect, it } from "vitest";
import { PERIODIZATION_84DAY, getDayIn84Cycle, type CycleDay } from "@/lib/wod-cycle";
import { candidatesForSlot, categoriesForDay, eligibleForSlot, matchesDayFocus, slotsForDay, type WodCandidate } from "@/lib/wod/rules";

const w = (id: string, over: Partial<WodCandidate> = {}): WodCandidate => ({
  id, name: id, category: "STRENGTH", difficulty_stars: 3, location: "anywhere", focus: null,
  is_visible: true, image_url: "/x.jpg", main_workout: "<p>x</p>", ...over,
});
const day2: CycleDay = { day: 2, category: "STRENGTH", difficulty: "Advanced", stars: [5, 6], strengthFocus: "LOWER BODY" };

describe("shared Workout of the Day rules", () => {
  it("keeps the old 84-day cycle anchored on 2025-11-25", () => {
    expect(getDayIn84Cycle("2025-11-25")).toBe(1);
    expect(getDayIn84Cycle("2026-02-17")).toBe(1);
    expect(PERIODIZATION_84DAY).toHaveLength(84);
    expect(PERIODIZATION_84DAY.filter((d) => d.category === "RECOVERY")).toHaveLength(6);
  });
  it("two slots on training days, one on recovery days", () => {
    expect(slotsForDay(day2)).toEqual(["BODYWEIGHT", "EQUIPMENT"]);
    expect(slotsForDay({ day: 10, category: "RECOVERY", difficulty: null, stars: null })).toEqual(["RECOVERY"]);
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
  it("shares Strength and Muscle Building in both directions without changing categories", () => {
    const pool = [w("strength", { location: "gym" }), w("muscle", { category: "MUSCLE BUILDING", location: "gym" }), w("cardio", { category: "CARDIO", location: "gym" })];
    for (const category of ["STRENGTH", "MUSCLE BUILDING"] as const) {
      expect(categoriesForDay(category)).toEqual(["STRENGTH", "MUSCLE BUILDING"]);
      expect(eligibleForSlot(pool, { ...day2, category }, "EQUIPMENT").map((x) => x.id)).toEqual(["strength", "muscle"]);
    }
    expect(pool.map((x) => x.category)).toEqual(["STRENGTH", "MUSCLE BUILDING", "CARDIO"]);
    expect(categoriesForDay("CARDIO")).toEqual(["CARDIO"]);
  });
  it("keeps level, visibility, media and equipment restrictions in the combined pool", () => {
    const pool = [w("valid", { category: "MUSCLE BUILDING", location: "gym" }), w("level", { category: "MUSCLE BUILDING", location: "gym", difficulty_stars: 2 }), w("hidden", { category: "MUSCLE BUILDING", location: "gym", is_visible: false }), w("image", { category: "MUSCLE BUILDING", location: "gym", image_url: null }), w("main", { category: "MUSCLE BUILDING", location: "gym", main_workout: null })];
    expect(eligibleForSlot(pool, day2, "EQUIPMENT").map((x) => x.id)).toEqual(["valid"]);
    expect(eligibleForSlot(pool, day2, "BODYWEIGHT")).toEqual([]);
  });
  it.each(["LEGS", "LEGS (FRONT)", "LEGS (BACK)", "GLUTES", "CALVES"])("prefers %s on lower-body days", (focus) => {
    expect(matchesDayFocus(focus, "LOWER BODY")).toBe(true);
    expect(matchesDayFocus(focus, "UPPER BODY")).toBe(false);
  });
  it.each(["CHEST", "BACK", "SHOULDERS", "ARMS"])("prefers %s on upper-body days", (focus) => {
    expect(matchesDayFocus(focus, "UPPER BODY")).toBe(true);
    expect(matchesDayFocus(focus, "LOWER BODY")).toBe(false);
  });
  it("matches full-body and preserves mixed-focus matching without treating one muscle as full-body", () => {
    expect(matchesDayFocus("FULL BODY", "FULL BODY")).toBe(true);
    expect(matchesDayFocus("ALL BODY", "FULL BODY")).toBe(true);
    expect(matchesDayFocus("CHEST", "FULL BODY")).toBe(false);
    expect(matchesDayFocus("LOW PUSH & UPPER PULL", "LOW PUSH & UPPER PULL")).toBe(true);
    expect(matchesDayFocus("BACK", "LOW PUSH & UPPER PULL")).toBe(false);
  });
  it("rotates both categories together, preferring fresh matching muscle workouts before recycling", () => {
    const pool = [w("used", { location: "gym", focus: "LOWER BODY" }), w("fresh-upper", { location: "gym", category: "MUSCLE BUILDING", focus: "CHEST" }), w("fresh-legs", { location: "gym", category: "MUSCLE BUILDING", focus: "LEGS" })];
    expect(candidatesForSlot(pool, day2, "EQUIPMENT", new Map([["used", "2026-11-11"]]), () => 0.5).map((x) => x.id)).toEqual(["fresh-legs", "fresh-upper", "used"]);
  });
});
