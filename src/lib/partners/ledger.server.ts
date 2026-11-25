import { partnerCommission } from "./commission";

/** Records the partner share of one paid Stripe invoice. Idempotent per invoice. */
export async function recordPartnerCommission(db: any, invoice: any, env: "sandbox" | "live") {
  const amount = Number(invoice?.amount_paid ?? 0);
  if (!invoice?.id || amount <= 0) return;
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? invoice.parent?.subscription_details?.subscription ?? null;
  if (!subscriptionId) return;

  let userId: string | null = invoice.parent?.subscription_details?.metadata?.userId ?? null;
  if (!userId) {
    const { data: sub } = await db.from("subscriptions").select("user_id")
      .eq("provider", "stripe").eq("environment", env).eq("provider_subscription_id", subscriptionId).maybeSingle();
    userId = sub?.user_id ?? null;
  }
  if (!userId) return;

  const { data: ref } = await db.from("partner_referrals").select("partner_id").eq("user_id", userId).maybeSingle();
  if (!ref) return;
  const { data: partner } = await db.from("partners").select("id,share_rate,vat_rate").eq("id", ref.partner_id).maybeSingle();
  if (!partner) return;

  const { netCents, commissionCents } = partnerCommission(amount, Number(partner.share_rate), Number(partner.vat_rate));
  const paidAt = invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString();
  const { error } = await db.from("partner_commissions").upsert(
    {
      partner_id: partner.id, user_id: userId, invoice_id: invoice.id, subscription_id: subscriptionId,
      kind: invoice.billing_reason === "subscription_create" ? "new" : "renewal",
      gross_cents: amount, net_cents: netCents, commission_cents: commissionCents,
      currency: invoice.currency ?? "eur", environment: env, paid_at: paidAt,
    },
    { onConflict: "invoice_id,environment", ignoreDuplicates: true },
  );
  if (error) throw new Error(`Partner commission failed: ${error.message}`);
}
