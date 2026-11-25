import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListCollaborations } from "@/lib/partners/partners.functions";
import { euros } from "@/lib/partners/commission";

/** Partner shares inside Revenue: owed this month, total earned, paid and still due. */
export function PartnerRevenueCard() {
  const list = useServerFn(adminListCollaborations);
  const [t, setT] = useState<{ month: number; earned: number; paid: number; partners: number } | null>(null);
  useEffect(() => {
    void list().then(({ partners }) => setT(partners.reduce((a, p) => ({ month: a.month + p.monthCents, earned: a.earned + p.earnedCents, paid: a.paid + p.paidCents, partners: a.partners + 1 }), { month: 0, earned: 0, paid: 0, partners: 0 }))).catch(() => {});
  }, [list]);
  if (!t || t.partners === 0) return null;
  return (
    <section className="rounded-2xl border border-coach-line bg-card p-4">
      <p className="font-bold">Partner shares</p>
      <p className="text-xs text-muted-foreground">50% of net (after 19% VAT) for members who joined through a partner link. Revenue figures above are gross.</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div><p className="text-[11px] text-muted-foreground">Owed this month</p><p className="font-extrabold">{euros(t.month)}</p></div>
        <div><p className="text-[11px] text-muted-foreground">Total earned</p><p className="font-extrabold">{euros(t.earned)}</p></div>
        <div><p className="text-[11px] text-muted-foreground">Paid</p><p className="font-extrabold">{euros(t.paid)}</p></div>
        <div><p className="text-[11px] text-muted-foreground">Due now</p><p className="font-extrabold">{euros(t.earned - t.paid)}</p></div>
      </div>
    </section>
  );
}
