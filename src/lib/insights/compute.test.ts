import { describe, expect, it } from "vitest";
import { computeWeeklyInsights, selectTips, mondayOf, type InsightWorkoutRow, type InsightsInput } from "./compute";

const w = (o: Partial<InsightWorkoutRow>): InsightWorkoutRow => ({
  id: Math.random().toString(36), name: "W", category: "STRENGTH", status: "completed", completed_at: null, scheduled_at: null,
  created_at: "2026-10-01T00:00:00Z", duration_min: 40, is_shared: false, is_wod: false, created_by: "smarty:x", community_source_id: null, deleted_at: null, ...o,
});
const base: Omit<InsightsInput, "workouts"> = {
  checkins: [], progress: null, weekStart: "2026-10-05", today: "2026-10-12",
  load: { state: "Limited Data", recent: [] }, toLocalDate: (i: string) => i.slice(0, 10),
};
const tipsFor = (o: Partial<Parameters<typeof selectTips>[0]>) =>
  selectTips({ completed: 3, maxHardRun: 0, hadRecovery: false, strengthShare: 0, mobilityMissing: false, loadHigh: false, plannedAhead: true, checkinDays: 2, createdAny: true, sharedAny: true, streak: 2, ...o }).map((t) => t.id);

describe("weekly insights — numbers", () => {
  it("counts the week, labels planned time and leaves missing progress as null (not zero)", () => {
    const workouts = ["05", "06", "07", "08"].map((d) => w({ completed_at: `2026-10-${d}T08:00:00Z` }));
    const i = computeWeeklyInsights({ ...base, workouts });
    expect(i.kpis.completed).toBe(4);
    expect(i.kpis.activeDays).toBe(4);
    expect(i.kpis.plannedMinutes).toBe(160);
    expect(i.kpis.score).toBeNull();
    expect(i.kpis.currentStreak).toBeNull();
  });
  it("only an explicit 'scheduled' status counts as not completed; deleted and other statuses are ignored", () => {
    const workouts = [
      w({ status: "scheduled", scheduled_at: "2026-10-07T08:00:00Z", name: "Leg day" }),
      w({ status: "created", scheduled_at: "2026-10-07T08:00:00Z", name: "Unknown" }),
      w({ status: "scheduled", scheduled_at: "2026-10-08T08:00:00Z", deleted_at: "x" }),
    ];
    expect(computeWeeklyInsights({ ...base, workouts }).notCompleted).toEqual([{ name: "Leg day", date: "2026-10-07" }]);
  });
  it("passes the existing Training Load state through unchanged", () => {
    const i = computeWeeklyInsights({ ...base, workouts: [], load: { state: "High", recent: [] } });
    expect(i.load.state).toBe("High");
  });
  it("is deterministic", () => {
    const workouts = [w({ completed_at: "2026-10-06T08:00:00Z" })];
    expect(computeWeeklyInsights({ ...base, workouts })).toEqual(computeWeeklyInsights({ ...base, workouts }));
  });
});

describe("weekly insights — coaching rules", () => {
  it("zero-workout week: restart first, never load/share/streak/balance tips, no division by zero", () => {
    const ids = tipsFor({ completed: 0, loadHigh: true, strengthShare: 1, mobilityMissing: true, streak: 30, sharedAny: false });
    expect(ids[0]).toBe("restart");
    for (const banned of ["load", "share", "streak", "cardio", "mobility", "recovery"]) expect(ids).not.toContain(banned);
    expect(ids.length).toBeGreaterThanOrEqual(3);
  });
  it("safety comes first and recovery suppresses the cardio tip", () => {
    const ids = tipsFor({ maxHardRun: 4, loadHigh: true, strengthShare: 1 });
    expect(ids.slice(0, 2)).toEqual(["recovery", "load"]);
    expect(ids).not.toContain("cardio");
  });
  it("thresholds: cardio above 70% with 2+ workouts, share at 5+, streak at 7+", () => {
    expect(tipsFor({ completed: 1, strengthShare: 1 })).not.toContain("cardio");
    expect(tipsFor({ completed: 2, strengthShare: 0.7 })).not.toContain("cardio");
    expect(tipsFor({ completed: 2, strengthShare: 0.75 })).toContain("cardio");
    expect(tipsFor({ completed: 4, sharedAny: false })).not.toContain("share");
    expect(tipsFor({ completed: 5, sharedAny: false })).toContain("share");
    expect(tipsFor({ streak: 6 })).not.toContain("streak");
    expect(tipsFor({ streak: 7 })).toContain("streak");
  });
  it("always 3 to 5 tips, filled in fixed order", () => {
    expect(tipsFor({})).toEqual(["explore", "ritual", "library"]);
    const many = tipsFor({ maxHardRun: 3, loadHigh: true, mobilityMissing: true, plannedAhead: false, checkinDays: 0, createdAny: false, sharedAny: false, completed: 6, streak: 9 });
    expect(many).toEqual(["recovery", "load", "mobility", "plan", "checkins"]);
  });
});

describe("weekly insights — week boundaries", () => {
  it("finds Monday by calendar date across both daylight-saving changes", () => {
    expect(mondayOf("2026-03-29")).toBe("2026-03-23"); // DST starts Sunday 29 Mar
    expect(mondayOf("2026-03-30")).toBe("2026-03-30");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19"); // DST ends Sunday 25 Oct
    expect(mondayOf("2026-10-26")).toBe("2026-10-26");
  });
});
