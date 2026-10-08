import { describe, expect, it } from "vitest";
import { newestSmartyWorkouts } from "../../smarty-workout-original-dates";

describe("featured workout ordering", () => {
  it("excludes daily-only imports with no original eligible date", () => {
    expect(newestSmartyWorkouts([
      { id: "daily", legacy_id: "WOD-MS-E-1789887008731", created_at: "2026-09-30" },
      { id: "pace", legacy_id: "C-054", created_at: "2026-09-30" },
    ]).map((row) => row.id)).toEqual(["pace"]);
  });
  it("uses original dates rather than import order and includes newer local creations", () => {
    const rows = [
      { id: "mixed", legacy_id: "ME-058", created_at: "2026-09-30T12:00:00Z" },
      { id: "advanced", legacy_id: "ME-059", created_at: "2026-09-30T10:00:00Z" },
      { id: "pace", legacy_id: "C-054", created_at: "2026-09-30T09:00:00Z" },
      { id: "new", legacy_id: null, created_at: "2026-10-08T00:00:00Z" },
    ];
    expect(newestSmartyWorkouts(rows).map((row) => row.id)).toEqual(["new", "pace", "advanced"]);
    expect(rows[0]?.id).toBe("mixed");
  });
  it("returns the same latest three original featured workouts", () => {
    expect(newestSmartyWorkouts([
      { id: "ME-058", legacy_id: "ME-058", created_at: "2026-09-30" },
      { id: "C-054", legacy_id: "C-054", created_at: "2026-09-30" },
      { id: "ME-059", legacy_id: "ME-059", created_at: "2026-09-30" },
    ]).map((row) => row.id)).toEqual(["C-054", "ME-059", "ME-058"]);
  });
});