import { cancellationAlertKind, type CancellationEvent } from "./subscription-cancellation";
import type { StripeEnv } from "./stripe.server";

/** Only a saved subscription in this app can cause an owner alert. */
export async function notifySubscriptionCancellation(db: any, event: CancellationEvent, env: StripeEnv) {
  const kind = cancellationAlertKind(event);
  if (!kind || env !== "live" || !event.id) return;
  const subscription = event.data.object;
  const { data: row, error } = await db.from("subscriptions")
    .select("user_id,last_event_at")
    .eq("provider", "stripe").eq("environment", env)
    .eq("provider_subscription_id", subscription.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row?.user_id || (event.created && Number(row.last_event_at) > event.created)) return;
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("display_name,email").eq("id", row.user_id).maybeSingle();
  if (profileError) throw new Error(profileError.message);
  // Never send an anonymous "A member" notice for an unowned subscription.
  if (!profile?.email) return;
  const item = subscription.items?.data?.[0];
  const end = item?.current_period_end ?? subscription.current_period_end;
  const endDate = end ? new Date(end * 1000).toLocaleString("en-GB", { timeZone: "Europe/Nicosia" }) : null;
  const details = [
    `Name: ${profile.display_name || "Not provided"}`,
    `Email: ${profile.email}`,
    kind === "ended" ? "The paid subscription has ended. Any separate valid gift or complimentary access remains unchanged." :
      `Auto-renewal is off. Paid access remains active${endDate ? ` until ${endDate} (Cyprus time)` : " until the end of the current paid period"}.`,
    "Their account, workouts, Logbook and training history remain preserved.",
  ].join("\n\n");
  const { sendTemplateEmail } = await import("./email-templates/send-email");
  // Let delivery errors reach Stripe so this event is retried; suppression is handled normally.
  await sendTemplateEmail("admin-alert", "", {
    templateData: { alertType: "Payment", title: kind === "ended" ? "A membership was cancelled" : "Auto-renewal turned off", details,
      link: `https://smartygym.com/admin?members=cancelled&member=${encodeURIComponent(row.user_id)}` },
    idempotencyKey: `smartygym-cancellation-${env}-${event.id}`,
  });
}