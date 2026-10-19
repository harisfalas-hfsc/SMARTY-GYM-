import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Saves this browser's push token for the signed-in member. */
export const registerPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { token: string; userAgent?: string }) => {
    const token = String(i?.token ?? "").trim();
    if (!token || token.length > 4096) throw new Error("Invalid token");
    return { token, userAgent: String(i?.userAgent ?? "").slice(0, 300) };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // A token belongs to one browser; reassign it to whoever is signed in there now.
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      { token: data.token, user_id: context.userId, platform: "web", user_agent: data.userAgent, last_seen_at: new Date().toISOString() } as never,
      { onConflict: "token" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Removes this browser's push token (member turned push off). */
export const unregisterPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { token: string }) => ({ token: String(i?.token ?? "").slice(0, 4096) }))
  .handler(async ({ data, context }) => {
    await context.supabase.from("push_subscriptions").delete().eq("token", data.token).eq("user_id", context.userId);
    return { ok: true as const };
  });
