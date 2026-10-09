import { describe, expect, it } from "vitest";
import { reportChartGeometry, PDF_LINE_WIDTH, REPORT_LINE_WIDTH } from "./report-chart";

describe("shared report chart presentation", () => {
  it("keeps a zero week finite and flat", () => {
    const result = reportChartGeometry([{ label: "Mon", value: 0 }, { label: "Tue", value: 0 }]);
    expect(result.max).toBe(1);
    expect(result.points.map((p) => p.y)).toEqual([1, 1]);
  });
  it("preserves missing points and original values", () => {
    const result = reportChartGeometry([{ label: "A", value: 3 }, { label: "B", value: null }, { label: "C", value: 6 }]);
    expect(result.points.map((p) => p.y)).toEqual([0.5, null, 0]);
    expect(result.points.map((p) => p.value)).toEqual([3, null, 6]);
  });
  it("handles empty and single-point graphs and matches physical stroke width", () => {
    expect(reportChartGeometry([]).points).toEqual([]);
    expect(reportChartGeometry([{ label: "A", value: 4 }]).points[0]?.x).toBe(0.5);
    expect(PDF_LINE_WIDTH).toBeCloseTo(REPORT_LINE_WIDTH * 25.4 / 96);
  });
});