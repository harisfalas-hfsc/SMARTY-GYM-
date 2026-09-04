/**
 * Notifies a member when a membership payment fails (or finally gives up),
 * both in their in-app inbox and by email from SMARTYGYM.
 * Never throws — payment webhooks must always return 200.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== "number") return "";
  const value = amount / 100;
  const code = (currency ?? "eur").toUpperCase();
  const symbol = code === "EUR" ? "€" : code === "USD" ? "$" : code === "GBP" ? "£" : `${code} `;
  return `${symbol}${value.toFixed(2)}`;
}

function formatDate(seconds: number | null | undefined): string | undefined {
  if (!seconds) return undefined;
  try {
    return new Date(seconds * 1000).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return undefined;
  }
}

export async function notifyPaymentFailure(input: {
  db: SupabaseClient;
  subscriptionId: string | null;
  invoiceId: string | null;
  amountDue?: number | null;
  currency?: string | null;
  attemptCount?: number | null;
  nextAttempt?: number | null;
  final?: boolean;
}): Promise<void> {
  const db = input.db as any;
  try {
    let userId: string | null = null;
    if (input.subscriptionId) {
      const { data } = await db
        .from("subscriptions")
        .select("user_id")
        .eq("provider_subscription_id", input.subscriptionId)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }
    if (!userId) return;

    const { data: profile } = await db
      .from("profiles")
      .select("email,display_name")
      .eq("id", userId)
      .maybeSingle();

    const amount = money(input.amountDue, input.currency);
    const nextAttempt = formatDate(input.nextAttempt);
    const dedupeKey = `payment-failed:${input.invoiceId ?? input.subscriptionId}:${
      input.final ? "final" : input.attemptCount ?? 1
    }`;

    const title = input.final
      ? "Your membership has been paused"
      : "We could not take your membership payment";
    const body = input.final
      ? "Your membership payment failed after several attempts, so your membership is paused. You can restart it any time from My account."
      : `Your membership payment${amount ? ` of ${amount}` : ""} was declined.${
          nextAttempt ? ` We will try again on ${nextAttempt}.` : ""
        } Update your card in My account so the next attempt goes through.`;

    try {
      const { notifyOnce } = await import("@/lib/billing-notify.server");
      await notifyOnce(db, { userId, kind: "billing", title, body, dedupeKey });
    } catch (e) {
      console.error("[payment-failure] notification failed:", e);
    }

    const email = profile?.email as string | undefined;
    if (!email) return;

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("payment-failed", email, {
        templateData: {
          name: profile?.display_name ?? undefined,
          amount: amount || undefined,
          attempt: input.attemptCount ?? undefined,
          nextAttempt,
          manageUrl: "https://smartygym.com/account",
          final: Boolean(input.final),
        },
        idempotencyKey: dedupeKey,
      });
    } catch (e) {
      console.error("[payment-failure] email failed:", e);
    }
  } catch (e) {
    console.error("[payment-failure] failed:", e);
  }
}
