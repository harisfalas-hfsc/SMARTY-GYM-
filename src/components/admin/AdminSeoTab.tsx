import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, RefreshCw, Send, XCircle, AlertTriangle, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminSeoOverview,
  adminSeoPushAll,
  adminSeoHealth,
  adminSeoSitemapStatus,
  adminSeoResubmitSitemaps,
} from "@/lib/seo/admin-seo.functions";

type Overview = Awaited<ReturnType<typeof adminSeoOverview>>;
type Push = Awaited<ReturnType<typeof adminSeoPushAll>>;
type Health = Awaited<ReturnType<typeof adminSeoHealth>>;
type Sitemaps = Awaited<ReturnType<typeof adminSeoSitemapStatus>>;

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/Athens", dateStyle: "medium", timeStyle: "short" }) : "—";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border-2 border-blue-400 bg-card p-4">
      <h2 className="text-base font-extrabold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function PushSummary({ r }: { r: Push }) {
  return (
    <div className={`rounded-xl border p-3 ${r.ok ? "border-primary" : "border-destructive"}`}>
      <div className="flex items-center gap-2 font-bold">
        {r.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
        {r.total === 0
          ? "Nothing new to send — every public page was already sent."
          : `${r.submitted} of ${r.total} pages accepted by search engines`}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {fmt(r.at)} · {r.mode === "all" ? "All pages" : "New pages only"}
        {r.batches.length ? ` · ${r.batches.map((b) => b.detail).join(", ")}` : ""}
      </div>
    </div>
  );
}

export function AdminSeoTab() {
  const overviewFn = useServerFn(adminSeoOverview);
  const pushFn = useServerFn(adminSeoPushAll);
  const healthFn = useServerFn(adminSeoHealth);
  const sitemapFn = useServerFn(adminSeoSitemapStatus);
  const resubmitFn = useServerFn(adminSeoResubmitSitemaps);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [push, setPush] = useState<Push | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [sitemaps, setSitemaps] = useState<Sitemaps | null>(null);
  const [resubmit, setResubmit] = useState<{ name: string; ok: boolean; detail: string }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const loadOverview = useCallback(() => run("overview", async () => setOverview(await overviewFn())), [run, overviewFn]);
  const loadSitemaps = useCallback(() => run("sitemaps", async () => setSitemaps(await sitemapFn())), [run, sitemapFn]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const last = push ?? overview?.lastPush ?? null;

  return (
    <div className="min-w-0 space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive p-3 text-sm text-destructive">{error}</div>
      )}

      <Card title="Search engine notification (IndexNow)">
        <p className="text-muted-foreground">
          Tells Bing, Yandex, Seznam, Naver and other IndexNow search engines about every public page,
          including every exercise guide, in one click. Google does not use IndexNow — use the Google
          sitemaps card below for Google.
        </p>
        {overview ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Public pages" value={overview.totalUrls} />
            <Stat label="Exercise guides" value={overview.exercises} />
            <Stat label="Already sent" value={overview.sentCount} />
            <Stat
              label="Ownership key"
              value={overview.keyFileOk ? <span className="text-primary">Live</span> : <span className="text-destructive">Missing</span>}
            />
          </div>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!!busy}
            onClick={() =>
              run("push", async () => {
                setPush(await pushFn({ data: {} }));
                setOverview(await overviewFn());
              })
            }
          >
            {busy === "push" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send all pages now
          </Button>
          <Button
            variant="outline"
            disabled={!!busy}
            onClick={() =>
              run("pushNew", async () => {
                setPush(await pushFn({ data: { onlyNew: true } }));
                setOverview(await overviewFn());
              })
            }
          >
            {busy === "pushNew" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send new pages only
          </Button>
        </div>
        {last ? <PushSummary r={last} /> : <p className="text-xs text-muted-foreground">No push sent yet.</p>}
        <p className="text-xs text-muted-foreground">
          Automatic: every weekly SEO update also sends any new public page (for example a new exercise)
          that was never sent before. Search engines decide when and whether to index.
        </p>
      </Card>

      <Card title="Google sitemaps">
        <p className="text-muted-foreground">Live status from Google Search Console for your four sitemaps.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!!busy} onClick={loadSitemaps}>
            {busy === "sitemaps" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Check Google status
          </Button>
          <Button
            variant="outline"
            disabled={!!busy}
            onClick={() =>
              run("resubmit", async () => {
                setResubmit(await resubmitFn());
                setSitemaps(await sitemapFn());
              })
            }
          >
            {busy === "resubmit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Re-submit sitemaps to Google
          </Button>
        </div>
        {resubmit && (
          <ul className="space-y-1 text-xs">
            {resubmit.map((r) => (
              <li key={r.name} className={r.ok ? "text-primary" : "text-destructive"}>
                {r.name}: {r.detail}
              </li>
            ))}
          </ul>
        )}
        {sitemaps && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1">Sitemap</th><th>Addresses</th><th>Last read by Google</th><th>Errors</th><th>Warnings</th></tr>
              </thead>
              <tbody>
                {sitemaps.map((s) => (
                  <tr key={s.name} className="border-t">
                    <td className="py-1 font-bold">{s.name}</td>
                    {s.error ? (
                      <td colSpan={4} className="text-destructive">{s.error}</td>
                    ) : (
                      <>
                        <td>{s.submitted}</td>
                        <td>{fmt(s.lastDownloaded)}</td>
                        <td>{s.errors}</td>
                        <td>{s.warnings}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="SEO health check">
        <p className="text-muted-foreground">
          Runs the same checks as the weekly SEO report right now. Read-only — nothing on the site changes.
        </p>
        <Button variant="outline" disabled={!!busy} onClick={() => run("health", async () => setHealth(await healthFn()))}>
          {busy === "health" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Run health check now
        </Button>
        {health && (
          <ul className="space-y-2">
            {health.map((h) => (
              <li key={h.key} className="flex gap-2">
                {h.status === "pass" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : h.status === "warn" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0">
                  <div className="font-bold">{h.label}</div>
                  <div className="break-words text-xs text-muted-foreground">{h.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
