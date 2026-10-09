import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutAnnouncement } from "./broadcast-content";
import { wantsAnnouncementEmail } from "./broadcast-content";

type DB = SupabaseClient;

// Mass broadcast emails (new workout / shared workout announcements) go through
// the Resend connector gateway. The Lovable managed email service only allows
// transactional, per-action sends — mass mailing must use the marketing-grade
// Resend path. smartygym.com is a verified Resend sending domain.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "SMARTYGYM <no-reply@smartygym.com>";
const SITE_URL = "https://smartygym.com";
const BATCH = 100;

export type BroadcastEmail = WorkoutAnnouncement;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared old-project new-content layout, adapted to fluid mobile tables. */
export function broadcastEmailHtml(email: BroadcastEmail): string {
  const paragraph = (text: string, emphasis = false) => `<p style="font-size:${emphasis ? 18 : 16}px;line-height:1.6;color:${emphasis ? "#29B6D2" : "#333333"};font-weight:${emphasis ? "bold" : "normal"};margin:0 0 15px;overflow-wrap:anywhere;">${escapeHtml(text)}</p>`;
  return `<!DOCTYPE html>
<html lang="en" dir="ltr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="x-apple-disable-message-reformatting" /><title>${escapeHtml(email.subject)}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;-webkit-text-size-adjust:100%;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;"><tr><td style="padding:24px 12px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background-color:#1a1a1a;background-image:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:30px 20px;text-align:center;">
<h1 style="color:#29B6D2;margin:0;font-size:28px;font-weight:bold;">SMARTYGYM</h1>
<p style="color:#999999;margin:8px 0 0;font-size:14px;line-height:1.6;">Your Gym Re-imagined. Anywhere, Anytime.</p>
</td></tr>
<tr><td style="padding:32px 24px;">
<h2 style="color:#1a1a1a;margin:0 0 20px;font-size:24px;line-height:1.3;overflow-wrap:anywhere;">${escapeHtml(email.heading)}</h2>
${paragraph(email.body)}
${email.workoutName ? paragraph(email.workoutName, true) : ""}
${email.supportingText ? paragraph(email.supportingText) : ""}
<div style="text-align:center;margin-top:30px;">
<a href="${escapeHtml(email.buttonHref)}" style="display:inline-block;background-color:#29B6D2;background-image:linear-gradient(135deg,#29B6D2,#5CD3E8);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;line-height:1.4;">${escapeHtml(email.buttonLabel ?? "View Workout")}</a>
</div></td></tr>
<tr><td style="background-color:#f8f8f8;padding:20px 24px;text-align:center;border-top:1px solid #eeeeee;">
<p style="color:#888888;margin:0;font-size:12px;line-height:1.6;">You're receiving this email because you have a SMARTYGYM account.</p>
<p style="font-size:13px;color:#666666;line-height:1.6;margin:16px 0 12px;">SMARTYGYM &ndash; Your Expert Fitness Partner<br />Designed by HARIS FALAS, Sports Scientist (CSCS Certified)</p>
<a href="${SITE_URL}/privacy" style="font-size:12px;color:#999999;text-decoration:underline;">Privacy Policy</a>
</td></tr></table></td></tr></table>
</body></html>`;
}

/**
 * Sends the broadcast email to every account with an email address, except
 * `input.exclude` and anyone who already received it (tracked in
 * broadcast_email_sends so partial failures retry without duplicates).
 * `onlyUserIds` optionally restricts recipients to that audience.
 * Returns the number of emails actually sent.
 */
export async function sendBroadcastEmail(
  db: DB,
  input: BroadcastEmail,
  onlyUserIds?: string[],
): Promise<number> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

  const allowed = onlyUserIds ? new Set(onlyUserIds) : null;
  if (allowed && allowed.size === 0) return 0;

  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id,email,email_new_workouts,email_shared_workouts")
    .limit(20000);
  if (profilesError) throw new Error(profilesError.message);

  const { data: done, error: doneError } = await db
    .from("broadcast_email_sends")
    .select("user_id")
    .eq("dedupe_key", input.dedupeKey)
    .limit(20000);
  if (doneError) throw new Error(doneError.message);
  const already = new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id));

  const recipients = ((profiles as { id: string; email: string | null; email_new_workouts: boolean; email_shared_workouts: boolean }[] | null) ?? [])
    .filter((p) => p.email && p.id !== input.exclude && !already.has(p.id) && wantsAnnouncementEmail(p, input.dedupeKey) && (!allowed || allowed.has(p.id)));

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
