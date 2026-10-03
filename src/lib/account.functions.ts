import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in athlete's account and all their data.
 * Cascading foreign keys on auth.users remove workouts, profile, notifications, etc.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { confirm: string }) => {
    if (data.confirm !== "DELETE") throw new Error("Type DELETE to confirm");
    return data;
  })
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims?.email as string | undefined) ?? context.userId;

    // Stop any live recurring payment first, so a deleted member is never charged again.
    // If any cancellation fails, nothing is deleted.
    const BLOCKED =
      "We couldn't cancel your membership payment, so your account was not deleted. Please try again or contact us.";
    let cancelFailed = false;
    try {
      const { data: subs } = await (supabaseAdmin as any)
        .from("subscriptions")
        .select("provider,provider_subscription_id,status,environment")
        .eq("user_id", context.userId);
      const live = ((subs ?? []) as Array<{
        provider?: string;
        provider_subscription_id?: string;
        status?: string;
        environment?: string;
      }>).filter(
        (s) =>
          s.provider === "stripe" &&
          s.provider_subscription_id &&
          !["canceled", "incomplete_expired"].includes(s.status ?? ""),
      );
      if (live.length) {
        const { createStripeClient } = await import("@/lib/stripe.server");
        for (const sub of live) {
          try {
            const stripe = createStripeClient(sub.environment === "live" ? "live" : "sandbox");
            await stripe.subscriptions.cancel(sub.provider_subscription_id!);
          } catch (e) {
            const code = (e as { code?: string; raw?: { code?: string } })?.raw?.code ?? (e as { code?: string })?.code;
            // Already gone at Stripe = nothing left to charge.
            if (code !== "resource_missing") {
              cancelFailed = true;
              console.error("[delete-account] could not cancel subscription:", e);
            }
          }
        }
      }
    } catch (e) {
      console.error("[delete-account] subscription lookup failed:", e);
      cancelFailed = true;
    }
    if (cancelFailed) return { error: BLOCKED };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) return { error: error.message };


    try {
      const { notifyAdmins } = await import("@/lib/admin-alert.server");
      await notifyAdmins({
        kind: "Member",
        title: "Account deleted",
        details: `${email} deleted their SmartyGym account.`,
        link: "https://smartygym.com/admin",
        dedupeKey: `account-deleted-${context.userId}`,
      });
    } catch {
      /* alerts never block the action */
    }
    return { ok: true };
  });

/**
 * Fires when a brand-new account signs in for the first time (email or Google),
 * so the administrator gets an email about every new sign-up.
 * Only accounts created in the last 2 days qualify; the idempotency key keeps it to one email.
 */
export const announceNewSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const u = data?.user;
      if (!u?.created_at || Date.now() - new Date(u.created_at).getTime() > 2 * 86400000) {
        return { ok: true };
      }
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const name = (meta.full_name as string) || (meta.name as string) || "";
      const provider = (u.app_metadata?.provider as string) || "email";
      const { notifyAdmins } = await import("@/lib/admin-alert.server");
      await notifyAdmins({
        kind: "Member",
        title: "New sign-up",
        details: `${name ? name + " — " : ""}${u.email ?? context.userId} created a SmartyGym account (${provider}) on ${new Date(u.created_at).toUTCString()}.`,
        link: "https://smartygym.com/admin",
        dedupeKey: `new-signup-${context.userId}`,
      });
    } catch {
      /* alerts never block sign-in */
    }
    return { ok: true };
  });

/**
 * Fires once, when a member finishes their Training Profile for the first time,
 * so the administrator gets an email about the new active member.
 */
export const announceNewMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    try {
      const email = (context.claims?.email as string | undefined) ?? context.userId;
      const { notifyAdmins } = await import("@/lib/admin-alert.server");
      await notifyAdmins({
        kind: "Member",
        title: "New member onboarded",
        details: `${email} completed their Training Profile.`,
        link: "https://smartygym.com/admin",
        dedupeKey: `new-member-${context.userId}`,
      });
    } catch {
      /* alerts never block onboarding */
    }
    return { ok: true };
  });
