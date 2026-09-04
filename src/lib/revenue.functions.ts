import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type Stripe from "stripe";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden: admin access required");
}

export type RevenueGranularity = "monthly" | "quarterly" | "yearly";

export type RevenueBucket = { key: string; label: string; amount: number; invoices: number };

export type RevenueSubscriber = {
  id: string;
  email: string;
  name: string;
  status: string;
  plan: string;
  amount: number;
  currency: string;
  started_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type RevenuePayment = {
  id: string;
  email: string;
  amount: number;
  currency: string;
  created_at: string;
  status: string;
  url: string | null;
};

export type RevenueReport = {
  environment: StripeEnv;
  freeAccessMode: boolean;
  currency: string;
  from: string;
  to: string;
  mrr: number;
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  canceledCount: number;
  complimentaryCount: number;
  grossInRange: number;
  paidInvoices: number;
  failedAmount: number;
  refundedAmount: number;
  buckets: RevenueBucket[];
  subscribers: RevenueSubscriber[];
  failures: RevenuePayment[];
  recentPayments: RevenuePayment[];
};

const ZERO_DECIMAL = new Set([
  "bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf",
]);
const THREE_DECIMAL = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);

function toMajor(amount: number | null | undefined, currency: string): number {
  const v = amount ?? 0;
  const c = (currency || "").toLowerCase();
  if (ZERO_DECIMAL.has(c)) return v;
  if (THREE_DECIMAL.has(c)) return v / 1000;
  return v / 100;
}

function iso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/** Normalises any recurring price into a monthly amount, for MRR. */
function monthlyAmount(price: Stripe.Price | undefined | null): number {
  if (!price?.recurring) return 0;
  const gross = toMajor(price.unit_amount, price.currency);
  const count = price.recurring.interval_count || 1;
  switch (price.recurring.interval) {
    case "day":
      return (gross / count) * 30;
    case "week":
      return (gross / count) * (52 / 12);
    case "year":
      return gross / count / 12;
    default:
      return gross / count;
  }
}

function bucketKey(date: Date, granularity: RevenueGranularity): { key: string; label: string } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  if (granularity === "yearly") return { key: `${y}`, label: `${y}` };
  if (granularity === "quarterly") {
    const q = Math.floor(m / 3) + 1;
    return { key: `${y}-Q${q}`, label: `Q${q} ${y}` };
  }
  return {
    key: `${y}-${String(m + 1).padStart(2, "0")}`,
    label: `${date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} ${y}`,
  };
}

/** Reads live subscription + invoice data straight from the payment provider. */
export const adminGetRevenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      environment: StripeEnv;
      granularity?: RevenueGranularity;
      from?: string;
      to?: string;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<{ report: RevenueReport } | { error: string }> => {
    try {
      await assertAdmin(context.userId);
      const granularity: RevenueGranularity = data.granularity ?? "monthly";

      const to = data.to ? new Date(data.to) : new Date();
      const from = data.from
        ? new Date(data.from)
        : new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), 1));
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return { error: "Invalid date range" };
      }

      const { isFreeAccessMode } = await import("@/lib/free-access.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [freeAccessMode, { count: complimentaryCount }] = await Promise.all([
        isFreeAccessMode(),
        supabaseAdmin
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("provider", "admin_grant")
          .eq("status", "active"),
      ]);

      const stripe = createStripeClient(data.environment);

      // ---- Subscriptions (all statuses) --------------------------------
      const subscriptions: Stripe.Subscription[] = [];
      let starting: string | undefined;
      for (let page = 0; page < 5; page++) {
        const list = await stripe.subscriptions.list({
          status: "all",
          limit: 100,
          expand: ["data.customer"],
          ...(starting && { starting_after: starting }),
        });
        subscriptions.push(...list.data);
        if (!list.has_more || !list.data.length) break;
        starting = list.data[list.data.length - 1]?.id;
      }

      let mrr = 0;
      let activeCount = 0;
      let trialingCount = 0;
      let pastDueCount = 0;
      let canceledCount = 0;
      let currency = "eur";

      const subscribers: RevenueSubscriber[] = subscriptions.map((sub) => {
        const item = sub.items?.data?.[0];
        const price = item?.price;
        const status = sub.status;
        if (status === "active") activeCount++;
        else if (status === "trialing") trialingCount++;
        else if (status === "past_due" || status === "unpaid") pastDueCount++;
        else if (status === "canceled" || status === "incomplete_expired") canceledCount++;
        if (status === "active" || status === "trialing") {
          mrr += monthlyAmount(price) * (item?.quantity ?? 1);
        }
        if (price?.currency) currency = price.currency;
        const customer = sub.customer as Stripe.Customer | string | null;
        const periodEnd =
          (item as { current_period_end?: number } | undefined)?.current_period_end ??
          (sub as unknown as { current_period_end?: number }).current_period_end;
        return {
          id: sub.id,
          email:
            typeof customer === "object" && customer && "email" in customer
              ? (customer.email ?? "")
              : "",
          name:
            typeof customer === "object" && customer && "name" in customer
              ? (customer.name ?? "")
              : "",
          status,
          plan: price?.lookup_key ?? price?.nickname ?? price?.id ?? "",
          amount: monthlyAmount(price) * (item?.quantity ?? 1),
          currency: price?.currency ?? currency,
          started_at: iso(sub.start_date),
          current_period_end: iso(periodEnd),
          cancel_at_period_end: Boolean(sub.cancel_at_period_end),
        };
      });

      // ---- Invoices in range -------------------------------------------
      const invoices: Stripe.Invoice[] = [];
      starting = undefined;
      for (let page = 0; page < 8; page++) {
        const list = await stripe.invoices.list({
          limit: 100,
          created: {
            gte: Math.floor(from.getTime() / 1000),
            lte: Math.floor(to.getTime() / 1000),
          },
          expand: ["data.customer"],
          ...(starting && { starting_after: starting }),
        });
        invoices.push(...list.data);
        if (!list.has_more || !list.data.length) break;
        starting = list.data[list.data.length - 1]?.id;
      }

      const bucketMap = new Map<string, RevenueBucket>();
      let grossInRange = 0;
      let paidInvoices = 0;
      let failedAmount = 0;
      let refundedAmount = 0;
      const failures: RevenuePayment[] = [];
      const recentPayments: RevenuePayment[] = [];

      for (const inv of invoices) {
        const customer = inv.customer as Stripe.Customer | string | null;
        const email =
          inv.customer_email ??
          (typeof customer === "object" && customer && "email" in customer
            ? (customer.email ?? "")
            : "");
        const created = iso(inv.created) ?? new Date().toISOString();
        const paid = toMajor(inv.amount_paid, inv.currency);
        const row: RevenuePayment = {
          id: inv.id ?? "",
          email: email || "—",
          amount: paid || toMajor(inv.amount_due, inv.currency),
          currency: inv.currency,
          created_at: created,
          status: inv.status ?? "unknown",
          url: inv.hosted_invoice_url ?? null,
        };

        if (inv.status === "paid" && paid > 0) {
          grossInRange += paid;
          paidInvoices++;
          currency = inv.currency;
          const { key, label } = bucketKey(new Date(created), granularity);
          const bucket = bucketMap.get(key) ?? { key, label, amount: 0, invoices: 0 };
          bucket.amount += paid;
          bucket.invoices += 1;
          bucketMap.set(key, bucket);
          recentPayments.push(row);
        } else if (inv.status === "open" || inv.status === "uncollectible") {
          failedAmount += toMajor(inv.amount_due, inv.currency);
          failures.push(row);
        }
        refundedAmount += toMajor(
          (inv as unknown as { amount_overpaid?: number }).amount_overpaid ?? 0,
          inv.currency,
        );
      }

      const buckets = [...bucketMap.values()].sort((a, b) => a.key.localeCompare(b.key));
      recentPayments.sort((a, b) => b.created_at.localeCompare(a.created_at));
      failures.sort((a, b) => b.created_at.localeCompare(a.created_at));
      subscribers.sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));

      return {
        report: {
          environment: data.environment,
          freeAccessMode,
          currency,
          from: from.toISOString(),
          to: to.toISOString(),
          mrr,
          activeCount,
          trialingCount,
          pastDueCount,
          canceledCount,
          complimentaryCount: complimentaryCount ?? 0,
          grossInRange,
          paidInvoices,
          failedAmount,
          refundedAmount,
          buckets,
          subscribers,
          failures: failures.slice(0, 50),
          recentPayments: recentPayments.slice(0, 50),
        },
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
