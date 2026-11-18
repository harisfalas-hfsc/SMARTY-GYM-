import { describe, expect, it } from "vitest";
import { activityEvents, eventsByDay } from "../activity";

const empty = { workouts: [], checkins: [], comments: [], reactions: [], ratings: [] };
describe("member activity", () => {
  it("records every kind of action", () => {
    const e = activityEvents({ ...empty,
      workouts: [{ name: "A", created_by: "Haris", created_at: "2026-11-16T09:00:00Z", completed_at: "2026-11-16T10:00:00Z", status: "completed", shared_at: "2026-11-16T11:00:00Z", favorited_at: "2026-11-16T12:00:00Z" }],
      checkins: [{ morning_completed_at: "2026-11-16T07:00:00Z", night_completed_at: null }],
      comments: [{ created_at: "2026-11-16T13:00:00Z" }], reactions: [{ created_at: "2026-11-16T14:00:00Z" }], ratings: [{ created_at: "2026-11-16T15:00:00Z" }] });
    expect(e.map(x => x.kind).sort()).toEqual(["checkin", "comment", "completed", "created", "favorited", "rating", "reaction", "shared"]);
  });
  it("a Smarty workout added counts as added, not created; incomplete gives no completion", () => {
    const e = activityEvents({ ...empty, workouts: [{ name: "B", created_by: "smarty:x", created_at: "2026-11-16T09:00:00Z", completed_at: null, status: "scheduled", shared_at: null, favorited_at: null }] });
    expect(e.map(x => x.kind)).toEqual(["added"]);
  });
  it("a day with no rows has no activity", () => {
    expect(eventsByDay(activityEvents(empty)).size).toBe(0);
  });
});
