import { describe, expect, it } from "vitest";
import { workoutShareTarget, workoutShareUrl } from "../social-share";

const original = "11111111-1111-4111-8111-111111111111";
const copy = "22222222-2222-4222-8222-222222222222";
describe("workout social sharing", () => {
  it("does not share private user workouts", () => {
    expect(workoutShareTarget({ id: copy, created_by: "coach" })).toBeNull();
    expect(workoutShareTarget({ id: copy, created_by: "manual", is_shared: false })).toBeNull();
  });
  it("shares the public Smarty original, never the logbook copy", () => {
    const target = workoutShareTarget({ id: copy, created_by: `smarty:${original}` });
    expect(target).toEqual({ kind: "smarty", id: original });
    if (target) expect(workoutShareUrl(target)).toBe(`https://smartygym.com/smarty-workouts/${original}`);
  });
  it("shares community originals and maps copies back to the creator's original", () => {
    expect(workoutShareTarget({ id: original, created_by: "manual", is_shared: true })).toEqual({ kind: "community", id: original });
    const target = workoutShareTarget({ id: copy, created_by: "community", community_source_id: original });
    expect(target).toEqual({ kind: "community", id: original });
    if (target) expect(workoutShareUrl(target)).toContain(`/community/workout/${original}`);
  });
  it("rejects deleted workouts and malformed source IDs", () => {
    expect(workoutShareTarget({ id: original, created_by: "manual", is_shared: true, deleted_at: "2026-10-13" })).toBeNull();
    expect(workoutShareTarget({ id: copy, created_by: "smarty:private" })).toBeNull();
    expect(workoutShareTarget({ id: copy, created_by: "community", community_source_id: "bad" })).toBeNull();
  });
});