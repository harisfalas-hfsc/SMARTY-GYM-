/** Device-independent geometry shared by weekly web/PDF charts. */
export type ReportChartPoint = { label: string; value: number | null };
export const REPORT_LINE_WIDTH = 1.5;
export const REPORT_DOT_RADIUS = 2;
export const PDF_LINE_WIDTH = REPORT_LINE_WIDTH * 25.4 / 96;

/** Resolve the page's semantic chart color for an identical PDF series. */
export function reportChartRgb(token: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Report colors could not be prepared.");
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const pixel = context.getImageData(0, 0, 1, 1).data;
  return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0];
}

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