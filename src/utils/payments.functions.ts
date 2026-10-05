import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import Stripe from "stripe";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

/**
 * Finds (or creates) the Stripe customer that carries this user's id in
 * metadata, so later reads can resolve it via Stripe's Search API.
 */
async function resolveOrCreateCustomer(
  stripe: Stripe,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/** Creates an embedded checkout session for the signed-in member. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { isFreeAccessMode } = await import("@/lib/free-access.server");
      if (await isFreeAccessMode()) {
        return {
          error: "All content is currently free for signed-in members. No purchase is required.",
        };
      }

      // Never open a second membership while one is still running or retrying a payment.
      const { data: current } = await context.supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", context.userId)
        .eq("environment", data.environment)
        .in("status", ["active", "trialing", "past_due", "paused"])
        .limit(1)
        .maybeSingle();
      if (current) {
        return {
          error:
            current.status === "past_due" || current.status === "paused"
              ? "Your membership is waiting for a payment. Use “Update card, invoices & cancel” in My account to pay it — no new membership is needed."
              : "You already have an active membership.",
        };
      }

      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");
      const isRecurring = stripePrice.type === "recurring";

      const {
        data: { user },
      } = await context.supabase.auth.getUser();

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId: context.userId,
      });

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        productDescription = (product as Stripe.Product).name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        metadata: { userId: context.userId, managed_payments: "false" },
        ...(isRecurring && {
          subscription_data: { metadata: { userId: context.userId } },
        }),
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Opens the Stripe billing portal so members can manage or cancel their plan. */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const customerId = (sub as { provider_customer_id?: string } | null)?.provider_customer_id;
    if (!customerId) return { error: "No membership found for this account." };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export type MyMembership = {
  hasBilling: boolean;
  status: string | null;
  provider: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
};

/** The signed-in member's own membership record, used by the account page. */
export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyMembership> => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select("provider,status,cancel_at_period_end,current_period_end,provider_customer_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as
      | {
          provider?: string | null;
          status?: string | null;
          cancel_at_period_end?: boolean | null;
          current_period_end?: string | null;
          provider_customer_id?: string | null;
        }
      | null;

    return {
      hasBilling: Boolean(row?.provider_customer_id && row?.provider === "stripe"),
      status: row?.status ?? null,
      provider: row?.provider ?? null,
      cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end),
      currentPeriodEnd: row?.current_period_end ?? null,
    };
  });

/**
 * Turns the automatic renewal of the member's own membership off (cancel at the
 * end of the paid period) or back on. Same behaviour as the sister app.
 */
export const setMembershipCancellation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cancel: boolean; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { isFreeAccessMode, FREE_ACCESS_BLOCK } = await import("@/lib/free-access.server");
    if (await isFreeAccessMode()) {
      throw new Response(JSON.stringify(FREE_ACCESS_BLOCK), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subId = (row as { provider_subscription_id?: string | null } | null)
      ?.provider_subscription_id;
    if (!subId) return { error: "No active membership found" };

    try {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(subId, { cancel_at_period_end: data.cancel });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
