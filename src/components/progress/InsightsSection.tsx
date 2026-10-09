import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Brain, CalendarDays, Gauge, ListChecks, CircleSlash, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMyInsights } from "@/lib/weekly-insights.functions";
import { titleCase, type WeeklyInsights } from "@/lib/insights/compute";
import { cn } from "@/lib/utils";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function Delta({ now, prev }: { now: number; prev: number }) {
  if (now === prev) return <span className="text-xs text-muted-foreground">= last week</span>;
  const up = now > prev;
  return (
    <span className={cn("text-xs font-bold", up ? "text-emerald-500" : "text-amber-500")}>
      {up ? "↑" : "↓"} {Math.abs(now - prev)} vs last week
    </span>
  );
}

function Card({ title, icon: Icon, children, tone = "text-primary", block = false }: { title: string; icon: typeof Brain; children: React.ReactNode; tone?: string; block?: boolean }) {
  return (
    <section data-pdf-block={block ? "" : undefined} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-base font-black">
        <Icon className={cn("h-5 w-5", tone)} /> {title}
      </h3>
      {children}
    </section>
  );
}

/** Logbook → Progress → Insights: the same weekly report members receive on Monday. */
export function InsightsSection() {
  const fetchInsights = useServerFn(getMyInsights);
  const [week, setWeek] = useState<"current" | "previous">("current");
  const [data, setData] = useState<WeeklyInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    fetchInsights({ data: { week } })
      .then((r) => active && setData(r))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Insights could not be loaded."));
    return () => {
      active = false;
    };
  }, [fetchInsights, week]);

  const download = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const { exportBrandPagePdf } = await import("@/lib/brand-page-export");
      await exportBrandPagePdf("insights", ref.current);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The PDF could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const k = data?.kpis;
  const maxDay = Math.max(1, ...(data?.days.map((d) => d.count) ?? [1]));
  const maxLoad = Math.max(1, ...(data?.load.recent.map((r) => r.load) ?? [1]));
  const tiles = k
    ? [
        { emoji: "🏋️", value: k.completed, label: "Workouts", extra: <Delta now={k.completed} prev={k.prevCompleted} />, tone: "border-sky-400/50 bg-sky-400/10" },
        { emoji: "📅", value: k.activeDays, label: "Active days", tone: "border-emerald-400/50 bg-emerald-400/10" },
        { emoji: "⏱️", value: `${k.minutes} min`, label: "Training time", extra: <Delta now={k.minutes} prev={k.prevMinutes} />, tone: "border-amber-400/50 bg-amber-400/10" },
        { emoji: "🔥", value: k.currentStreak, label: `Day streak · best ${k.longestStreak}`, tone: "border-rose-400/50 bg-rose-400/10" },
        { emoji: "⭐", value: k.score, label: "Progress Score", tone: "border-violet-400/50 bg-violet-400/10" },
        { emoji: "✅", value: k.totalCompleted, label: "Completed in total", tone: "border-cyan-400/50 bg-cyan-400/10" },
      ]
    : [];

  return (
    <div id="insights" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black">Insights</h2>
          <p className="text-sm text-muted-foreground">Your weekly snapshot and suggestions from Smarty Coach.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-border p-1">
            {(["current", "previous"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeek(w)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-bold", week === w ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {w === "current" ? "This week" : "Last week"}
              </button>
            ))}
          </div>
          <Button type="button" size="sm" className="gap-2" onClick={() => void download()} disabled={!data || exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Preparing PDF" : "Download PDF"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">{error}</p>
      ) : !data ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div ref={ref} className="space-y-4">
          <section data-pdf-block className="rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Week {fmt(data.weekStart)} – {fmt(data.weekEnd)}</p>
            <p className="mt-1 text-2xl font-black">{data.headline.emoji} {data.headline.text}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiles.map((t) => (
                <div key={t.label} className={cn("rounded-xl border p-3 text-center", t.tone)}>
                  <div className="text-xl">{t.emoji}</div>
                  <div className="text-xl font-black">{t.value}</div>
                  <div className="text-xs text-muted-foreground">{t.label}</div>
                  {t.extra ? <div className="mt-0.5">{t.extra}</div> : null}
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4">
          <div data-pdf-block className="grid gap-4 lg:grid-cols-2">
            <Card title="What you did" icon={ListChecks} tone="text-emerald-500">
              <div className="flex h-28 items-end justify-between gap-1.5">
                {data.days.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{d.count || ""}</span>
                    <div className={cn("w-full max-w-8 rounded-md", d.count ? "bg-primary" : "bg-muted")} style={{ height: d.count ? `${(d.count / maxDay) * 70 + 10}px` : "6px" }} />
                    <span className="text-[11px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
              {data.categories.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {data.categories.map((c) => (
                    <li key={c.category} className="rounded-full border border-border px-3 py-1 text-xs font-semibold">{titleCase(c.category)} · {c.count}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No completed workouts in this week yet.</p>
              )}
              <Link to="/logbook" search={{ filter: "completed", view: "list" as const }} className="mt-3 inline-block text-sm font-bold text-primary">View my workouts →</Link>
            </Card>

            <Card title="What you didn't do" icon={CircleSlash} tone="text-amber-500">
              {data.missed.length || data.untrained.length ? (
                <ul className="space-y-1.5 text-sm">
                  {data.missed.map((m) => <li key={m.name + m.date}>⏳ Missed: <strong>{m.name}</strong> ({fmt(m.date)})</li>)}
                  {data.untrained.map((c) => <li key={c}>🕳️ No {titleCase(c)} in the last 14 days</li>)}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">🎉 Nothing missed — great consistency.</p>
              )}
              <Link to="/logbook" search={{ filter: "all", view: "calendar" as const }} className="mt-3 inline-block text-sm font-bold text-primary">Open Calendar →</Link>
            </Card>

          </div>
          <div data-pdf-block className="grid gap-4 lg:grid-cols-2">
            <Card title="Training Load" icon={Gauge} tone="text-violet-500">
              <div className="flex h-24 items-end gap-2">
                {data.load.recent.map((r, idx) => (
                  <div key={r.weekStart} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{r.load || ""}</span>
                    <div className={cn("w-full max-w-10 rounded-md", idx === 4 ? "bg-violet-500" : "bg-violet-500/35")} style={{ height: `${Math.max(4, (r.load / maxLoad) * 64)}px` }} />
                    <span className="text-[10px] text-muted-foreground">{fmt(r.weekStart)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm">
                {data.load.trend === "none"
                  ? "No measured training load yet."
                  : `This week ${data.load.week} · 4-week average ${data.load.average} · ${data.load.trend === "up" ? "📈 rising" : data.load.trend === "down" ? "📉 lighter" : "➡️ steady"}`}
              </p>
              <Link to="/training-load-science" className="mt-2 inline-block text-sm font-bold text-primary">How Training Load works →</Link>
            </Card>

            <Card title="Check-ins & coming up" icon={CalendarDays} tone="text-sky-500">
              <p className="text-sm">📝 {data.checkins.days} check-in day{data.checkins.days === 1 ? "" : "s"}{data.checkins.avgScore !== null ? ` · average Smarty Score ${data.checkins.avgScore}` : ""}</p>
              {data.upcoming.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.upcoming.map((u) => <li key={u.name + u.date}>🗓️ {fmt(u.date)}: <strong>{u.name}</strong></li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled in the next 7 days.</p>
              )}
              <Link to="/smarty-checkins" className="mt-3 inline-block text-sm font-bold text-primary">Smarty Check-ins →</Link>
            </Card>
          </div>
          </div>

          <Card title="Smarty Coach suggestions" icon={Brain} block>
            <div className="grid gap-3 md:grid-cols-2">
              {data.tips.map((t) => (
                <div key={t.id} className="rounded-xl border border-border border-l-4 border-l-primary p-3">
                  <p className="font-bold">{t.emoji} {t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  <a href={t.href} className="mt-2 inline-block text-sm font-bold text-primary">{t.label} →</a>
                </div>
              ))}
            </div>
          </Card>
          <p data-pdf-exclude className="flex items-center gap-1.5 text-xs text-muted-foreground"><ClipboardCheck className="h-3.5 w-3.5" /> This report is also sent to your inbox and email every Monday morning.</p>
        </div>
      )}
    </div>
  );
}
