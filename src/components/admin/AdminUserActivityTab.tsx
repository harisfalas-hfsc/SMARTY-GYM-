import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminGetUserActivity } from "@/lib/activity.functions";
import { addDaysISO, fmtDate, fmtDateTime, KIND_LABEL, localDate, reportCsv, type ActivityReport } from "@/lib/activity/report";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportPdf(r: ActivityReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const plain = (t: string) => t.replace(/[“”]/g, '"').replace(/[^\x20-\x7E\u00C0-\u017F\u2013\u2014€]/g, "");
  const L = 14, W = 182, BOTTOM = 283;
  let y = 18;
  const need = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = 18; } };
  doc.setTextColor(17, 147, 199).setFont("helvetica", "bold").setFontSize(10).text("SMARTYGYM — USER ACTIVITY", L, y);
  y += 8;
  doc.setTextColor(11, 18, 32).setFontSize(17).text(`User activity ${r.fromDate === r.toDate ? r.fromDate : `${r.fromDate} to ${r.toDate}`}`, L, y);
  y += 7;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(92, 104, 122).text(`${r.totals.users} members · ${r.totals.events} activities · Cyprus time`, L, y);
  y += 8;
  for (const u of r.users) {
    need(16);
    doc.setDrawColor(17, 147, 199).setLineWidth(0.8).line(L, y - 1, L, y + 8);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(11, 18, 32).text(plain(u.name), L + 3, y + 3);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(92, 104, 122)
      .text(plain(`${u.email} · ${u.access} · Joined ${fmtDate(u.joinedAt)}${u.membershipEndsAt ? ` · Membership ends ${fmtDate(u.membershipEndsAt)}` : ""}`), L + 3, y + 8);
    y += 13;
    doc.setFontSize(9.5).setTextColor(31, 41, 55);
    for (const e of u.events) {
      const lines = doc.splitTextToSize(plain(`${KIND_LABEL[e.kind]} — ${e.text}`), W - 40) as string[];
      need(lines.length * 4.5 + 1);
      doc.setTextColor(92, 104, 122).text(fmtDateTime(e.at), L + 3, y);
      doc.setTextColor(31, 41, 55).text(lines, L + 40, y);
      y += lines.length * 4.5 + 0.8;
    }
    y += 4;
  }
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p).setFontSize(8).setTextColor(150, 150, 150).text(`smartygym.com · page ${p} of ${pages}`, 105, 291, { align: "center" });
  }
  download(`smartygym-user-activity-${r.fromDate}_${r.toDate}.pdf`, doc.output("blob"));
}

export function AdminUserActivityTab() {
  const load = useServerFn(adminGetUserActivity);
  const yesterday = addDaysISO(localDate(new Date()), -1);
  const [fromDate, setFrom] = useState(yesterday);
  const [toDate, setTo] = useState(localDate(new Date()));
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await load({ data: { fromDate, toDate } });
      if ("error" in r) setError(r.error);
      else setReport(r.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load activity");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { void run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const users = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (report?.users ?? []).filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [report, q]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-blue-400 bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-semibold">From<Input type="date" value={fromDate} max={toDate} onChange={(e) => setFrom(e.target.value)} className="mt-1" /></label>
          <label className="text-sm font-semibold">To<Input type="date" value={toDate} min={fromDate} onChange={(e) => setTo(e.target.value)} className="mt-1" /></label>
          <Button onClick={run} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Show activity</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Dates and times are Cyprus time. The daily email is set up in Cron jobs.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm"><b>{report.totals.users}</b> members · <b>{report.totals.events}</b> activities</p>
            <Button variant="outline" size="sm" onClick={() => void exportPdf(report)} disabled={!report.users.length}><FileText className="mr-2 h-4 w-4" />PDF</Button>
            <Button variant="outline" size="sm" disabled={!report.users.length} onClick={() => download(`smartygym-user-activity-${report.fromDate}_${report.toDate}.csv`, new Blob([reportCsv(report)], { type: "text/csv" }))}><Download className="mr-2 h-4 w-4" />CSV</Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search member name or email" className="pl-9" />
          </div>
          {users.length === 0 && <p className="text-sm text-muted-foreground">No member activity for these dates.</p>}
          <div className="space-y-3">
            {users.map((u) => (
              <details key={u.userId} open={users.length <= 10} className="min-w-0 rounded-2xl border bg-card p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-bold">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.events.length} activit{u.events.length === 1 ? "y" : "ies"}</span>
                  </div>
                  <p className="break-words text-xs text-muted-foreground">
                    {u.email} · {u.access} · Joined {fmtDate(u.joinedAt)}{u.membershipEndsAt ? ` · Membership ends ${fmtDate(u.membershipEndsAt)}` : ""}
                  </p>
                </summary>
                <ul className="mt-3 space-y-1.5 border-l-2 border-primary pl-3">
                  {u.events.map((e, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-xs text-muted-foreground">{fmtDateTime(e.at)}</span>{" "}
                      <span className="font-semibold">{KIND_LABEL[e.kind]}</span> — <span className="break-words">{e.text}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
