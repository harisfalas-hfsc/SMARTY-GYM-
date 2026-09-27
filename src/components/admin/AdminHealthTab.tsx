import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Circle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HEALTH_CHECKS } from "@/lib/cron/health-checks";
import {
  adminHealthCheckStep,
  adminFinishHealthAudit,
  adminListHealthRuns,
  type HealthItemDTO,
} from "@/lib/cron.functions";
import type { CronRunRow } from "@/lib/cron/jobs.server";

type StepState = "waiting" | "running" | "pass" | "warn" | "fail";

function StatusIcon({ s }: { s: StepState }) {
  if (s === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (s === "pass") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (s === "warn") return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  if (s === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

const WORD: Record<string, string> = { pass: "GOOD", warn: "WARNING", fail: "BAD" };

function ItemList({ items }: { items: HealthItemDTO[] }) {
  return (
    <ol className="space-y-2">
      {items.map((it) => (
        <li key={it.key} className="flex gap-3 rounded-md border border-border p-3">
          <StatusIcon s={it.status} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {it.number}. {it.label}
              <Badge variant={it.status === "fail" ? "destructive" : "secondary"}>{WORD[it.status]}</Badge>
            </div>
            <p className="mt-1 break-words text-xs text-muted-foreground">{it.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AdminHealthTab() {
  const step = useServerFn(adminHealthCheckStep);
  const finish = useServerFn(adminFinishHealthAudit);
  const list = useServerFn(adminListHealthRuns);
  const [states, setStates] = useState<Record<string, StepState>>({});
  const [items, setItems] = useState<HealthItemDTO[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ summary: string; emailed: boolean; recipient: string } | null>(null);
  const [runs, setRuns] = useState<CronRunRow[]>([]);
  const [openRun, setOpenRun] = useState<string | null>(null);

  async function loadRuns() {
    const r = await list();
    if ("error" in r) toast.error(r.error);
    else setRuns(r.runs);
  }
  useEffect(() => {
    void loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAll() {
    setRunning(true);
    setResult(null);
    setItems([]);
    setStates(Object.fromEntries(HEALTH_CHECKS.map((c) => [c.key, "waiting" as StepState])));
    const startedAt = new Date().toISOString();
    const done: HealthItemDTO[] = [];
    for (const c of HEALTH_CHECKS) {
      setStates((s) => ({ ...s, [c.key]: "running" }));
      let item: HealthItemDTO;
      try {
        const r = await step({ data: { key: c.key } });
        item =
          "error" in r
            ? { number: 0, key: c.key, label: c.label, status: "fail", detail: r.error }
            : (r.item ?? { number: 0, key: c.key, label: c.label, status: "fail", detail: "No result returned." });
      } catch (e) {
        item = { number: 0, key: c.key, label: c.label, status: "fail", detail: e instanceof Error ? e.message : "Check failed" };
      }
      item = { ...item, number: done.length + 1 };
      done.push(item);
      setItems([...done]);
      setStates((s) => ({ ...s, [c.key]: item.status }));
    }
    const f = await finish({ data: { startedAt, items: done } });
    setRunning(false);
    if ("error" in f) {
      toast.error(f.error);
      return;
    }
    setResult(f);
    toast.success(f.emailed ? `Report emailed to ${f.recipient}` : "Audit finished, but the email could not be sent");
    void loadRuns();
  }

  const doneCount = items.length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">Full health audit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Checks every part of SmartyGym: scheduled jobs, workout generation, Workout of the Day, payments, member
          errors, pages and features. The report is shown here and emailed to the administrator every time. The same
          audit also runs automatically every day (Cron jobs → Daily system health audit).
        </p>
        <Button className="mt-4" onClick={runAll} disabled={running}>
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking {doneCount + 1} of {HEALTH_CHECKS.length}…
            </>
          ) : (
            "Run full health check"
          )}
        </Button>
      </div>

      {Object.keys(states).length > 0 && (
        <div className="space-y-3">
          {result && (
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">{result.summary}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {result.emailed ? `Emailed to ${result.recipient}` : "Email could not be sent"}
              </p>
            </div>
          )}
          {running && (
            <ul className="space-y-1">
              {HEALTH_CHECKS.filter((c) => !items.some((i) => i.key === c.key)).map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StatusIcon s={states[c.key] ?? "waiting"} /> {c.label}
                </li>
              ))}
            </ul>
          )}
          <ItemList items={items} />
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">Past audits</h3>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audits yet.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => {
              const its = (r.details?.items ?? []) as HealthItemDTO[];
              return (
                <li key={r.id} className="rounded-md border border-border p-3">
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-center justify-between gap-2 text-left text-sm"
                    onClick={() => setOpenRun(openRun === r.id ? null : r.id)}
                  >
                    <span>
                      {new Date(r.ran_at).toLocaleString("en-GB", { timeZone: "Europe/Nicosia" })} ·{" "}
                      {r.trigger === "manual" ? "manual" : "daily"}
                    </span>
                    <Badge variant={r.status === "failed" ? "destructive" : "secondary"}>{r.summary}</Badge>
                  </button>
                  {openRun === r.id && (
                    <div className="mt-3">
                      {its.length ? (
                        <ItemList items={its} />
                      ) : (
                        <ul className="list-disc pl-5 text-xs text-muted-foreground">
                          {(r.details?.failures ?? ["All checks passed."]).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
