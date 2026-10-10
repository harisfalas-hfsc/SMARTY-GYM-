import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ActivityReport } from "@/lib/activity/report";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const adminGetUserActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fromDate: string; toDate: string }) => {
    if (!ISO.test(d.fromDate) || !ISO.test(d.toDate)) throw new Error("Choose valid dates");
    return d;
  })
  .handler(async ({ context, data }): Promise<{ report: ActivityReport } | { error: string }> => {
    try {
      const { data: isAdmin } = await context.supabase.rpc("is_app_admin", { _user_id: context.userId });
      if (!isAdmin) return { error: "Admin access required" };
      let { fromDate, toDate } = data;
      if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];
      const days = (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000;
      if (days > 366) return { error: "Choose a range of one year or less." };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { collectUserActivity } = await import("@/lib/activity/collect.server");
      const report = await collectUserActivity(supabaseAdmin as never, fromDate, toDate);
      return { report };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not load activity" };
    }
  });
