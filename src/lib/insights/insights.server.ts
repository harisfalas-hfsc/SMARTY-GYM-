import type { SupabaseClient } from "@supabase/supabase-js";
import { localDateISO } from "@/lib/wod-cycle";
import { computeWeeklyInsights, mondayOf, addDays, titleCase, type WeeklyInsights } from "./compute";

type DB = SupabaseClient;
const SITE_URL = "https://smartygym.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "SMARTYGYM <no-reply@smartygym.com>";
const PER_RUN = 300;
const BATCH = 50;

/** Loads one member's data and computes the Insights for the week starting `weekStart`. */
export async function loadWeeklyInsights(db: DB, userId: string, mode: "current" | "previous" = "current"): Promise<WeeklyInsights> {
  const { data: profile } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const tz = ((profile as { timezone?: string } | null)?.timezone || "Europe/Athens") as string;
  const today = localDateISO(new Date(), tz);
  const weekStart = mode === "current" ? mondayOf(today) : addDays(mondayOf(today), -7);
  const since = addDays(weekStart, -35);
  const [w, r, c, p] = await Promise.all([
    db
      .from("workouts")
      .select("id,name,category,status,completed_at,scheduled_at,created_at,duration_min,is_shared,is_wod,created_by,community_source_id,deleted_at")
      .eq("user_id", userId)
      .limit(5000),
    db.from("workout_results").select("performed_at,strength_load,conditioning_load").eq("user_id", userId).gte("performed_at", `${since}T00:00:00Z`).limit(2000),
    db.from("smarty_checkins").select("checkin_date,daily_smarty_score").eq("user_id", userId).gte("checkin_date", since).limit(200),
    db.from("user_progress").select("score,current_streak,longest_streak,workouts_completed").eq("user_id", userId).maybeSingle(),
  ]);
  return computeWeeklyInsights({
    workouts: (w.data ?? []) as never,
    results: (r.data ?? []) as never,
    checkins: (c.data ?? []) as never,
    progress: (p.data ?? null) as never,
    weekStart,
    today,
    toLocalDate: (iso) => localDateISO(new Date(iso), tz),
  });
}

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function weekLabel(i: WeeklyInsights) {
  return `${fmtDay(i.weekStart)} – ${fmtDay(i.weekEnd)}`;
}

/** Short inbox message; the full report lives in Logbook → Progress → Insights. */
export function insightsInboxContent(i: WeeklyInsights, firstName: string) {
  const tip = i.tips[0];
  return {
    title: `${i.headline.emoji} Your weekly Insights are ready`,
    body: `Hi ${firstName}, ${i.kpis.completed} workout${i.kpis.completed === 1 ? "" : "s"} on ${i.kpis.activeDays} day${i.kpis.activeDays === 1 ? "" : "s"} (${weekLabel(i)}). ${i.headline.text}.${tip ? ` Smarty Coach: ${tip.title}.` : ""} Open Logbook → Progress → Insights for your full report.`,
  };
}

export async function insightsEmailHtml(i: WeeklyInsights, firstName: string): Promise<string> {
  const { escapeHtml: e } = await import("@/lib/broadcast-email.server");
  const abs = (href: string) => (href.startsWith("http") ? href : `${SITE_URL}${href}`);
  const tile = (emoji: string, value: string, label: string, color: string) =>
    `<td width="50%" style="padding:6px;"><div style="background:${color}14;border:1px solid ${color}40;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:22px;">${emoji}</div><div style="font-size:22px;font-weight:bold;color:#1a1a1a;">${e(value)}</div><div style="font-size:12px;color:#666;">${e(label)}</div></div></td>`;
  const delta = (now: number, prev: number) => (now > prev ? `↑ ${now - prev}` : now < prev ? `↓ ${prev - now}` : "=");
  const maxDay = Math.max(1, ...i.days.map((d) => d.count));
  const bars = i.days
    .map((d) => {
      const h = d.count ? Math.round((d.count / maxDay) * 60) + 6 : 4;
      return `<td align="center" valign="bottom" style="padding:0 3px;"><div style="height:70px;display:table-cell;vertical-align:bottom;"><div style="width:22px;height:${h}px;background:${d.count ? "#29B6D2" : "#e5e7eb"};border-radius:4px;"></div></div><div style="font-size:11px;color:#666;margin-top:4px;">${d.label}</div></td>`;
    })
    .join("");
  const section = (title: string, inner: string) =>
    `<h3 style="font-size:17px;color:#1a1a1a;margin:26px 0 10px;">${title}</h3>${inner}`;
  const list = (items: string[]) =>
    items.length ? `<ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.7;">${items.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
  const tips = i.tips
    .map(
      (t) =>
        `<div style="border:1px solid #e5e7eb;border-left:4px solid #29B6D2;border-radius:8px;padding:12px 14px;margin:0 0 10px;"><div style="font-weight:bold;color:#1a1a1a;font-size:15px;">${t.emoji} ${e(t.title)}</div><div style="color:#444;font-size:14px;line-height:1.5;margin:4px 0 8px;">${e(t.body)}</div><a href="${e(abs(t.href))}" style="color:#29B6D2;font-weight:bold;font-size:14px;text-decoration:none;">${e(t.label)} →</a></div>`,
    )
    .join("");
  const loadText =
    i.load.trend === "none"
      ? "No measured training load yet this week."
      : `This week: <strong>${i.load.week}</strong> · 4-week average: <strong>${i.load.average}</strong> · ${i.load.trend === "up" ? "📈 rising" : i.load.trend === "down" ? "📉 lighter" : "➡️ steady"}`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your weekly Insights</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;"><tr><td style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background-color:#1a1a1a;background-image:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:30px 20px;text-align:center;">
<h1 style="color:#29B6D2;margin:0;font-size:28px;">SMARTYGYM</h1>
<p style="color:#999;margin:8px 0 0;font-size:14px;">Your Gym Re-imagined. Anywhere, Anytime.</p></td></tr>
<tr><td style="padding:28px 22px;">
<p style="color:#29B6D2;font-weight:bold;font-size:13px;letter-spacing:1px;margin:0;">SMARTY INSIGHTS · ${e(weekLabel(i))}</p>
<h2 style="color:#1a1a1a;margin:6px 0 8px;font-size:24px;">${i.headline.emoji} ${e(i.headline.text)}</h2>
<p style="color:#333;font-size:15px;line-height:1.6;margin:0;">Hi ${e(firstName)}, here is your weekly snapshot from Smarty Coach.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
${tile("🏋️", String(i.kpis.completed), `Workouts (${delta(i.kpis.completed, i.kpis.prevCompleted)} vs last week)`, "#29B6D2")}
${tile("📅", String(i.kpis.activeDays), "Active days", "#22c55e")}</tr><tr>
${tile("⏱️", `${i.kpis.minutes} min`, "Training time", "#f59e0b")}
${tile("🔥", `${i.kpis.currentStreak}`, `Day streak (best ${i.kpis.longestStreak})`, "#ef4444")}</tr><tr>
${tile("⭐", String(i.kpis.score), "Smarty Progress Score", "#8b5cf6")}
${tile("✅", String(i.kpis.totalCompleted), "Workouts completed in total", "#0ea5e9")}</tr></table>
${section("📊 Your week", `<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr>${bars}</tr></table>`)}
${i.categories.length ? section("💪 What you did", list(i.categories.map((c) => `${e(titleCase(c.category))}: <strong>${c.count}</strong>`))) : ""}
${i.missed.length || i.untrained.length ? section("⏳ What you didn't do", list([...i.missed.map((m) => `Missed: ${e(m.name)} (${fmtDay(m.date)})`), ...i.untrained.map((c) => `No ${e(titleCase(c))} in the last 14 days`)])) : ""}
${section("⚡ Training Load", `<p style="color:#333;font-size:14px;margin:0;">${loadText}</p>`)}
${i.checkins.days ? section("📝 Check-ins", `<p style="color:#333;font-size:14px;margin:0;">${i.checkins.days} check-in day${i.checkins.days === 1 ? "" : "s"}${i.checkins.avgScore !== null ? ` · average Smarty Score <strong>${i.checkins.avgScore}</strong>` : ""}</p>`) : ""}
${section("🗓️ Coming up", i.upcoming.length ? list(i.upcoming.map((u) => `${fmtDay(u.date)}: ${e(u.name)}`)) : `<p style="color:#333;font-size:14px;margin:0;">Nothing scheduled yet.</p>`)}
${section("🧠 Smarty Coach suggestions", tips)}
<div style="text-align:center;margin-top:28px;"><a href="${SITE_URL}/logbook?view=progress" style="display:inline-block;background-color:#29B6D2;background-image:linear-gradient(135deg,#29B6D2,#5CD3E8);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Open my Insights</a></div>
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px 24px;text-align:center;border-top:1px solid #eee;">
<p style="color:#888;margin:0;font-size:12px;line-height:1.6;">You're receiving this weekly report because you train with SMARTYGYM. You can switch these emails off in My Account.</p>
<p style="font-size:13px;color:#666;line-height:1.6;margin:16px 0 12px;">SMARTYGYM &ndash; Your Expert Fitness Partner<br />Designed by HARIS FALAS, Sports Scientist (CSCS Certified)</p>
<a href="${SITE_URL}/privacy" style="font-size:12px;color:#999;text-decoration:underline;">Privacy Policy</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmails(items: { to: string; subject: string; html: string }[]) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!apiKey || !resendKey) throw new Error("Email sending is not configured");
  const res = await fetch(`${GATEWAY_URL}/emails/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": resendKey },
    body: JSON.stringify(items.map((x) => ({ from: FROM, to: [x.to], subject: x.subject, html: x.html }))),
  });
  if (!res.ok) throw new Error(`Resend request failed [${res.status}]: ${await res.text()}`);
}

export async function sendInsightsPreview(db: DB, userId: string, to: string) {
  const { data: p } = await db.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  const first = String((p as { display_name?: string } | null)?.display_name ?? "").trim().split(/\s+/)[0] || "there";
  const i = await loadWeeklyInsights(db, userId, "previous");
  await sendEmails([{ to, subject: `${i.headline.emoji} Your SMARTYGYM weekly Insights (${weekLabel(i)})`, html: await insightsEmailHtml(i, first) }]);
  return i;
}

/**
 * Monday report: every account with at least one completed workout ever gets
 * an inbox message (always) and an email (unless switched off). Deduped per
 * ISO week; bounded per run, so a later tick finishes any remainder.
 */
export async function runWeeklyInsights(db: DB): Promise<{ inbox: number; emails: number; remaining: number; failures: string[] }> {
  const { data: done } = await db.from("workouts").select("user_id").eq("status", "completed").is("deleted_at", null).limit(50000);
  const userIds = [...new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id))];
  const weekKey = `insights:${addDays(mondayOf(localDateISO(new Date(), "Europe/Athens")), -7)}`;
  const { data: sentRows } = await db.from("notifications").select("user_id").eq("dedupe_key", weekKey).limit(50000);
  const already = new Set(((sentRows as { user_id: string }[] | null) ?? []).map((r) => r.user_id));
  const todo = userIds.filter((id) => !already.has(id));
  const slice = todo.slice(0, PER_RUN);
  const { data: profiles } = slice.length
    ? await db.from("profiles").select("id,email,display_name,email_weekly_insights").in("id", slice)
    : { data: [] };
  const byId = new Map(((profiles as { id: string; email: string | null; display_name: string | null; email_weekly_insights: boolean }[] | null) ?? []).map((p) => [p.id, p]));

  let inbox = 0;
  let emails = 0;
  const failures: string[] = [];
  let pending: { userId: string; to: string; subject: string; html: string }[] = [];

  const flush = async () => {
    if (!pending.length) return;
    const batch = pending;
    pending = [];
    const { data: marked } = await db
      .from("broadcast_email_sends")
      .upsert(batch.map((b) => ({ user_id: b.userId, dedupe_key: weekKey })), { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("user_id");
    const fresh = new Set(((marked as { user_id: string }[] | null) ?? []).map((m) => m.user_id));
    const toSend = batch.filter((b) => fresh.has(b.userId));
    if (!toSend.length) return;
    try {
      await sendEmails(toSend);
      emails += toSend.length;
    } catch (e) {
      await db.from("broadcast_email_sends").delete().in("user_id", toSend.map((b) => b.userId)).eq("dedupe_key", weekKey);
      failures.push(e instanceof Error ? e.message : "email error");
    }
  };

  for (const id of slice) {
    const p = byId.get(id);
    if (!p) continue;
    try {
      const i = await loadWeeklyInsights(db, id, "previous");
      const first = String(p.display_name ?? "").trim().split(/\s+/)[0] || "there";
      const content = insightsInboxContent(i, first);
      const { error } = await db.from("notifications").insert({ user_id: id, kind: "weekly_insights", title: content.title, body: content.body, dedupe_key: weekKey } as never);
      if (error) throw new Error(error.message);
      inbox++;
      if (p.email && p.email_weekly_insights !== false) {
        pending.push({ userId: id, to: p.email, subject: `${i.headline.emoji} Your SMARTYGYM weekly Insights (${weekLabel(i)})`, html: await insightsEmailHtml(i, first) });
        if (pending.length >= BATCH) await flush();
      }
    } catch (e) {
      failures.push(`${id.slice(0, 8)}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  await flush();
  return { inbox, emails, remaining: Math.max(0, todo.length - slice.length), failures };
}
