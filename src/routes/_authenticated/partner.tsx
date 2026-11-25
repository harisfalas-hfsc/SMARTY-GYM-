import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getMyPartnerDashboard } from "@/lib/partners/partners.functions";
import { euros } from "@/lib/partners/commission";
import { downloadPayoutReceipt } from "@/lib/partners/receipt";

export const Route = createFileRoute("/_authenticated/partner")({
  component: PartnerPage,
  head: () => ({
    meta: [
      { title: "Partner Dashboard | SmartyGym" },
      { name: "description", content: "Private partner dashboard." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Partner Dashboard | SmartyGym" },
      { property: "og:description", content: "Private partner dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Dash = Awaited<ReturnType<typeof getMyPartnerDashboard>>;

function PartnerPage() {
  const load = useServerFn(getMyPartnerDashboard);
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => { void load().then(setD).catch(() => setD({ partner: null })); }, [load]);

  if (!d) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!d.partner || !d.commissions || !d.payouts) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">This page is only available to SmartyGym partners.</div>;
  }
  const p = d.partner;
  const commissions = d.commissions;
  const payouts = d.payouts;
  const activeCount = d.active ?? 0;
  const link = `https://smartygym.com/?ref=${p.code}`;
  const earned = commissions.reduce((s, c) => s + c.commission_cents, 0);
  const paid = payouts.reduce((s, x) => s + x.amount_cents, 0);
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const thisMonth = commissions.filter((c) => Date.parse(c.paid_at) >= monthStart.getTime());
  const perMember = Math.round((999 / (1 + p.vat_rate)) * p.share_rate);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 pb-24 pt-4">
      <PageHeader eyebrow="Partner" title={`Welcome, ${p.name.split(" ")[0]}`} subtitle="Your private partnership dashboard — only you can see these numbers." />
      <div className="rounded-2xl border border-coach-line bg-card p-4">
        <p className="text-xs text-muted-foreground">Your personal link</p>
        <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="truncate font-bold">{link}</p>
          <Button size="sm" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}><Copy className="mr-1 h-4 w-4" />Copy</Button>
        </div>
        {p.status !== "active" && <p className="mt-2 text-xs text-destructive">This link is currently {p.status}.</p>}
        {p.media_kit_url && <a href={p.media_kit_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary">Open media kit</a>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card label="Link clicks" value={String(p.click_count)} />
        <Card label="Sign-ups" value={String(d.signups)} />
        <Card label="Active subscribers" value={String(activeCount)} />
        <Card label="Monthly recurring share" value={euros(activeCount * perMember)} />
        <Card label="Earned this month" value={euros(thisMonth.reduce((s, c) => s + c.commission_cents, 0))} />
        <Card label="Balance due" value={euros(earned - paid)} />
      </div>
      <p className="text-xs text-muted-foreground">You receive {Math.round(p.share_rate * 100)}% of net revenue (€9.99 less {Math.round(p.vat_rate * 100)}% VAT) — {euros(perMember)} for every paid month, renewals included.</p>
      <section className="rounded-2xl border border-coach-line bg-card p-4">
        <h2 className="font-bold">Activity</h2>
        <div className="mt-2 max-h-72 overflow-y-auto text-sm">
          {commissions.length ? commissions.map((c) => (
            <div key={c.id} className="flex justify-between border-b border-coach-line py-1.5">
              <span>{new Date(c.paid_at).toLocaleDateString("en-GB")} — {c.kind === "new" ? "New subscriber" : "Monthly renewal"}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{euros(c.commission_cents)}</span>
            </div>
          )) : <p className="text-muted-foreground">No paid members yet. Share your link to get started.</p>}
        </div>
      </section>
      <section className="rounded-2xl border border-coach-line bg-card p-4">
        <h2 className="font-bold">Payouts · total paid {euros(paid)}</h2>
        <div className="mt-2 text-sm">
          {payouts.length ? payouts.map((x) => (
            <div key={x.id} className="flex items-center justify-between border-b border-coach-line py-1.5">
              <span>{new Date(x.paid_at).toLocaleDateString("en-GB")} · {euros(x.amount_cents)} · {x.method}</span>
              <Button size="sm" variant="ghost" onClick={() => downloadPayoutReceipt({ partnerName: p.name, partnerCode: p.code, receiptNumber: x.receipt_number, paidAt: x.paid_at, amountCents: x.amount_cents, method: x.method, reference: x.reference, periodLabel: x.period_label })}><FileDown className="mr-1 h-4 w-4" />Receipt</Button>
            </div>
          )) : <p className="text-muted-foreground">No payouts yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-coach-line bg-card p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-xl font-extrabold">{value}</p></div>;
}
