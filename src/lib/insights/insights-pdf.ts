import logoUrl from "@/assets/smartygym-icon-transparent.png";
import { titleCase, type WeeklyInsights } from "./compute";
import { PDF_LINE_WIDTH, reportChartGeometry, reportChartRgb, type ReportChartPoint } from "@/lib/report-chart";

type RGB = [number, number, number];
const C = {
  ink: [25, 31, 42] as RGB,
  muted: [92, 104, 122] as RGB,
  line: [218, 225, 233] as RGB,
  blue: [35, 171, 224] as RGB,
  green: [43, 178, 115] as RGB,
  amber: [240, 166, 35] as RGB,
  pink: [226, 72, 139] as RGB,
  violet: [129, 90, 213] as RGB,
  soft: [241, 245, 249] as RGB,
};
import { LOAD_TEXT } from "./presentation";
const show = (v: number | null) => (v === null ? "-" : String(v));
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// jsPDF's built-in font has no emoji/arrow glyphs; keep PDF text plain.
const plain = (t: string) => t.replace(/[^\x20-\x7E\u00C0-\u017F\u2013\u2014]/g, "").replace(/\s+/g, " ").trim();

async function imageDataUrl(src: string) {
  const blob = await (await fetch(src)).blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("The SMARTYGYM logo could not be prepared."));
    r.readAsDataURL(blob);
  });
}

/** Dedicated A4 report drawn from the shared WeeklyInsights object (same on every device). */
export async function exportInsightsPdf(i: WeeklyInsights, name?: string) {
  const activityColor = reportChartRgb("--chart-1");
  const loadColor = reportChartRgb("--chart-5");
  const { jsPDF } = await import("jspdf");
  const logo = await imageDataUrl(logoUrl);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, L = 14, R = W - 14, CW = R - L, TOP = 36, BOTTOM = H - 20;
  let page = 1;
  let y = TOP;

  const decorate = () => {
    doc.addImage(logo, "PNG", L, 7, 15, 15);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...C.ink).text("SMARTY INSIGHTS", 34, 14);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...C.muted).text(`Weekly progress report from Smarty Coach  |  ${fmt(i.weekStart)} - ${fmt(i.weekEnd)}${name ? `  |  ${plain(name)}` : ""}`, 34, 20);
    doc.setDrawColor(...C.blue).setLineWidth(1.1).line(L, 27, R, 27);
    doc.setDrawColor(...C.line).setLineWidth(0.3).line(L, H - 15, R, H - 15);
    doc.setFontSize(7.2).setTextColor(...C.muted).text("SMARTYGYM  |  Your Gym Re-imagined. Anywhere, Anytime.", L, H - 9);
    doc.text(`smartygym.com  |  Page ${page}`, R, H - 9, { align: "right" });
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      page += 1;
      decorate();
      y = TOP;
    }
  };
  const heading = (t: string, color: RGB) => {
    ensure(14);
    doc.setFillColor(...color).roundedRect(L, y, 2.2, 7, 1, 1, "F");
    doc.setFont("helvetica", "bold").setFontSize(12.5).setTextColor(...C.ink).text(t, L + 5, y + 5.4);
    y += 11;
  };
  const para = (t: string, size = 9.5, color: RGB = C.ink, indent = 0) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...color);
    const lines = doc.splitTextToSize(plain(t), CW - indent) as string[];
    for (const line of lines) {
      ensure(5);
      doc.text(line, L + indent, y + 3.5);
      y += size * 0.5;
    }
    y += 1.5;
  };
  const lineChart = (data: ReportChartPoint[], color: RGB) => {
    ensure(40);
    const x = L + 8, width = CW - 12, height = 26, top = y + 2;
    const { points, max } = reportChartGeometry(data);
    doc.setDrawColor(...C.line).setLineWidth(0.15);
    [0, 0.5, 1].forEach((ratio) => {
      doc.line(x, top + ratio * height, x + width, top + ratio * height);
      doc.setFontSize(7).setTextColor(...C.muted).text(String(Math.round(max * (1 - ratio) * 10) / 10), x - 2, top + ratio * height + 1, { align: "right" });
    });
    points.forEach((point, index) => {
      if (point.y === null) return;
      const px = x + point.x * width, py = top + point.y * height;
      const previous = points[index - 1];
      doc.setDrawColor(...color).setLineWidth(PDF_LINE_WIDTH);
      if (previous && previous.y !== null) doc.line(x + previous.x * width, top + previous.y * height, px, py);
      doc.setFillColor(...color).circle(px, py, 0.5, "F");
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...C.muted).text(point.label, px, top + height + 5, { align: "center" });
    });
    y += 39;
  };

  decorate();
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...C.ink).text(plain(i.headline.text), L, y + 6);
  y += 13;

  const k = i.kpis;
  const tiles: [string, string, RGB][] = [
    [String(k.completed), `Workouts (last week ${k.prevCompleted})`, C.blue],
    [String(k.activeDays), "Active days", C.green],
    [`${k.plannedMinutes} min`, "Planned training time", C.amber],
    [show(k.currentStreak), `Day streak (best ${show(k.longestStreak)})`, C.pink],
    [show(k.score), "Smarty Progress Score", C.violet],
    [show(k.totalCompleted), "Completed in total", C.blue],
  ];
  const tw = (CW - 8) / 3;
  tiles.forEach(([v, label, color], n) => {
    const x = L + (n % 3) * (tw + 4);
    const ty = y + Math.floor(n / 3) * 24;
    doc.setFillColor(...color.map((c) => Math.round(c + (255 - c) * 0.88)) as RGB).setDrawColor(...color).setLineWidth(0.3).roundedRect(x, ty, tw, 20, 3, 3, "FD");
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...C.ink).text(v, x + tw / 2, ty + 9, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...C.muted).text(label, x + tw / 2, ty + 15, { align: "center" });
  });
  y += 50;
  if (k.score === null) para("Progress Score and streaks show '-' because no saved progress exists yet.", 8, C.muted);

  heading("Your week", C.green);
  lineChart(i.days.map((d) => ({ label: d.label, value: d.count })), activityColor);

  heading("What you did", C.green);
  if (i.categories.length) i.categories.forEach((c) => para(`- ${titleCase(c.category)}: ${c.count}`, 9.5, C.ink, 2));
  else para("No completed workouts this week.", 9.5, C.muted);

  heading("What you didn't do", C.amber);
  if (!i.notCompleted.length && !i.untrained.length) para("Nothing outstanding this week.", 9.5, C.muted);
  i.notCompleted.forEach((m) => para(`- Scheduled, not completed: ${m.name} (${fmt(m.date)})`, 9.5, C.ink, 2));
  i.untrained.forEach((c) => para(`- No ${titleCase(c)} in the last 14 days`, 9.5, C.ink, 2));

  heading("Training Load", C.violet);
  para(`${i.load.state}: ${LOAD_TEXT[i.load.state] ?? ""}`);
  lineChart(i.load.recent.map((r) => ({ label: fmt(r.weekStart), value: r.sessions })), loadColor);
  para("Logged sessions per week (last point = this report).", 7.5, C.muted);

  heading("Check-ins", C.blue);
  para(i.checkins.days ? `${i.checkins.days} check-in day(s)${i.checkins.avgScore !== null ? `, average Smarty Score ${i.checkins.avgScore}` : ""}.` : "No check-ins this week.");

  heading("Coming up", C.blue);
  if (i.upcoming.length) i.upcoming.forEach((u) => para(`- ${fmt(u.date)}: ${u.name}`, 9.5, C.ink, 2));
  else para("Nothing scheduled in the next 7 days.", 9.5, C.muted);

  heading("Readiness", C.pink);
  if (i.readiness?.average !== null && i.readiness?.average !== undefined) {
    para(`${i.readiness.average}/10 weekly average from ${i.readiness.checkinDays} morning Check-in day(s).${i.readiness.latest !== null && i.readiness.latestDate ? ` Latest: ${i.readiness.latest}/10 on ${fmt(i.readiness.latestDate)}.` : ""}`);
  } else {
    para("Not enough morning Check-in data for a weekly readiness average.", 9.5, C.muted);
  }
  para(`Training Load: ${i.readiness?.loadState ?? i.load.state}.`, 8, C.muted);

  heading("Smarty Coach suggestions", C.blue);
  for (const t of i.tips) {
    doc.setFont("helvetica", "normal").setFontSize(9);
    const lines = doc.splitTextToSize(plain(t.body), CW - 10) as string[];
    const h = 12 + lines.length * 4.3;
    ensure(h + 3);
    doc.setFillColor(...C.soft).roundedRect(L, y, CW, h, 2, 2, "F");
    doc.setFillColor(...C.blue).rect(L, y, 1.4, h, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...C.ink).text(plain(t.title), L + 5, y + 5.5);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...C.muted).text(lines, L + 5, y + 10.5);
    doc.setFont("helvetica", "bold").setTextColor(...C.blue).textWithLink(`${plain(t.label)}  >`, L + 5, y + h - 2.5, { url: `https://smartygym.com${t.href}` });
    y += h + 3;
  }

  doc.save(`smartygym-insights-${i.weekStart}.pdf`);
}
