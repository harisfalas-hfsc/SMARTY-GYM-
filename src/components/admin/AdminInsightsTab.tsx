import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, RefreshCw, Info, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminGetInsights,
  type InsightRow,
  type InsightsReport,
} from "@/lib/insights.functions";
import { adminGetTraffic, type TrafficReport } from "@/lib/traffic.functions";

type Grain = "daily" | "monthly" | "quarterly";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "28 days", days: 28 },
  { label: "3 months", days: 90 },
  { label: "12 months", days: 365 },
  { label: "16 months", days: 486 },
];

function groupKey(date: string, grain: Grain) {
  const [y, m] = date.split("-");
  if (grain === "daily") return date;
  if (grain === "monthly") return `${y}-${m}`;
  return `${y} Q${Math.floor((Number(m) - 1) / 3) + 1}`;
}

const n = (v: number) => new Intl.NumberFormat("en-GB").format(Math.round(v));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Table({ title, rows, label }: { title: string; rows: InsightRow[]; label: string }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <p className="mb-2 font-bold">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data in this range.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">{label}</th>
                <th className="py-1 text-right">Clicks</th>
                <th className="py-1 text-right">Impr.</th>
                <th className="py-1 text-right">CTR</th>
                <th className="py-1 text-right">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t">
                  <td className="max-w-[260px] truncate py-1 pr-2" title={r.key}>
                    {r.key.replace("https://smartygym.com", "") || "/"}
                  </td>
                  <td className="py-1 text-right font-semibold">{n(r.clicks)}</td>
                  <td className="py-1 text-right">{n(r.impressions)}</td>
                  <td className="py-1 text-right">{pct(r.ctr)}</td>
                  <td className="py-1 text-right">{r.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TrafficSources({ from, to }: { from: string; to: string }) {
  const getTraffic = useServerFn(adminGetTraffic);
  const [report, setReport] = useState<TrafficReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await getTraffic({ data: { from, to } });
    if ("error" in r) setError(r.error);
    else setReport(r.report);
    setLoading(false);
  }, [getTraffic, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const peak = Math.max(1, ...(report?.bySource.map((s) => s.visits) ?? []));

  return (
    <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Globe className="h-5 w-5" />
        </span>
        <div className="mr-auto">
          <p className="font-bold">Traffic Sources</p>
          <p className="text-xs text-muted-foreground">
            Real visits recorded by smartygym.com itself — every source, not just Google.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="flex gap-1 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Counting started when this feature went live, so early ranges may show few visits. Tip:
        add ?utm_source=instagram (or tiktok, facebook…) to links you post so every click is
        attributed even when the app hides the referrer.
      </p>
      {error && (
        <p className="rounded-xl border border-destructive p-3 text-sm text-destructive">{error}</p>
      )}
      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Visits", n(report.totalVisits)],
              ["Unique visitors", n(report.uniqueVisitors)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>
          {report.bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits recorded in this range yet.</p>
          ) : (
            <div className="space-y-1">
              {report.bySource.map((s) => (
                <div key={s.source} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0">{s.label}</span>
                  <div className="h-4 flex-1 rounded bg-muted">
                    <div
                      className="h-4 rounded bg-primary"
                      style={{ width: `${(s.visits / peak) * 100}%` }}
                    />
                  </div>
                  <span className="w-32 shrink-0 text-right">
                    <b>{n(s.visits)}</b> visits · {n(s.visitors)} visitors
                  </span>
                </div>
              ))}
            </div>
          )}
          {report.topPages.length > 0 && (
            <div className="overflow-x-auto">
              <p className="mb-1 mt-2 text-sm font-bold">Most visited pages</p>
              <table className="w-full text-sm">
                <tbody>
                  {report.topPages.map((p) => (
                    <tr key={p.path} className="border-t">
                      <td className="max-w-[260px] truncate py-1 pr-2" title={p.path}>
                        {p.path}
                      </td>
                      <td className="py-1 text-right font-semibold">{n(p.visits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function AdminInsightsTab() {
  const getInsights = useServerFn(adminGetInsights);
  const [from, setFrom] = useState(daysAgo(28));
  const [to, setTo] = useState(daysAgo(1));
  const [grain, setGrain] = useState<Grain>("daily");
  const [report, setReport] = useState<InsightsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (f = from, t = to) => {
      setLoading(true);
      setError(null);
      const r = await getInsights({ data: { from: f, to: t } });
      if ("error" in r) setError(r.error);
      else setReport(r.report);
      setLoading(false);
    },
    [getInsights, from, to],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buckets = useMemo(() => {
    const map = new Map<string, { clicks: number; impressions: number }>();
    for (const d of report?.daily ?? []) {
      const k = groupKey(d.key, grain);
      const b = map.get(k) ?? { clicks: 0, impressions: 0 };
      b.clicks += d.clicks;
      b.impressions += d.impressions;
      map.set(k, b);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  }, [report, grain]);
  const peak = Math.max(1, ...buckets.map((b) => b.clicks));

  return (
    <div className="space-y-4">
      <TrafficSources from={from} to={to} />
      <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="mr-auto">
            <p className="font-bold">Insights</p>
            <p className="text-xs text-muted-foreground">
              Real numbers from Google Search Console for smartygym.com.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant="outline"
              onClick={() => {
                const f = daysAgo(p.days);
                const t = daysAgo(1);
                setFrom(f);
                setTo(t);
                void load(f, t);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs">
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-xs">
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Button size="sm" onClick={() => void load()} disabled={loading}>
            Apply range
          </Button>
        </div>
        <p className="flex gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Google publishes these numbers with a 2–3 day delay. Search Console only counts visits
          from Google (Search, Images, Videos, News, Discover). Visits from Instagram, Facebook,
          YouTube or other sites are not reported by Google Search Console.
        </p>
      </section>

      {error && (
        <p className="rounded-xl border border-destructive p-3 text-sm text-destructive">{error}</p>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Clicks", n(report.totals.clicks)],
              ["Impressions", n(report.totals.impressions)],
              ["Click rate", pct(report.totals.ctr)],
              ["Avg. position", report.totals.position.toFixed(1)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="mr-auto font-bold">Clicks over time</p>
              {(["daily", "monthly", "quarterly"] as Grain[]).map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={grain === g ? "default" : "outline"}
                  onClick={() => setGrain(g)}
                >
                  {g[0]!.toUpperCase() + g.slice(1)}
                </Button>
              ))}
            </div>
            {buckets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data in this range.</p>
            ) : (
              <div className="space-y-1">
                {buckets.map((b) => (
                  <div key={b.key} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 text-muted-foreground">{b.key}</span>
                    <div className="h-4 flex-1 rounded bg-muted">
                      <div
                        className="h-4 rounded bg-primary"
                        style={{ width: `${(b.clicks / peak) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right">
                      <b>{n(b.clicks)}</b> clicks · {n(b.impressions)} impr.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-4">
            <p className="mb-2 font-bold">Where on Google the clicks came from</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {report.searchTypes.map((s) => (
                <div key={s.type} className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{n(s.clicks)} clicks</p>
                  <p className="text-xs text-muted-foreground">{n(s.impressions)} impressions</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Top searches" rows={report.queries} label="Search term" />
            <Table title="Top pages" rows={report.pages} label="Page" />
            <Table title="Countries" rows={report.countries} label="Country" />
            <Table title="Devices" rows={report.devices} label="Device" />
          </div>
        </>
      )}
    </div>
  );
}
