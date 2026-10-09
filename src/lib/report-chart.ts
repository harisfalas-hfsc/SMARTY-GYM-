/** Device-independent geometry shared by weekly web/PDF charts. */
export type ReportChartPoint = { label: string; value: number | null };
export const REPORT_LINE_WIDTH = 1.5;
export const REPORT_DOT_RADIUS = 2;
export const PDF_LINE_WIDTH = REPORT_LINE_WIDTH * 25.4 / 96;

export function reportChartGeometry(data: ReportChartPoint[]) {
  const max = Math.max(1, ...data.map((p) => p.value ?? 0));
  return {
    max,
    points: data.map((p, index) => ({
      ...p,
      x: data.length > 1 ? index / (data.length - 1) : 0.5,
      y: p.value === null ? null : 1 - p.value / max,
    })),
  };
}