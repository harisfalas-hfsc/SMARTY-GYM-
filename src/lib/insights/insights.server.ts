import type { SupabaseClient } from "@supabase/supabase-js";
import { localDateISO, localHour } from "@/lib/wod-cycle";
import {
  conditioningLoadState,
  overallLoadState,
  strengthLoadState,
  summarizeConditioning,
  summarizeStrength,
} from "@/lib/performance/load";
import type { SetLogRow, WorkoutResultRow } from "@/lib/performance/types";
import { computeWeeklyInsights, mondayOf, addDays, titleCase, type WeeklyInsights, type InsightsLoad } from "./compute";

import { LOAD_TEXT, encodeInsightMessage, decodeInsightMessage } from "./presentation";
import { storeEmailChart } from "./email-chart.server";

type DB = SupabaseClient;
const SITE_URL = "https://smartygym.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "SMARTYGYM <no-reply@smartygym.com>";
const PER_RUN = 200;
const DEFAULT_TZ = "Europe/Athens";

export const inboxKey = (weekStart: string) => `insights-inbox:${weekStart}`;
export const emailKey = (weekStart: string) => `insights-email:${weekStart}`;

/** Monday of the week being reported for a member: "previous" = the last full Mon–Sun week. */
export function reportWeekStart(now: Date, tz: string, mode: "current" | "previous"): string {
  const monday = mondayOf(localDateISO(now, tz));
  return mode === "current" ? monday : addDays(monday, -7);
}

const SET_COLS = "workout_id,attempt,step_index,exercise_name,section,set_number,reps,weight_kg,seconds,planned_reps,planned_weight_kg,planned_seconds,rpe,metric,rounds,interval_index,distance_m,partial,completed_at";
const RESULT_COLS = "workout_id,attempt,performed_at,format,category,metric,duration_seconds,rounds,extra_reps,intervals_done,intervals_total,finished,rpe,strength_load,conditioning_load,data_points,created_at";

/** The existing Training Load rules, applied to the reported week and the 21 days before it. */
export function weekLoad(sets: SetLogRow[], results: WorkoutResultRow[], weekStart: string, toLocal: (iso: string) => string): InsightsLoad {
  const weekEnd = addDays(weekStart, 6);
  const baseStart = addDays(weekStart, -21);
  const inR = (d: string, a: string, b: string) => d >= a && d <= b;
  const sDay = (s: SetLogRow) => toLocal(s.completed_at);
  const rDay = (r: WorkoutResultRow) => toLocal(r.performed_at ?? r.created_at);
  const weekSets = sets.filter((s) => inR(sDay(s), weekStart, weekEnd));
  const weekResults = results.filter((r) => inR(rDay(r), weekStart, weekEnd));
  const baseSets = sets.filter((s) => inR(sDay(s), baseStart, addDays(weekStart, -1)));
  const baseResults = results.filter((r) => inR(rDay(r), baseStart, addDays(weekStart, -1)));
  const strength = strengthLoadState({ current: summarizeStrength(weekSets), baseline: summarizeStrength(baseSets), baselineWeeks: 3 });
  const conditioning = conditioningLoadState({
    current: summarizeConditioning({ sets: weekSets, results: weekResults }),
    baseline: summarizeConditioning({ sets: baseSets, results: baseResults }),
    baselineWeeks: 3,
  });
  const recent = [-4, -3, -2, -1, 0].map((k) => {
    const s = addDays(weekStart, k * 7);
    const e = addDays(s, 6);
    const ids = new Set([
      ...sets.filter((x) => inR(sDay(x), s, e)).map((x) => `${x.workout_id}:${x.attempt}`),
      ...results.filter((x) => inR(rDay(x), s, e)).map((x) => `${x.workout_id}:${x.attempt}`),
    ]);
    return { weekStart: s, sessions: ids.size };
  });
  return { state: overallLoadState({ strength, conditioning }), recent };
}

/** Loads one member's data and computes their Insights, in their own timezone. */
export async function loadWeeklyInsights(db: DB, userId: string, mode: "current" | "previous" = "previous", now = new Date()): Promise<WeeklyInsights> {
  const { data: profile } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const tz = ((profile as { timezone?: string } | null)?.timezone || DEFAULT_TZ) as string;
  const today = localDateISO(now, tz);
  const weekStart = reportWeekStart(now, tz, mode);
  const since = `${addDays(weekStart, -36)}T00:00:00Z`;
  const [w, s, r, c, p] = await Promise.all([
    db
      .from("workouts")
      .select("id,name,category,status,completed_at,scheduled_at,created_at,duration_min,is_shared,is_wod,created_by,community_source_id,deleted_at")
      .eq("user_id", userId)
      .limit(5000),
    db.from("set_logs").select(SET_COLS).eq("user_id", userId).gte("completed_at", since).limit(5000),
    db.from("workout_results").select(RESULT_COLS).eq("user_id", userId).gte("created_at", since).limit(1000),
    db.from("smarty_checkins").select("checkin_date,daily_smarty_score").eq("user_id", userId).gte("checkin_date", addDays(weekStart, -7)).limit(100),
    db.from("user_progress").select("score,current_streak,longest_streak,workouts_completed").eq("user_id", userId).maybeSingle(),
  ]);
  const toLocalDate = (iso: string) => localDateISO(new Date(iso), tz);
  return computeWeeklyInsights({
    workouts: (w.data ?? []) as never,
    checkins: (c.data ?? []) as never,
    progress: (p.data ?? null) as never,
    load: weekLoad((s.data ?? []) as never, (r.data ?? []) as never, weekStart, toLocalDate),
    weekStart,
    today,
    toLocalDate,
  });
}

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function weekLabel(i: WeeklyInsights) {
  return `${fmtDay(i.weekStart)} – ${fmtDay(i.weekEnd)}`;
}

export const show = (v: number | null, suffix = "") => (v === null ? "—" : `${v}${suffix}`);

/** Short inbox message; the full report lives in Logbook → Progress → Insights. */
export function insightsInboxContent(i: WeeklyInsights, firstName: string) {
  const tip = i.tips[0];
  return {
    title: `${i.headline.emoji} Your weekly Insights are ready`,
    body: encodeInsightMessage(`Hi ${firstName}, ${i.kpis.completed} workout${i.kpis.completed === 1 ? "" : "s"} on ${i.kpis.activeDays} day${i.kpis.activeDays === 1 ? "" : "s"} (${weekLabel(i)}). ${i.headline.text}.${tip ? ` Smarty Coach: ${tip.title}.` : ""} Open Insights in Logbook for your full report.`, i),
  };
}

export function insightsSubject(i: WeeklyInsights) {
  return `${i.headline.emoji} Your SMARTYGYM weekly Insights (${weekLabel(i)})`;
}

export async function insightsEmailHtml(i: WeeklyInsights, firstName: string, charts?: { activity: string; load: string }): Promise<string> {
  const { escapeHtml: e } = await import("@/lib/broadcast-email.server");
  const abs = (href: string) => (href.startsWith("http") ? href : `${SITE_URL}${href}`);
  const tile = (emoji: string, value: string, label: string, color: string) =>
    `<td width="50%" style="padding:6px;"><div style="background:${color}14;border:1px solid ${color}40;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:22px;">${emoji}</div><div style="font-size:22px;font-weight:bold;color:#1a1a1a;">${e(value)}</div><div style="font-size:12px;color:#666;">${e(label)}</div></div></td>`;
  const delta = (now: number, prev: number) => (now > prev ? `↑ ${now - prev}` : now < prev ? `↓ ${prev - now}` : "=");
  const k = i.kpis;
  const chart = (src: string | undefined, points: { label: string; value: number }[], label: string) => {
    const summary = points.map((p) => `${p.label}: ${p.value}`).join(" · ");
    return `${src ? `<img src="${e(src)}" alt="${e(label + ": " + summary)}" width="500" style="display:block;width:100%;max-width:500px;height:auto;margin:8px auto;" />` : ""}<p style="font-size:11px;color:#666;line-height:1.6;">${e(summary)}</p>`;
  };
  const section = (title: string, inner: string) => `<h3 style="font-size:17px;color:#1a1a1a;margin:26px 0 10px;">${title}</h3>${inner}`;
  const list = (items: string[]) =>
    items.length ? `<ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.7;">${items.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
  const para = (t: string) => `<p style="color:#333;font-size:14px;margin:0;">${t}</p>`;
  const tips = i.tips
    .map(
      (t) =>
        `<div style="border:1px solid #e5e7eb;border-left:4px solid #29B6D2;border-radius:8px;padding:12px 14px;margin:0 0 10px;"><div style="font-weight:bold;color:#1a1a1a;font-size:15px;">${t.emoji} ${e(t.title)}</div><div style="color:#444;font-size:14px;line-height:1.5;margin:4px 0 8px;">${e(t.body)}</div><a href="${e(abs(t.href))}" style="color:#29B6D2;font-weight:bold;font-size:14px;text-decoration:none;">${e(t.label)} →</a></div>`,
    )
    .join("");

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
${tile("🏋️", String(k.completed), `Workouts (${delta(k.completed, k.prevCompleted)} vs last week)`, "#29B6D2")}
${tile("📅", String(k.activeDays), "Active days", "#22c55e")}</tr><tr>
${tile("⏱️", `${k.plannedMinutes} min`, `Planned training time (${delta(k.plannedMinutes, k.prevPlannedMinutes)} vs last week)`, "#f59e0b")}
${tile("🔥", show(k.currentStreak), `Day streak (best ${show(k.longestStreak)})`, "#ef4444")}</tr><tr>
${tile("⭐", show(k.score), "Smarty Progress Score", "#8b5cf6")}
${tile("✅", show(k.totalCompleted), "Workouts completed in total", "#0ea5e9")}</tr></table>
${section("📊 Your week", chart(charts?.activity, i.days.map(d => ({ label: d.label, value: d.count })), "Completed workouts"))}
${section("💪 What you did", i.categories.length ? list(i.categories.map((c) => `${e(titleCase(c.category))}: <strong>${c.count}</strong>`)) : para("No completed workouts this week."))}
${section("⏳ What you didn't do", i.notCompleted.length || i.untrained.length ? list([...i.notCompleted.map((m) => `Scheduled, not completed: ${e(m.name)} (${fmtDay(m.date)})`), ...i.untrained.map((c) => `No ${e(titleCase(c))} in the last 14 days`)]) : para("Nothing outstanding this week."))}
${section("⚡ Training Load", chart(charts?.load, i.load.recent.map(r => ({ label: fmtDay(r.weekStart), value: r.sessions })), "Logged sessions per week") + para(`<strong>${e(i.load.state)}</strong> — ${e(LOAD_TEXT[i.load.state] ?? "")}`) + para("Logged sessions per week (last point = this report)."))}
${section("📝 Check-ins", para(i.checkins.days ? `${i.checkins.days} check-in day${i.checkins.days === 1 ? "" : "s"}${i.checkins.avgScore !== null ? ` · average Smarty Score <strong>${i.checkins.avgScore}</strong>` : ""}` : "No check-ins this week."))}
${section("🗓️ Coming up", i.upcoming.length ? list(i.upcoming.map((u) => `${fmtDay(u.date)}: ${e(u.name)}`)) : para("Nothing scheduled yet."))}
${section("🧠 Smarty Coach suggestions", tips)}
<div style="text-align:center;margin-top:28px;"><a href="${SITE_URL}/logbook?view=list#insights" style="display:inline-block;background-color:#29B6D2;background-image:linear-gradient(135deg,#29B6D2,#5CD3E8);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Open my Insights</a></div>
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px 24px;text-align:center;border-top:1px solid #eee;">
<p style="color:#888;margin:0;font-size:12px;line-height:1.6;">You're receiving this weekly report because you train with SMARTYGYM. You can switch these emails off in My Account.</p>
<p style="font-size:13px;color:#666;line-height:1.6;margin:16px 0 12px;">SMARTYGYM &ndash; Your Expert Fitness Partner<br />Designed by HARIS FALAS, Sports Scientist (CSCS Certified)</p>
<a href="${SITE_URL}/privacy" style="font-size:12px;color:#999;text-decoration:underline;">Privacy Policy</a></td></tr>
</table></td></tr></table></body></html>`;
}

export type SendEmail = (item: { to: string; subject: string; html: string; idempotencyKey: string }) => Promise<void>;

/** One email per call; the provider ignores a repeat with the same Idempotency-Key. */
export const resendSend: SendEmail = async (x) => {
  const apiKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!apiKey || !resendKey) throw new Error("Email sending is not configured");
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": resendKey,
      "Idempotency-Key": x.idempotencyKey,
    },
    body: JSON.stringify({ from: FROM, to: [x.to], subject: x.subject, html: x.html }),
  });
  if (!res.ok) throw new Error(`Resend request failed [${res.status}]: ${await res.text()}`);
};

export async function sendInsightsPreview(db: DB, userId: string, to: string) {
  const { data: p } = await db.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  const first = String((p as { display_name?: string } | null)?.display_name ?? "").trim().split(/\s+/)[0] || "there";
  const i = await loadWeeklyInsights(db, userId, "previous");
  const charts = await prepareEmailCharts(db, i);
  await resendSend({ to, subject: insightsSubject(i), html: await insightsEmailHtml(i, first, charts), idempotencyKey: `insights-preview:${userId}:${Date.now()}` });
  return i;
}

/** True once it is Monday at/after `hour` in the member's timezone (or later in that week). */
export function memberDue(now: Date, tz: string, hour: number): boolean {
  const today = localDateISO(now, tz);
  if (mondayOf(today) !== today) return true; // Tue–Sun: catch up on anything still pending
  return localHour(now, tz) >= hour;
}

/**
 * Weekly report, in each member's own timezone, from Monday at the configured
 * local hour. Inbox and email are tracked separately per member and week:
 * inbox = notifications(user_id, `insights-inbox:{week}`) — unique;
 * email = broadcast_email_sends(user_id, `insights-email:{week}`) 'sending' → 'sent'.
 * A retry re-sends anything not 'sent' with the same Idempotency-Key, so a
 * crash after the provider accepted an email can never deliver it twice.
 */
export async function runWeeklyInsights(
  db: DB,
  opts: { now?: Date; hour?: number; send?: SendEmail } = {},
): Promise<{ inbox: number; emails: number; remaining: number; failures: string[] }> {
  const now = opts.now ?? new Date();
  const hour = opts.hour ?? 6;
  const send = opts.send ?? resendSend;
  const { data: done } = await db.from("workouts").select("user_id").eq("status", "completed").is("deleted_at", null).limit(50000);
  const userIds = [...new Set(((done as { user_id: string }[] | null) ?? []).map((r) => r.user_id))];
  if (!userIds.length) return { inbox: 0, emails: 0, remaining: 0, failures: [] };
  const { data: profiles } = await db.from("profiles").select("id,email,display_name,timezone,email_weekly_insights").in("id", userIds);
  type P = { id: string; email: string | null; display_name: string | null; timezone: string | null; email_weekly_insights: boolean };
  const due = ((profiles as P[] | null) ?? [])
    .filter((p) => memberDue(now, p.timezone || DEFAULT_TZ, hour))
    .map((p) => ({ ...p, week: reportWeekStart(now, p.timezone || DEFAULT_TZ, "previous") }));
  if (!due.length) return { inbox: 0, emails: 0, remaining: 0, failures: [] };

  const weeks = [...new Set(due.map((p) => p.week))];
  const { data: inboxRows } = await db.from("notifications").select("user_id,dedupe_key,body").in("dedupe_key", weeks.map(inboxKey)).limit(50000);
  const { data: emailRows } = await db.from("broadcast_email_sends").select("user_id,dedupe_key,state").in("dedupe_key", weeks.map(emailKey)).limit(50000);
  const inboxDone = new Set(((inboxRows as { user_id: string; dedupe_key: string }[] | null) ?? []).map((r) => `${r.user_id}|${r.dedupe_key}`));
  const emailSent = new Set(((emailRows as { user_id: string; dedupe_key: string; state: string }[] | null) ?? []).filter((r) => r.state === "sent").map((r) => `${r.user_id}|${r.dedupe_key}`));

  const pending = due.filter((p) => {
    const needInbox = !inboxDone.has(`${p.id}|${inboxKey(p.week)}`);
    const needEmail = Boolean(p.email) && p.email_weekly_insights !== false && !emailSent.has(`${p.id}|${emailKey(p.week)}`);
    return needInbox || needEmail;
  });
  const slice = pending.slice(0, PER_RUN);

  let inbox = 0;
  let emails = 0;
  const failures: string[] = [];
  for (const p of slice) {
    try {
      const saved = (inboxRows as {user_id:string;dedupe_key:string;body:string|null}[] | null)?.find(r => r.user_id === p.id && r.dedupe_key === inboxKey(p.week));
      const i = decodeInsightMessage(saved?.body ?? null).report ?? await loadWeeklyInsights(db, p.id, "previous", now);
      const first = String(p.display_name ?? "").trim().split(/\s+/)[0] || "there";
      if (!inboxDone.has(`${p.id}|${inboxKey(p.week)}`)) {
        const content = insightsInboxContent(i, first);
        const { error } = await db.from("notifications").insert({ user_id: p.id, kind: "weekly_insights", title: content.title, body: content.body, dedupe_key: inboxKey(p.week) } as never);
        if (error && error.code !== "23505") throw new Error(error.message);
        if (!error) inbox++;
      }
      const ek = emailKey(p.week);
      if (p.email && p.email_weekly_insights !== false && !emailSent.has(`${p.id}|${ek}`)) {
        const { error: markErr } = await db
          .from("broadcast_email_sends")
          .upsert({ user_id: p.id, dedupe_key: ek, state: "sending" } as never, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
        if (markErr) throw new Error(markErr.message);
        await send({ to: p.email, subject: insightsSubject(i), html: await insightsEmailHtml(i, first, await prepareEmailCharts(db, i)), idempotencyKey: `${ek}:${p.id}` });
        const { error: doneErr } = await db.from("broadcast_email_sends").update({ state: "sent", sent_at: new Date().toISOString() } as never).eq("user_id", p.id).eq("dedupe_key", ek);
        if (doneErr) throw new Error(doneErr.message);
        emails++;
      }
    } catch (e) {
      failures.push(`${p.id.slice(0, 8)}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return { inbox, emails, remaining: pending.length - slice.length + failures.length, failures };
}

async function prepareEmailCharts(db: DB, i: WeeklyInsights) {
  const [activity, load] = await Promise.all([
    storeEmailChart(db, i.days.map(d => ({ label: d.label, value: d.count })), [58,185,214]),
    storeEmailChart(db, i.load.recent.map(r => ({ label: fmtDay(r.weekStart), value: r.sessions })), [117,76,194]),
  ]);
  return { activity, load };
}
