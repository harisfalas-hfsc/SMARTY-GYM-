import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Download,
  Droplets,
  Flame,
  Footprints,
  Lightbulb,
  Loader2,
  Moon,
  Sun,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricLineChart, MetricPicker } from "@/components/performance/MetricLineChart";
import { getCheckinState, submitCheckin } from "@/lib/checkins.functions";
import type { CheckinRow, MorningInput, NightInput } from "@/lib/checkins/score";
import { MorningCheckinForm, NightCheckinForm } from "./CheckinForms";
import { formatDate } from "@/lib/date-format";

export type CheckinState = Awaited<ReturnType<typeof getCheckinState>>;
export const CHECKINS_CHANGED = "smarty:checkins-changed";

export const SCORE_COLOR: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
};

export function useCheckinSubmit(onDone?: () => void) {
  const submit = useServerFn(submitCheckin);
  const morning = useCallback(
    async (d: MorningInput) => {
      try {
        await submit({ data: { kind: "morning", ...d } });
        toast.success("Morning check-in completed!", { description: "Nice job starting your day with intention." });
        window.dispatchEvent(new Event(CHECKINS_CHANGED));
        onDone?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save morning check-in.");
      }
    },
    [submit, onDone],
  );
  const night = useCallback(
    async (d: NightInput) => {
      try {
        await submit({ data: { kind: "night", ...d } });
        toast.success("Night check-in completed!", { description: "Great job wrapping up your day." });
        window.dispatchEvent(new Event(CHECKINS_CHANGED));
        onDone?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save night check-in.");
      }
    },
    [submit, onDone],
  );
  return { morning, night };
}

const METRICS = [
  { key: "daily_smarty_score", label: "Daily Smarty Score", color: "#3b82f6", unit: "/100" },
  { key: "sleep_score", label: "Sleep", color: "#8b5cf6", unit: "/10" },
  { key: "readiness_score_norm", label: "Readiness", color: "#22c55e", unit: "/10" },
  { key: "soreness_score", label: "Recovery (low soreness)", color: "#14b8a6", unit: "/10" },
  { key: "mood_score", label: "Mood", color: "#f59e0b", unit: "/10" },
  { key: "movement_score", label: "Movement", color: "#f97316", unit: "/10" },
  { key: "hydration_score", label: "Hydration", color: "#06b6d4", unit: "/10" },
  { key: "protein_score_norm", label: "Protein", color: "#ec4899", unit: "/10" },
  { key: "day_strain_score", label: "Day strain", color: "#ef4444", unit: "/10" },
] as const;

type Insight = { type: "success" | "warning" | "tip"; icon: typeof Lightbulb; title: string; message: string };

/** Weekly insights, ported from the old SmartyGym check-in feedback. */
function insightsFor(checkins: CheckinRow[]): Insight[] {
  const last = checkins.slice(0, 7).filter((c) => c.status === "complete");
  if (!last.length)
    return [{ type: "tip", icon: Lightbulb, title: "Getting Started", message: "Complete your first week of check-ins to receive personalized insights about your habits." }];
  const avg = (k: keyof CheckinRow) => last.reduce((s, c) => s + Number(c[k] ?? 0), 0) / last.length;
  const items: Insight[] = [];
  const d = avg("daily_smarty_score");
  if (d >= 80) items.push({ type: "success", icon: TrendingUp, title: "Strong Week!", message: "You're building solid habits. Keep this momentum going!" });
  else if (d >= 60) items.push({ type: "tip", icon: Lightbulb, title: "Good Progress", message: "Nice work this week! There's still room to improve one or two habits." });
  else items.push({ type: "warning", icon: AlertCircle, title: "Challenging Week", message: "This week was tough. Pick one area—sleep, water, or movement—and focus on improving it next week." });
  const h = avg("hydration_score");
  if (h < 6) items.push({ type: "warning", icon: Droplets, title: "Hydration Needs Work", message: "Your hydration has been low this week. Aim for at least 1.5 to 2.0 liters of water most days." });
  else if (h >= 8) items.push({ type: "success", icon: Droplets, title: "Great Hydration!", message: "Hydration looks excellent this week. Keep doing what you're doing!" });
  const m = avg("movement_score");
  if (m < 6) items.push({ type: "warning", icon: Footprints, title: "Move More", message: "You had several low-movement days. Try to avoid zero-step days by adding short walks." });
  else if (m >= 8) items.push({ type: "success", icon: Footprints, title: "Excellent Movement!", message: "Great movement levels this week. You're staying active on most days!" });
  const s = avg("sleep_score");
  if (s < 6) items.push({ type: "warning", icon: Moon, title: "Prioritize Sleep", message: "Your sleep is below the ideal range. Focus on consistent bedtimes and aim for 7-8 hours." });
  else if (s >= 8) items.push({ type: "success", icon: Moon, title: "Solid Sleep!", message: "Good job with your sleep. Consistent recovery helps performance." });
  if (avg("protein_score_norm") < 6) items.push({ type: "tip", icon: Lightbulb, title: "Protein Tip", message: "You're not hitting protein targets consistently. Add protein to each meal to support recovery." });
  return items;
}

function StatusIcon({ state }: { state: "done" | "pending" | "missed" | "upcoming" }) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />;
  if (state === "pending") return <Circle className="h-4 w-4 shrink-0 animate-pulse text-primary" />;
  if (state === "missed") return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

async function exportCheckins(kind: "pdf" | "docx", rows: CheckinRow[]) {
  const head = ["Date", "Sleep", "Quality", "Ready", "Sore", "Mood", "Steps", "Water", "Protein", "Strain", "Score"];
  const steps = ["", "0-2k", "2-5k", "5-8k", "8-10k", "10k+"];
  const body = rows.map((r) => [
    r.checkin_date,
    r.sleep_hours != null ? `${r.sleep_hours}h` : "–",
    String(r.sleep_quality ?? "–"),
    String(r.readiness_score ?? "–"),
    String(r.soreness_rating ?? "–"),
    String(r.mood_rating ?? "–"),
    r.steps_bucket ? steps[r.steps_bucket]! : "–",
    r.hydration_liters != null ? `${r.hydration_liters}L` : "–",
    String(r.protein_level ?? "–"),
    String(r.day_strain ?? "–"),
    r.daily_smarty_score != null ? String(r.daily_smarty_score) : "–",
  ]);
  const name = `smarty-checkins-${new Date().toISOString().slice(0, 10)}`;
  if (kind === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("SMARTYGYM — Smarty Check-ins", 14, 16);
    doc.setFontSize(9);
    let y = 28;
    const col = (i: number) => 14 + i * 25;
    head.forEach((h, i) => doc.text(h, col(i), y));
    y += 6;
    for (const row of body) {
      if (y > 195) {
        doc.addPage();
        y = 16;
      }
      row.forEach((c, i) => doc.text(c, col(i), y));
      y += 6;
    }
    doc.save(`${name}.pdf`);
    return;
  }
  const d = await import("docx");
  const cell = (t: string, bold = false) =>
    new d.TableCell({ children: [new d.Paragraph({ children: [new d.TextRun({ text: t, bold, size: 18 })] })] });
  const doc = new d.Document({
    sections: [
      {
        children: [
          new d.Paragraph({ children: [new d.TextRun({ text: "SMARTYGYM — Smarty Check-ins", bold: true, size: 32 })] }),
          new d.Table({
            width: { size: 100, type: d.WidthType.PERCENTAGE },
            rows: [
              new d.TableRow({ children: head.map((h) => cell(h, true)) }),
              ...body.map((r) => new d.TableRow({ children: r.map((c) => cell(c)) })),
            ],
          }),
        ],
      },
    ],
  });
  const blob = await d.Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Smarty Check-ins inside Logbook → Progress. */
export function CheckinsPanel({ todayFirst = false }: { todayFirst?: boolean }) {
  const fetchState = useServerFn(getCheckinState);
  const [state, setState] = useState<CheckinState | null>(null);
  const [error, setError] = useState<false | "premium" | "other">(false);
  const [metric, setMetric] = useState<string>("daily_smarty_score");

  const load = useCallback(() => {
    fetchState({ data: { days: 90 } })
      .then((r) => setState(r as CheckinState))
      .catch((e: unknown) =>
        setError(e instanceof Error && e.message.includes("Premium access required") ? "premium" : "other"),
      );
  }, [fetchState]);
  useEffect(() => {
    load();
    window.addEventListener(CHECKINS_CHANGED, load);
    return () => window.removeEventListener(CHECKINS_CHANGED, load);
  }, [load]);
  const { morning, night } = useCheckinSubmit();

  const chart = useMemo(() => {
    if (!state) return [];
    return [...state.checkins]
      .reverse()
      .slice(-30)
      .map((r) => ({
        label: r.checkin_date.slice(5),
        value: (r as unknown as Record<string, number | null>)[metric] ?? null,
      }));
  }, [state, metric]);
  const insights = useMemo(() => (state ? insightsFor(state.checkins) : []), [state]);

  if (error === "premium")
    return (
      <p className="text-sm text-muted-foreground">
        Premium access required. Smarty Check-ins are included with Premium.
      </p>
    );
  if (error) return <p className="text-sm text-muted-foreground">Check-ins could not be loaded right now.</p>;
  if (!state)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  const t = state.today;
  const w = state.window;
  const mins = state.minutes;
  const morningState = t?.morning_completed ? "done" : w.isMorning ? "pending" : mins < 420 ? "upcoming" : "missed";
  const nightState = t?.night_completed ? "done" : w.isNight ? "pending" : mins < 1140 ? "upcoming" : "missed";
  const metricDef = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const s = state.stats;

  return (
    // todayFirst (Smarty Check-ins page): the check-in card leads; Progress keeps stats first.
    <div className="flex flex-col gap-4">
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", todayFirst && "order-2")}>
        {[
          { icon: Flame, label: "Current streak", value: `${s.currentStreak}d` },
          { icon: Target, label: "Avg score", value: s.averageScore ?? 0 },
          { icon: TrendingUp, label: "Completion", value: `${s.completionRate}%` },
          { icon: CheckCircle2, label: "Complete days", value: s.totalComplete },
        ].map((x) => (
          <div key={x.label} className="rounded-2xl border-2 border-blue-400 bg-card p-4">
            <x.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black">{x.value}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>

      <div className={cn("rounded-2xl border-2 border-blue-400 bg-card p-4", todayFirst && "order-1")}>
        <p className="font-bold">Today's check-ins</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <Sun className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Morning Check-in</p>
              <p className="text-xs text-muted-foreground">07:00 – 10:00</p>
            </div>
            <StatusIcon state={morningState} />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <Moon className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Night Check-in</p>
              <p className="text-xs text-muted-foreground">19:00 – 22:00</p>
            </div>
            <StatusIcon state={nightState} />
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Today's Score</p>
            {t?.daily_smarty_score != null ? (
              <p className="text-2xl font-black" style={{ color: SCORE_COLOR[t.score_category ?? "green"] }}>
                {t.daily_smarty_score}
              </p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">Complete both check-ins</p>
            )}
          </div>
        </div>

        {w.isMorning && !t?.morning_completed ? (
          <div className="mt-4 rounded-xl border border-border p-4">
            <MorningCheckinForm onSubmit={morning} />
          </div>
        ) : null}
        {w.isNight && !t?.night_completed ? (
          <div className="mt-4 rounded-xl border border-border p-4">
            <NightCheckinForm onSubmit={night} />
          </div>
        ) : null}
        {w.isMorning && t?.morning_completed ? (
          <p className="mt-3 text-sm text-muted-foreground">Morning check-in done. Your night check-in opens at 19:00.</p>
        ) : null}
        {w.isNight && t?.night_completed ? (
          <p className="mt-3 text-sm text-muted-foreground">Night check-in done. Your next morning check-in opens tomorrow at 07:00.</p>
        ) : null}
        {w.next ? (
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
            <p className="font-semibold">Check-ins are closed right now.</p>
            <p className="mt-1 text-muted-foreground">
              The next {w.next === "morning" ? "morning" : "night"} check-in opens at{" "}
              {w.next === "morning" ? "07:00" : "19:00"} (in {w.timeUntil}). Morning check-ins are open
              07:00–10:00 and night check-ins 19:00–22:00.
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("rounded-2xl border-2 border-blue-400 bg-card p-4", todayFirst && "order-3")}>
        <p className="mb-3 font-bold">Trends</p>
        <MetricPicker value={metric} onChange={setMetric} options={METRICS.map((m) => ({ key: m.key, label: m.label, color: m.color }))} />
        <div className="mt-3">
          {chart.some((p) => p.value != null) ? (
            <MetricLineChart data={chart} color={metricDef.color} label={metricDef.label} unit={metricDef.unit} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Complete check-ins to see your trends.</p>
          )}
        </div>
      </div>

      <div className={cn("rounded-2xl border-2 border-blue-400 bg-card p-4", todayFirst && "order-4")}>
        <p className="flex items-center gap-2 font-bold">
          <Lightbulb className="h-5 w-5" /> Weekly Insights
        </p>
        <div className="mt-3 space-y-3">
          {insights.map((i) => (
            <div key={i.title} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                <i.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{i.title}</p>
                <p className="text-sm text-muted-foreground">{i.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("rounded-2xl border-2 border-blue-400 bg-card p-4", todayFirst && "order-5")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">History</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!state.checkins.length} onClick={() => void exportCheckins("pdf", state.checkins)}>
              <Download className="mr-1 h-4 w-4" /> PDF
            </Button>
            <Button size="sm" variant="outline" disabled={!state.checkins.length} onClick={() => void exportCheckins("docx", state.checkins)}>
              <Download className="mr-1 h-4 w-4" /> Word
            </Button>
          </div>
        </div>
        {state.checkins.length ? (
          <ul className="mt-3 divide-y divide-border">
            {state.checkins.slice(0, 14).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{formatDate(`${r.checkin_date}T12:00:00Z`)}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sun className={r.morning_completed ? "h-4 w-4 text-primary" : "h-4 w-4 opacity-30"} />
                  <Moon className={r.night_completed ? "h-4 w-4 text-primary" : "h-4 w-4 opacity-30"} />
                  {r.daily_smarty_score != null ? (
                    <span className="min-w-8 rounded-full px-2 py-0.5 text-center font-bold text-primary-foreground" style={{ background: SCORE_COLOR[r.score_category ?? "green"] }}>
                      {r.daily_smarty_score}
                    </span>
                  ) : (
                    <span className="min-w-8 text-center">–</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No check-ins yet.</p>
        )}
      </div>
    </div>
  );
}

/** One line under a selected calendar day: that day's Smarty Check-in. */
export function DayCheckinNote({ date }: { date: string }) {
  const fetchState = useServerFn(getCheckinState);
  const [rows, setRows] = useState<CheckinRow[] | null>(null);
  useEffect(() => {
    let on = true;
    fetchState({ data: { days: 365 } })
      .then((r) => on && setRows((r as CheckinState).checkins))
      .catch(() => on && setRows([]));
    return () => {
      on = false;
    };
  }, [fetchState]);
  const r = rows?.find((x) => x.checkin_date === date);
  if (!r) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-blue-400 bg-card p-4 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <Sun className={r.morning_completed ? "h-4 w-4 text-primary" : "h-4 w-4 opacity-30"} />
        <Moon className={r.night_completed ? "h-4 w-4 text-primary" : "h-4 w-4 opacity-30"} />
        Smarty Check-in
      </span>
      {r.daily_smarty_score != null ? (
        <span className="rounded-full px-2 py-0.5 font-bold text-primary-foreground" style={{ background: SCORE_COLOR[r.score_category ?? "green"] }}>
          {r.daily_smarty_score}/100
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">{r.morning_completed || r.night_completed ? "Partly completed" : "Not completed"}</span>
      )}
    </div>
  );
}
