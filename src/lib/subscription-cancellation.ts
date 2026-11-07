export type CancellationSubscription = {
  provider: string | null;
  environment?: string | null;
  status: string | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: string | null;
};

export function isCancelledSubscription(sub: CancellationSubscription): boolean {
  return sub.provider === "stripe" && sub.environment === "live" &&
    (sub.status === "canceled" || sub.cancel_at_period_end === true);
}

export type CancellationEvent = {
  id?: string;
  type: string;
  created?: number;
  data: { object: any; previous_attributes?: Record<string, unknown> };
};

export function cancellationAlertKind(event: CancellationEvent): "ended" | "renewal-off" | null {
  if (event.type === "customer.subscription.deleted") return "ended";
  if (event.type === "customer.subscription.updated" &&
      event.data.object.cancel_at_period_end === true &&
      event.data.previous_attributes?.cancel_at_period_end === false) return "renewal-off";
  return null;
}