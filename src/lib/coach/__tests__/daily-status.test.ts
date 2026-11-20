import { describe, it, expect } from "vitest";
import { dailyStatus, type DailyWorkoutRow } from "../daily-status";

const now = new Date("2026-11-20T15:00:00Z");
const dayOf = (iso: string) => iso.slice(0, 10);
const row = (p: Partial<DailyWorkoutRow>): DailyWorkoutRow => ({
  id: "w1", name: "Kinetic Pulse", status: "created", created_by: null, created_at: "2026-11-10T08:00:00Z",
  completed_at: null, scheduled_at: null, updated_at: "2026-11-10T08:00:00Z", ...p,
});
const run = (workouts: DailyWorkoutRow[], loggedTodayIds: string[] = []) =>
  dailyStatus({ today: "2026-11-20", dayOf, workouts, loggedTodayIds, now });

describe("dailyStatus", () => {
  it("nothing today → ready for Workouts of the Day", () => expect(run([]).kind).toBe("ready"));
  it("completed today wins over everything", () => {
    const s = run([
      row({ id: "a", status: "completed", completed_at: "2026-11-20T07:00:00Z" }),
      row({ id: "b", status: "scheduled", scheduled_at: "2026-11-20T18:00:00Z" }),
    ], ["c"]);
    expect(s.kind).toBe("completed");
    expect(s.workout?.id).toBe("a");
  });
  it("completed yesterday does not count as today", () =>
    expect(run([row({ status: "completed", completed_at: "2026-11-19T07:00:00Z" })]).kind).toBe("ready"));
  it("sets logged today but not completed → unfinished, started", () => {
    const s = run([row({ id: "x", created_by: "smarty:9" })], ["x"]);
    expect(s.kind).toBe("unfinished");
    expect(s.started).toBe(true);
  });
  it("Smarty Workout opened today without sets → asks whether it was done", () => {
    const s = run([row({ created_by: "smarty:9", created_at: "2026-11-20T08:14:00Z" })]);
    expect(s.kind).toBe("unfinished");
    expect(s.started).toBe(false);
  });
  it("scheduled today → scheduled", () =>
    expect(run([row({ status: "scheduled", scheduled_at: "2026-11-20T18:00:00Z" })]).kind).toBe("scheduled"));
  it("scheduled tomorrow → not today's status", () =>
    expect(run([row({ status: "scheduled", scheduled_at: "2026-11-21T18:00:00Z" })]).kind).toBe("ready"));
  it("own workout created within 2 days and not trained → custom_ready", () =>
    expect(run([row({ created_at: "2026-11-19T10:00:00Z" })]).kind).toBe("custom_ready"));
  it("own workout older than 2 days → ready", () =>
    expect(run([row({ created_at: "2026-11-15T10:00:00Z" })]).kind).toBe("ready"));
  it("Shared Workouts copy is not treated as the member's own build", () =>
    expect(run([row({ created_by: "community", created_at: "2026-11-19T10:00:00Z" })]).kind).toBe("ready"));
});
