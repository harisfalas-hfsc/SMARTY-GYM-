import type { ProgressExportData } from "@/lib/progress.functions";
import logoUrl from "@/assets/smartygym-icon-transparent.png";
import { PDF_LINE_WIDTH } from "@/lib/report-chart";

type RGB = [number, number, number];
const COLORS = {
  ink: [25, 31, 42] as RGB,
  muted: [92, 104, 122] as RGB,
  line: [218, 225, 233] as RGB,
  blue: [35, 171, 224] as RGB,
  green: [43, 178, 115] as RGB,
  amber: [240, 166, 35] as RGB,
  pink: [226, 72, 139] as RGB,
  violet: [129, 90, 213] as RGB,
  red: [224, 75, 75] as RGB,
};

async function imageDataUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error("The SMARTYGYM logo could not be loaded.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The SMARTYGYM logo could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

const niceDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const sum = (values: Array<number | null>) => values.reduce<number>((total, value) => total + (value ?? 0), 0);
const average = (values: Array<number | null>) => {
  const present = values.filter((value): value is number => value != null);
  return present.length ? Math.round((sum(present) / present.length) * 10) / 10 : null;
};

export async function exportProgressPdf(data: ProgressExportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const logo = await imageDataUrl(logoUrl);
  const W = 210;
  const H = 297;
  let page = 1;
  let y = 42;

  const footer = () => {
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.15);
    doc.line(14, H - 15, W - 14, H - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("SMARTYGYM  |  Your Gym Re-imagined. Anywhere, Anytime.", 14, H - 9);
    doc.text(`Private progress report  |  Page ${page}`, W - 14, H - 9, { align: "right" });
  };
  const header = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");
    doc.addImage(logo, "PNG", 14, 9, 18, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.ink);
    doc.text("TRAINING PROGRESS", 38, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`${data.memberName}  |  ${niceDate(data.period.from)} – ${niceDate(data.period.to)}`, 38, 23);
    doc.setDrawColor(...COLORS.blue);
    doc.setLineWidth(1.2);
    doc.line(14, 32, W - 14, 32);
    footer();
    y = 42;
  };
  const newPage = () => {
    doc.addPage();
    page += 1;
    header();
  };
  const need = (height: number) => { if (y + height > H - 22) newPage(); };
  const section = (title: string, subtitle: string, color: RGB) => {
    need(18);
    doc.setFillColor(...color);
    doc.circle(18, y + 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.ink);
    doc.text(title, 25, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(subtitle, 25, y + 10);
    y += 17;
  };
  const cards = (items: Array<{ label: string; value: string; note: string; color: RGB }>) => {
    const cols = Math.min(4, items.length);
    const gap = 4;
    const width = (182 - gap * (cols - 1)) / cols;
    const rows = Math.ceil(items.length / cols);
    need(rows * 34 + 3);
    items.forEach((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = 14 + col * (width + gap);
      const top = y + row * 34;
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, top, width, 29, 2, 2, "S");
      doc.setFillColor(...item.color);
      doc.rect(x, top, 2.2, 29, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(...item.color);
      doc.text(item.label.toUpperCase(), x + 6, top + 7);
      doc.setFontSize(15);
      doc.setTextColor(...COLORS.ink);
      doc.text(item.value, x + 6, top + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);
      doc.setTextColor(...COLORS.muted);
      doc.text(doc.splitTextToSize(item.note, width - 10).slice(0, 2), x + 6, top + 21);
    });
    y += rows * 34 + 2;
  };
  const chart = (title: string, points: Array<{ label: string; value: number }>, color: RGB, maxValue?: number) => {
    need(54);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.ink);
    doc.text(title, 14, y + 4);
    const x = 22;
    const top = y + 10;
    const width = 168;
    const height = 31;
    const max = maxValue ?? Math.max(1, ...points.map((p) => p.value));
    doc.setDrawColor(...COLORS.line);
    [0, 0.5, 1].forEach((ratio) => doc.line(x, top + height * ratio, x + width, top + height * ratio));
    if (points.length > 1) {
      doc.setDrawColor(...color);
      doc.setLineWidth(PDF_LINE_WIDTH);
      points.forEach((point, index) => {
        if (!index) return;
        const previous = points[index - 1];
        if (!previous) return;
        doc.line(x + ((index - 1) / (points.length - 1)) * width, top + height - (previous.value / max) * height, x + (index / (points.length - 1)) * width, top + height - (point.value / max) * height);
      });
      doc.setFillColor(...color);
      points.forEach((point, index) => doc.circle(x + (index / (points.length - 1)) * width, top + height - (point.value / max) * height, 0.5, "F"));
      const first = points[0];
      const last = points[points.length - 1];
      if (first && last) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(first.label, x, top + height + 6);
        doc.text(last.label, x + width, top + height + 6, { align: "right" });
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("More recorded data is needed to draw this trend.", x + width / 2, top + 17, { align: "center" });
    }
    y += 52;
  };
  const table = (headers: string[], rows: string[][], widths: number[]) => {
    const rowHeight = 7;
    const drawHead = () => {
      doc.setDrawColor(...COLORS.line);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.ink);
      let x = 14;
      headers.forEach((heading, index) => { doc.text(heading, x + 2, y + 5.2); x += widths[index] ?? 20; });
      y += 8;
    };
    need(18);
    drawHead();
    if (!rows.length) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...COLORS.muted);
      doc.text("No records in this period.", 16, y + 6); y += 12; return;
    }
    rows.forEach((row) => {
      if (y + rowHeight > H - 22) { newPage(); drawHead(); }
      doc.setDrawColor(...COLORS.line);
      doc.line(14, y + rowHeight, 196, y + rowHeight);
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...COLORS.ink);
      let x = 14;
      row.forEach((value, index) => {
        const width = widths[index] ?? 20;
        doc.text(doc.splitTextToSize(value, width - 4)[0] ?? "", x + 2, y + 4.7);
        x += width;
      });
      y += rowHeight;
    });
    y += 5;
  };

  const completed = data.workouts.filter((w) => w.status === "completed" && w.completedAt && w.completedAt.slice(0, 10) >= data.period.from && w.completedAt.slice(0, 10) <= data.period.to);
  const generated = data.workouts.filter((w) => w.createdAt.slice(0, 10) >= data.period.from && w.createdAt.slice(0, 10) <= data.period.to);
  const incomplete = generated.filter((w) => w.status !== "completed");
  const trainingDays = new Set(completed.map((w) => w.completedAt?.slice(0, 10)).filter(Boolean)).size;
  const strengthTotal = sum(data.sessions.map((s) => s.strengthLoad));
  const conditioningTotal = sum(data.sessions.map((s) => s.conditioningLoad));
  const minutes = Math.round(sum(data.sessions.map((s) => s.durationSeconds)) / 60);
  const avgRpe = average(data.sessions.map((s) => s.rpe));
  const checkinScores = data.checkins.filter((c) => typeof c["daily_smarty_score"] === "number");
  const checkinAverage = average(checkinScores.map((c) => Number(c["daily_smarty_score"])));
  const completeCheckins = data.checkins.filter((c) => c["status"] === "complete");

  header();
  section("Score & rank", "Your current all-time position and the activity recorded inside this report period.", COLORS.blue);
  cards([
    { label: "Smarty score", value: data.stats.score.toLocaleString(), note: "Current all-time progress score.", color: COLORS.blue },
    { label: "Rank", value: `#${data.rank}`, note: `Among ${data.totalRanked.toLocaleString()} ranked members.`, color: COLORS.violet },
    { label: "Current streak", value: `${data.stats.current_streak}d`, note: "Current consecutive training run.", color: COLORS.green },
    { label: "Longest streak", value: `${data.stats.longest_streak}d`, note: "Best consecutive training run.", color: COLORS.amber },
  ]);
  section("Workout analytics", "Completed, created and unfinished workouts within the selected dates.", COLORS.green);
  cards([
    { label: "Completed", value: String(completed.length), note: "Workouts completed in this period.", color: COLORS.green },
    { label: "Generated", value: String(generated.length), note: "Workouts added to your Logbook.", color: COLORS.violet },
    { label: "Not completed", value: String(incomplete.length), note: "Period workouts not marked complete.", color: COLORS.red },
    { label: "Training days", value: String(trainingDays), note: "Distinct days with a completion.", color: COLORS.amber },
  ]);
  const completionsByDay = Array.from(new Map(completed.map((w) => [w.completedAt?.slice(0, 10) ?? "", 0])).keys()).filter(Boolean).sort().map((date) => ({ label: date.slice(5), value: completed.filter((w) => w.completedAt?.startsWith(date)).length }));
  chart("Completed workouts over time", completionsByDay, COLORS.green);

  section("Training performance", "Recorded session load, effort and duration. Missing logs are never estimated.", COLORS.amber);
  cards([
    { label: "Strength load", value: strengthTotal ? `${Math.round(strengthTotal).toLocaleString()} kg` : "Not logged", note: "Total recorded weight × repetitions.", color: COLORS.blue },
    { label: "Conditioning", value: conditioningTotal ? `${Math.round(conditioningTotal).toLocaleString()}` : "Not logged", note: "Recorded conditioning work units.", color: COLORS.pink },
    { label: "Average RPE", value: avgRpe == null ? "Not logged" : `${avgRpe}/10`, note: "Average session effort you reported.", color: COLORS.red },
    { label: "Duration", value: minutes ? `${minutes} min` : "Not logged", note: "Total recorded session duration.", color: COLORS.green },
  ]);
  chart("Strength load trend", data.sessions.filter((s) => s.strengthLoad != null).map((s) => ({ label: s.performedAt.slice(5, 10), value: s.strengthLoad ?? 0 })), COLORS.blue);

  section("Smarty Check-ins", "Wellbeing analytics from completed morning and night entries in the selected period.", COLORS.pink);
  cards([
    { label: "Average score", value: checkinAverage == null ? "No score" : `${checkinAverage}/100`, note: "Average complete Daily Smarty Score.", color: COLORS.pink },
    { label: "Complete days", value: String(completeCheckins.length), note: "Both daily check-ins completed.", color: COLORS.green },
    { label: "Completion", value: data.checkins.length ? `${Math.round((completeCheckins.length / data.checkins.length) * 100)}%` : "0%", note: "Complete days among recorded entries.", color: COLORS.blue },
    { label: "Check-in streak", value: `${data.stats.checkin_longest_streak ?? 0}d`, note: "Longest all-time complete-day streak.", color: COLORS.amber },
  ]);
  chart("Daily Smarty Score trend", checkinScores.map((c) => ({ label: String(c["checkin_date"]).slice(5), value: Number(c["daily_smarty_score"]) })), COLORS.pink, 100);

  section("Awards", "Badges earned across workouts, streaks, generated workouts, check-ins and membership.", COLORS.violet);
  cards([
    { label: "Earned", value: String(data.badges.length), note: "Total badges currently unlocked.", color: COLORS.violet },
    { label: "Award points", value: data.stats.badge_points.toLocaleString(), note: "Points contributed by earned badges.", color: COLORS.amber },
  ]);
  table(["Award", "Category", "Threshold", "Points", "Earned"], data.badges.map((b) => [b.badge_name, b.category, String(b.threshold), String(b.points), niceDate(b.earned_at)]), [55, 37, 28, 25, 37]);

  section("Workout details", "Every workout created or completed within the selected period.", COLORS.blue);
  table(["Workout", "Category", "Format", "Status", "Date"], data.workouts.map((w) => [w.name, w.category, w.format ?? "—", w.status === "completed" ? "Completed" : "Not completed", niceDate(w.completedAt ?? w.createdAt)]), [64, 42, 30, 25, 21]);

  section("Check-in details", "Recorded daily measures. A dash means the measure was not recorded.", COLORS.pink);
  table(["Date", "Sleep", "Ready", "Recovery", "Mood", "Water", "Protein", "Strain", "Score"], data.checkins.map((c) => [String(c["checkin_date"]), c["sleep_hours"] == null ? "—" : `${c["sleep_hours"]}h`, String(c["readiness_score"] ?? "—"), String(c["soreness_rating"] ?? "—"), String(c["mood_rating"] ?? "—"), c["hydration_liters"] == null ? "—" : `${c["hydration_liters"]}L`, String(c["protein_level"] ?? "—"), String(c["day_strain"] ?? "—"), String(c["daily_smarty_score"] ?? "—")]), [24, 19, 19, 23, 19, 20, 20, 19, 19]);

  doc.save(`smartygym-training-progress-${data.period.from}-to-${data.period.to}.pdf`);
}