import { describe, expect, it } from "vitest";
import { computeWeeklyInsights, type InsightWorkoutRow } from "./compute";

const w = (o: Partial<InsightWorkoutRow>): InsightWorkoutRow => ({
  id: Math.random().toString(36), name: "W", category: "STRENGTH", status: "completed", completed_at: null, scheduled_at: null,
  created_at: "2026-10-01T00:00:00Z", duration_min: 40, is_shared: false, is_wod: false, created_by: "smarty:x", community_source_id: null, deleted_at: null, ...o,
});
const base = { results: [], checkins: [], progress: null, weekStart: "2026-10-05", today: "2026-10-12", toLocalDate: (i: string) => i.slice(0, 10) };

describe("weekly insights", () => {
  it("counts the week and suggests cardio, recovery and mobility for strength-only weeks", () => {
    const workouts = ["05", "06", "07", "08"].map((d) => w({ completed_at: `2026-10-${d}T08:00:00Z` }));
    const i = computeWeeklyInsights({ ...base, workouts });
    expect(i.kpis.completed).toBe(4);
    expect(i.kpis.activeDays).toBe(4);
    expect(i.kpis.minutes).toBe(160);
    const ids = i.tips.map((t) => t.id);
    expect(ids).toContain("recovery");
    expect(ids).toContain("cardio");
    expect(ids).toContain("mobility");
    expect(i.tips.length).toBeLessThanOrEqual(5);
  });
  it("gives a gentle restart on an empty week and is deterministic", () => {
    const workouts = [w({ completed_at: "2026-09-01T08:00:00Z" })];
    const a = computeWeeklyInsights({ ...base, workouts });
    const b = computeWeeklyInsights({ ...base, workouts });
    expect(a.tips[0]!.id).toBe("restart");
    expect(a).toEqual(b);
  });
  it("lists missed scheduled workouts and ignores deleted ones", () => {
    const workouts = [w({ status: "planned", scheduled_at: "2026-10-07T08:00:00Z", name: "Leg day" }), w({ status: "planned", scheduled_at: "2026-10-08T08:00:00Z", deleted_at: "x" })];
    const i = computeWeeklyInsights({ ...base, workouts });
    expect(i.missed).toEqual([{ name: "Leg day", date: "2026-10-07" }]);
  });
  it("suggests sharing after five workouts when nothing is shared", () => {
    const workouts = ["05", "06", "07", "08", "09"].map((d, n) => w({ completed_at: `2026-10-${d}T08:00:00Z`, category: n % 2 ? "CARDIO" : "RECOVERY" }));
    expect(computeWeeklyInsights({ ...base, workouts }).tips.map((t) => t.id)).toContain("share");
  });
});
