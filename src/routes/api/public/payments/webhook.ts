import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function iso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function priceIdOf(item: any): string | null {
  return item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id ?? item?.price?.id ?? null;
}

async function upsertSubscription(subscription: any, env: StripeEnv, eventCreated?: number) {
  const item = subscription.items?.data?.[0];
  const userId = subscription.metadata?.userId;
  const supabase = await db();

  const row = {
    provider: "stripe",
    provider_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    provider_subscription_id: subscription.id,
    status: subscription.status,
    price_id: priceIdOf(item),
    product_id: typeof item?.price?.product === "string" ? item.price.product : null,
    current_period_start: iso(item?.current_period_start ?? subscription.current_period_start),
    current_period_end: iso(item?.current_period_end ?? subscription.current_period_end),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    environment: env,
    last_event_at: iso(eventCreated ?? null),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id,last_event_at")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  if (existing?.id) {
    // Ignore events older than the newest one already applied (out-of-order delivery).
    const prev = existing.last_event_at ? new Date(existing.last_event_at).getTime() : 0;
    const next = row.last_event_at ? new Date(row.last_event_at).getTime() : 0;
    if (prev && next && next < prev) return;
    await supabase.from("subscriptions").update(row).eq("id", existing.id);
    return;
  }
  if (!userId) {
    console.error("Stripe subscription without userId metadata:", subscription.id);
    return;
  }
  await supabase.from("subscriptions").insert({ ...row, user_id: userId });

  // Tell the owner about every new paying member.
  if (["active", "trialing"].includes(subscription.status)) {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email,display_name")
        .eq("id", userId)
        .maybeSingle();
      const { notifyAdmins } = await import("@/lib/admin-alert.server");
      await notifyAdmins({
        kind: "Payment",
        title: env === "live" ? "New Premium member" : "New Premium member (test payment)",
        details: `${prof?.display_name ? prof.display_name + " — " : ""}${prof?.email ?? userId} started a SmartyGym Premium membership (€9.99/month).`,
        link: "https://smartygym.com/admin",
        dedupeKey: `new-premium-${subscription.id}`,
      });
    } catch {
      /* alerts never block payments */
    }
  }
}

async function markCanceled(subscription: any, env: StripeEnv) {
  const supabase = await db();
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = (await verifyWebhook(req, env)) as { id?: string; type: string; created?: number; data: { object: any } };

  // Each Stripe event is applied once, even if Stripe delivers it again.
  if (event.id) {
    const { data: seen } = await (await db())
      .from("stripe_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (seen) return;
  }
  await applyEvent(event, env);
  // Recorded only after it was applied, so a failed event is retried by Stripe.
  if (event.id) {
    await (await db()).from("stripe_events").upsert({ id: event.id, type: event.type });
  }
}

async function applyEvent(
  event: { id?: string; type: string; created?: number; data: { object: any } },
  env: StripeEnv,
) {

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env, event.created);
      break;
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const { notifyPaymentFailure } = await import("@/lib/payment-failure.server");
      await notifyPaymentFailure({
        db: await db(),
        subscriptionId:
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id ??
              invoice.parent?.subscription_details?.subscription ??
              null,
        invoiceId: invoice.id ?? null,
        amountDue: invoice.amount_due ?? null,
        currency: invoice.currency ?? null,
        attemptCount: invoice.attempt_count ?? null,
        nextAttempt: invoice.next_payment_attempt ?? null,
        final: !invoice.next_payment_attempt,
      });
      break;
    }
    case "customer.subscription.paused":
      await upsertSubscription(event.data.object, env, event.created);
      break;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "invoice.paid":
      // Subscription state is kept current by the customer.subscription.* events.
      break;

    default:
      console.log("Unhandled payments event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Payments webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Payments webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
