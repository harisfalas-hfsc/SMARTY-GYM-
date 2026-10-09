import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The signed-in member's own Insights (current week, or last full week). */
export const getMyInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week?: "current" | "previous" }) => ({ week: d?.week === "previous" ? ("previous" as const) : ("current" as const) }))
  .handler(async ({ data, context }) => {
    const { requireActiveMembership } = await import("@/lib/membership.server");
    await requireActiveMembership(context);
    const { loadWeeklyInsights } = await import("@/lib/insights/insights.server");
    return loadWeeklyInsights(context.supabase as never, context.userId, data.week);
  });

/** Admin only: emails the admin's own weekly report to the admin's account address for review. */
export const adminSendInsightsPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to?: string }) => ({ to: typeof d?.to === "string" ? d.to.trim().slice(0, 200) : "" }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) throw new Error("Invalid email");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendInsightsPreview } = await import("@/lib/insights/insights.server");
    const i = await sendInsightsPreview(supabaseAdmin as never, context.userId, data.to);
    return { ok: true, completed: i.kpis.completed, tips: i.tips.length };
  });
