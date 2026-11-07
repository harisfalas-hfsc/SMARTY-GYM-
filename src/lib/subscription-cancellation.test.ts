import { describe, expect, it, vi, beforeEach } from "vitest";
import { cancellationAlertKind, isCancelledSubscription, type CancellationEvent } from "./subscription-cancellation";
import { notifySubscriptionCancellation } from "./subscription-cancellation.server";

const send = vi.hoisted(() => vi.fn().mockResolvedValue({ sent: true }));
vi.mock("./email-templates/send-email", () => ({ sendTemplateEmail: send }));
const event = (type: string, extra = {}): CancellationEvent => ({ id: "evt_cancel", created: 100, type, data: { object: { id: "sub_owned", cancel_at_period_end: true, current_period_end: 1794009600 }, ...extra } });
function database(owned = true, lastEvent = 100) {
  return { from: (table: string) => {
    const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: table === "subscriptions" ? (owned ? { user_id: "user_1", last_event_at: lastEvent } : null) : { display_name: "Test Member", email: "member@example.com" }, error: null }) };
    return q;
  } };
}
beforeEach(() => send.mockClear());
describe("cancellation rules", () => {
  it("includes ended live paid subscriptions", () => expect(isCancelledSubscription({ provider: "stripe", environment: "live", status: "canceled" })).toBe(true));
  it("includes auto-renewal off while paid access is active", () => expect(isCancelledSubscription({ provider: "stripe", environment: "live", status: "active", cancel_at_period_end: true })).toBe(true));
  it("excludes complimentary and test subscriptions", () => {
    expect(isCancelledSubscription({ provider: "admin_grant", environment: "live", status: "canceled" })).toBe(false);
    expect(isCancelledSubscription({ provider: "stripe", environment: "sandbox", status: "canceled" })).toBe(false);
  });
  it("alerts only for the actual auto-renewal transition", () => {
    expect(cancellationAlertKind(event("customer.subscription.updated", { previous_attributes: { cancel_at_period_end: false } }))).toBe("renewal-off");
    expect(cancellationAlertKind(event("customer.subscription.updated"))).toBeNull();
  });
  it("sends an ended alert with actual member identity and retry-stable ID", async () => {
    await notifySubscriptionCancellation(database(), event("customer.subscription.deleted"), "live");
    expect(send).toHaveBeenCalledWith("admin-alert", "", expect.objectContaining({ idempotencyKey: "smartygym-cancellation-live-evt_cancel", templateData: expect.objectContaining({ details: expect.stringContaining("member@example.com") }) }));
  });
  it("sends auto-renewal alert with paid-through date", async () => {
    await notifySubscriptionCancellation(database(), event("customer.subscription.updated", { previous_attributes: { cancel_at_period_end: false } }), "live");
    expect(send.mock.calls[0]?.[2].templateData.details).toContain("2026");
  });
  it("ignores subscriptions belonging to another app", async () => {
    await notifySubscriptionCancellation(database(false), event("customer.subscription.deleted"), "live");
    expect(send).not.toHaveBeenCalled();
  });
  it("does not send real alerts for test payments or stale events", async () => {
    await notifySubscriptionCancellation(database(), event("customer.subscription.deleted"), "sandbox");
    await notifySubscriptionCancellation(database(true, 200), event("customer.subscription.deleted"), "live");
    expect(send).not.toHaveBeenCalled();
  });
  it("propagates delivery failure to allow Stripe retry", async () => {
    send.mockRejectedValueOnce(new Error("delivery failed"));
    await expect(notifySubscriptionCancellation(database(), event("customer.subscription.deleted"), "live")).rejects.toThrow("delivery failed");
  });
});