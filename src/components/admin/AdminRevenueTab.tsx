import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  adminGetRevenue,
  type RevenueGranularity,
  type RevenueReport,
} from "@/lib/revenue.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/date-format";

const GRANULARITIES: { key: RevenueGranularity; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const PRESETS: { key: string; label: string; months: number }[] = [
  { key: "3m", label: "Last 3 months", months: 3 },
  { key: "12m", label: "Last 12 months", months: 12 },
  { key: "24m", label: "Last 24 months", months: 24 },
];

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function AdminRevenueTab() {
  const getRevenue = useServerFn(adminGetRevenue);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<RevenueGranularity>("monthly");
  const [from, setFrom] = useState(monthsAgoIso(12));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(
    async (next?: { from?: string; to?: string; granularity?: RevenueGranularity }) => {
      setLoading(true);
      setError(null);
      // Admin revenue always reports real (live) payments, even inside the
      // preview, which otherwise runs on test payments.
      const r = await getRevenue({
        data: {
          environment: "live",
          granularity: next?.granularity ?? granularity,
          from: new Date(`${next?.from ?? from}T00:00:00Z`).toISOString(),
          to: new Date(`${next?.to ?? to}T23:59:59Z`).toISOString(),
        },
      });
      if ("error" in r) setError(r.error);
      else setReport(r.report);
      setLoading(false);
    },
    [getRevenue, granularity, from, to],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const money = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: (report?.currency ?? "eur").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);

  const peak = Math.max(1, ...(report?.buckets.map((b) => b.amount) ?? [1]));

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="mr-auto">
            <p className="font-bold">Revenue</p>
            <p className="text-xs text-muted-foreground">
              Live subscription and payment data, read straight from the payment provider.
            </p>
          </div>
          {report && (
            <Badge variant={report.environment === "live" ? "default" : "secondary"}>
              {report.environment === "live" ? "Live payments" : "Test payments"}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {GRANULARITIES.map((g) => (
            <Button
              key={g.key}
              size="sm"
              variant={granularity === g.key ? "default" : "outline"}
              onClick={() => {
                setGranularity(g.key);
                void load({ granularity: g.key });
              }}
            >
              {g.label}
            </Button>
          ))}
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant="ghost"
              onClick={() => {
                const nextFrom = monthsAgoIso(p.months);
                const nextTo = new Date().toISOString().slice(0, 10);
                setFrom(nextFrom);
                setTo(nextTo);
                void load({ from: nextFrom, to: nextTo });
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted-foreground">
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-xs text-muted-foreground">
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Button size="sm" onClick={() => void load()} disabled={loading}>
            Apply range
          </Button>
        </div>
      </section>

      {report?.freeAccessMode && (
        <p className="rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm">
          Free Access Mode is ON, so no new checkouts can happen right now. Existing subscriptions
          below keep billing in the payment provider and are shown for your records.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-2xl border border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {loading && !report ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Monthly recurring revenue" value={money(report.mrr)} help="Active and trialing subscriptions, normalised to a month." />
            <Stat label="Paid in range" value={money(report.grossInRange)} help={`${report.paidInvoices} paid invoices between the selected dates.`} />
            <Stat label="Active subscribers" value={String(report.activeCount)} help="Subscriptions currently billing normally." />
            <Stat label="On trial" value={String(report.trialingCount)} help="Subscriptions inside a trial period." />
            <Stat label="Payment problems" value={String(report.pastDueCount)} help="Subscriptions past due or unpaid — the provider keeps retrying." />
            <Stat label="Cancelled" value={String(report.canceledCount)} help="Subscriptions that ended." />
            <Stat label="Complimentary members" value={String(report.complimentaryCount)} help="Members you gave free months to from the Members section." />
            <Stat label="Unpaid / written off" value={money(report.failedAmount)} help="Invoices still open or marked uncollectible in the range." />
          </div>

          <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
            <p className="font-bold">Income per period</p>
            {report.buckets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments in the selected range yet.</p>
            ) : (
              <div className="space-y-2">
                {report.buckets.map((b) => (
                  <div key={b.key} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{b.label}</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((b.amount / peak) * 100)}%` }}
                      />
                    </span>
                    <span className="w-28 shrink-0 text-right text-sm font-semibold">
                      {money(b.amount)}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {b.invoices} pay.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
            <p className="font-bold">Subscribers ({report.subscribers.length})</p>
            {report.subscribers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has subscribed yet.</p>
            ) : (
              <div className="space-y-2">
                {report.subscribers.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.email || s.name || s.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.plan || "membership"} · started{" "}
                        {s.started_at ? formatDate(s.started_at) : "—"} · renews{" "}
                        {s.current_period_end ? formatDate(s.current_period_end) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{money(s.amount)}/mo</span>
                      <Badge
                        variant={
                          s.status === "active" || s.status === "trialing"
                            ? "default"
                            : s.status === "past_due" || s.status === "unpaid"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {s.status.replace("_", " ")}
                      </Badge>
                      {s.cancel_at_period_end && <Badge variant="outline">cancels</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
            <p className="font-bold">Failed and unpaid payments ({report.failures.length})</p>
            {report.failures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failed payments in this range.</p>
            ) : (
              <div className="space-y-2">
                {report.failures.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{f.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(f.created_at)} · {f.status}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{money(f.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border-2 border-blue-400 bg-card p-4">
            <p className="font-bold">Recent payments</p>
            {report.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {report.recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.email}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold">{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="rounded-2xl border-2 border-blue-400 bg-card p-4" title={help}>
      <p className="text-sm font-semibold leading-tight">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{help}</p>
    </div>
  );
}
