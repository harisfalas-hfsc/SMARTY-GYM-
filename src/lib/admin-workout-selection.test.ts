import { describe, expect, it } from "vitest";
import { visibilityTargets, workoutSelectionScope } from "./admin-workout-selection";

const rows = [{ id: "hidden", is_visible: false }, { id: "visible", is_visible: true }];
describe("admin workout action scope", () => {
  it("exports only the selected rituals in library order for Word, PDF and HTML", () => {
    const rituals = [{ id: "ritual-1", number: 1 }, { id: "ritual-2", number: 2 }, { id: "ritual-3", number: 3 }];
    expect(workoutSelectionScope(rituals, new Set(["ritual-3", "ritual-1"])).targets.map(row => row.number)).toEqual([1, 3]);
    expect(workoutSelectionScope(rituals, new Set()).targets.map(row => row.number)).toEqual([1, 2, 3]);
  });
  it("uses all filtered results when nothing is selected", () => {
    expect(workoutSelectionScope(rows, new Set()).targets).toEqual(rows);
  });
  it("only acts on selected matching rows, never stale selections", () => {
    expect(workoutSelectionScope(rows, new Set(["hidden", "outside"])).targets).toEqual([rows[0]]);
    expect(workoutSelectionScope(rows, new Set(["outside"])).selected).toEqual([]);
  });
  it("counts changes only and retains the publishing gate", () => {
    expect(visibilityTargets(rows, true, new Set(["hidden"]))).toEqual({ ids: [], held: 1 });
    expect(visibilityTargets(rows, false, new Set())).toEqual({ ids: ["visible"], held: 0 });
    expect(visibilityTargets([], true, new Set())).toEqual({ ids: [], held: 0 });
  });
});