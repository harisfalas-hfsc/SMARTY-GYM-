import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser push that mirrors a paired inbox + email message. Never throws:
 * a push failure must never block the inbox message or the email.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";
const SITE_URL = "https://smartygym.com";
const CONCURRENCY = 20;

export type PushMessage = { title: string; body: string; path: string; tag: string };

export function pushPayload(token: string, m: PushMessage) {
  const link = m.path.startsWith("http") ? m.path : `${SITE_URL}${m.path.startsWith("/") ? "" : "/"}${m.path}`;
  const body = m.body.replace(/\s+/g, " ").trim().slice(0, 180);
  return {
    message: {
      token,
      notification: { title: m.title.slice(0, 120), body },
      data: { link, tag: m.tag },
      webpush: {
        fcm_options: { link },
        notification: { icon: `${SITE_URL}/icon-192.png`, badge: `${SITE_URL}/icon-192.png`, tag: m.tag },
      },
    },
  };
}

/** Stale tokens: delete instead of retrying. */
export function isStaleTokenResponse(status: number, text: string): boolean {
  return status === 404 || (status === 400 && /INVALID_ARGUMENT|UNREGISTERED|registration token/i.test(text));
}

export async function sendPushToUsers(
  db: SupabaseClient,
  userIds: string[] | "all",
  message: PushMessage,
  opts: { exclude?: string } = {},
): Promise<number> {
  try {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!lovableKey || !connKey) return 0;
    const rows: { token: string; user_id: string }[] = [];
    if (userIds === "all") {
      for (let from = 0; ; from += 1000) {
        const { data } = await db.from("push_subscriptions").select("token,user_id").range(from, from + 999);
        const page = (data as typeof rows | null) ?? [];
        rows.push(...page);
        if (page.length < 1000) break;
      }
    } else {
      const ids = [...new Set(userIds)];
      for (let i = 0; i < ids.length; i += 500) {
        const { data } = await db.from("push_subscriptions").select("token,user_id").in("user_id", ids.slice(i, i + 500));
        rows.push(...((data as typeof rows | null) ?? []));
      }
    }
    const targets = rows.filter((r) => r.user_id !== opts.exclude);
    if (!targets.length) return 0;
    let sent = 0;
    const stale: string[] = [];
    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      await Promise.all(
        targets.slice(i, i + CONCURRENCY).map(async (t) => {
          try {
            const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
              body: JSON.stringify(pushPayload(t.token, message)),
            });
            if (res.ok) { sent += 1; return; }
            const text = await res.text();
            if (isStaleTokenResponse(res.status, text)) stale.push(t.token);
            else console.error(`[push] FCM send failed [${res.status}]: ${text.slice(0, 300)}`);
          } catch (e) {
            console.error("[push] send error", e);
          }
        }),
      );
    }
    if (stale.length) await db.from("push_subscriptions").delete().in("token", stale);
    return sent;
  } catch (e) {
    console.error("[push] failed", e);
    return 0;
  }
}
