import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

// Mass broadcast emails (new workout / shared workout announcements) go through
// the Resend connector gateway. The Lovable managed email service only allows
// transactional, per-action sends — mass mailing must use the marketing-grade
// Resend path. smartygym.com is a verified Resend sending domain.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "SMARTYGYM <no-reply@smartygym.com>";
const SITE_URL = "https://smartygym.com";
const LOGO_URL = `${SITE_URL}/__l5e/assets-v1/4df8117f-d0e1-40cc-92b8-69804d967d79/smartygym-logo.png`;
const BATCH = 100;

export interface BroadcastEmail {
  dedupeKey: string;
  subject: string;
  heading: string;
  body: string;
  buttonHref: string;
  buttonLabel?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Branded HTML in the same clean white style as the approved welcome email. */
export function broadcastEmailHtml(email: BroadcastEmail): string {
  const heading = escapeHtml(email.heading);
  const body = escapeHtml(email.body);
  const label = escapeHtml(email.buttonLabel ?? "Open workout");
  const href = escapeHtml(email.buttonHref);
  return `<!DOCTYPE html>
<html lang="en" dir="ltr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:620px;margin:0 auto;padding:24px 22px 32px;">
  <div style="border-top:5px solid #2563eb;padding:22px 4px 24px;">
    <table role="presentation" style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:78px;vertical-align:middle;"><img src="${LOGO_URL}" width="64" height="64" alt="SMARTYGYM" style="display:block;border:0;" /></td>
        <td style="vertical-align:middle;">
          <div style="font-size:16px;font-weight:bold;letter-spacing:0.08em;color:#0f172a;">SMARTYGYM</div>
          <div style="font-size:10px;letter-spacing:0.14em;color:#64748b;margin-top:2px;">YOUR GYM RE-IMAGINED. ANYWHERE, ANYTIME.</div>
        </td>
      </tr>
    </table>
    <h1 style="font-size:24px;line-height:1.25;color:#0f172a;margin:22px 0 10px;">${heading}</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0;">${body}</p>
    <a href="${href}" style="display:inline-block;margin-top:20px;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:999px;text-decoration:none;">${label}</a>
  </div>
  <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0 16px;" />
  <p style="font-size:12px;color:#94a3b8;margin:0;">You are receiving this because you have a SMARTYGYM account.</p>
  <p style="font-size:12px;color:#94a3b8;margin:6px 0 0;">HARIS FALAS &mdash; Your Gym Re-imagined. Anywhere, Anytime.</p>
</div>
</body></html>`;
}

/**
 * Sends the broadcast email to every account with an email address, except
 * `input.exclude` and anyone who already received it (tracked in
 * broadcast_email_sends so partial failures retry without duplicates).
 * Returns the number of emails actually sent.
 */
export async function sendBroadcastEmail(db: DB, input: BroadcastEmail): Promise<number> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id,email")
    .limit(20000);
  if (profilesError) throw new Error(profilesError.message);

  const { data: done, error: doneError } = await db
    .from("broadcast_email_sends")
    .select("user_id")
    .eq("dedupe_key", input.dedupeKey)
    .limit(20000);
  if (doneError) throw new Error(doneError.message);
  const already = new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id));

  const recipients = ((profiles as { id: string; email: string | null }[] | null) ?? [])
    .filter((p) => p.email && p.id !== input.exclude && !already.has(p.id));

  if (!recipients.length) return 0;

  // Mark intent first; a failed batch unmarks its recipients so the next
  // attempt retries them without ever re-sending a delivered email.
  const marked: { user_id: string }[] = [];
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const { data: inserted, error: markError } = await db
      .from("broadcast_email_sends")
      .upsert(
        batch.map((p) => ({ user_id: p.id, dedupe_key: input.dedupeKey })),
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
      )
      .select("user_id");
    if (markError) throw new Error(markError.message);
    marked.push(...((inserted as { user_id: string }[] | null) ?? []).map((r) => ({ user_id: r.user_id })));
  }

  const html = broadcastEmailHtml(input);
  let sent = 0;
  for (let i = 0; i < marked.length; i += BATCH) {
    const batch = marked.slice(i, i + BATCH);
    const emailById = new Map(recipients.map((p) => [p.id, p.email as string]));
    const payload = batch.map((m) => ({
      from: FROM,
      to: [emailById.get(m.user_id)],
      subject: input.subject,
      html,
    }));
    let response: Response;
    try {
      response = await fetch(`${GATEWAY_URL}/emails/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      await db.from("broadcast_email_sends").delete().in("user_id", batch.map((m) => m.user_id)).eq("dedupe_key", input.dedupeKey);
      throw new Error(`Resend request failed: ${e instanceof Error ? e.message : "network error"}`);
    }
    if (!response.ok) {
      const errorBody = await response.text();
      await db.from("broadcast_email_sends").delete().in("user_id", batch.map((m) => m.user_id)).eq("dedupe_key", input.dedupeKey);
      throw new Error(`Resend request failed [${response.status}]: ${errorBody}`);
    }
    const result = (await response.json().catch(() => null)) as { data?: unknown[]; message?: string } | null;
    if (result && result.message) {
      // Resend reports failures inside a 2xx body only with an error field.
      throw new Error(`Resend request failed: ${result.message}`);
    }
    sent += batch.length;
  }
  return sent;
}
