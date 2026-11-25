import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizePartnerCode } from "./commission";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function assertAdmin(userId: string) {
  const db = await admin();
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
  return db;
}

const codeSchema = z.string().trim().min(2).max(31);

/* ---------------- Public: link click ---------------- */
export const trackReferralClick = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: codeSchema }).parse(d))
  .handler(async ({ data }) => {
    const code = normalizePartnerCode(data.code);
    if (!code) return { ok: false };
    const db = await admin();
    await db.rpc("record_partner_click", { p_code: code });
    return { ok: true };
  });

/* ---------------- Signed-in: attach referral to the member ---------------- */
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: codeSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const code = normalizePartnerCode(data.code);
    if (!code) return { ok: false, reason: "invalid" };
    const db = await admin();
    const userId = context.userId;
    const { data: existing } = await db.from("partner_referrals").select("user_id").eq("user_id", userId).maybeSingle();
    if (existing) return { ok: false, reason: "already" };
    const { data: partner } = await db.from("partners").select("id,user_id,status").eq("code", code).maybeSingle();
    if (!partner || partner.status !== "active") return { ok: false, reason: "unknown" };
    if (partner.user_id === userId) return { ok: false, reason: "self" };
    // Only new customers: anyone who already paid through Stripe stays organic.
    const { data: paid } = await db.from("subscriptions").select("id").eq("user_id", userId).eq("provider", "stripe").limit(1).maybeSingle();
    if (paid) return { ok: false, reason: "existing_customer" };
    const { error } = await db.from("partner_referrals").insert({ user_id: userId, partner_id: partner.id, code });
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Admin ---------------- */
export type PartnerRow = {
  id: string; name: string; email: string; code: string; user_id: string | null; instagram: string | null;
  tiktok: string | null; status: string; share_rate: number; vat_rate: number; click_count: number;
  media_kit_url: string | null; notes: string | null; created_at: string;
  signups: number; active: number; newCount: number; renewals: number; earnedCents: number; paidCents: number; monthCents: number;
};
export type ContactRow = {
  id: string; name: string; email: string | null; instagram: string | null; tiktok: string | null; youtube: string | null;
  country: string | null; niche: string | null; followers: string | null; status: string; notes: string | null; partner_id: string | null;
};

export const adminListCollaborations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const [{ data: contacts }, { data: partners }, { data: refs }, { data: comms }, { data: pays }] = await Promise.all([
      db.from("partner_contacts").select("*").order("created_at", { ascending: true }),
      db.from("partners").select("*").order("created_at", { ascending: false }),
      db.from("partner_referrals").select("user_id,partner_id"),
      db.from("partner_commissions").select("partner_id,kind,commission_cents,paid_at,environment").eq("environment", "live"),
      db.from("partner_payouts").select("partner_id,amount_cents"),
    ]);
    const refUsers = (refs ?? []).map((r: any) => r.user_id);
    const activeSet = new Set<string>();
    if (refUsers.length) {
      const { data: subs } = await db.from("subscriptions").select("user_id,status,current_period_end")
        .eq("provider", "stripe").eq("environment", "live").in("user_id", refUsers);
      const now = Date.now();
      for (const s of subs ?? []) {
        if (["active", "trialing", "past_due"].includes(s.status) && (!s.current_period_end || Date.parse(s.current_period_end) > now)) activeSet.add(s.user_id);
      }
    }
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const rows: PartnerRow[] = (partners ?? []).map((p: any) => {
      const mine = (refs ?? []).filter((r: any) => r.partner_id === p.id);
      const c = (comms ?? []).filter((x: any) => x.partner_id === p.id);
      const earned = c.reduce((s: number, x: any) => s + x.commission_cents, 0);
      const paid = (pays ?? []).filter((x: any) => x.partner_id === p.id).reduce((s: number, x: any) => s + x.amount_cents, 0);
      return {
        ...p, share_rate: Number(p.share_rate), vat_rate: Number(p.vat_rate),
        signups: mine.length,
        active: mine.filter((r: any) => activeSet.has(r.user_id)).length,
        newCount: c.filter((x: any) => x.kind === "new").length,
        renewals: c.filter((x: any) => x.kind === "renewal").length,
        earnedCents: earned, paidCents: paid,
        monthCents: c.filter((x: any) => Date.parse(x.paid_at) >= monthStart.getTime()).reduce((s: number, x: any) => s + x.commission_cents, 0),
      };
    });
    return { contacts: (contacts ?? []) as ContactRow[], partners: rows };
  });

/** Loads the starter creator list once, only while Contacts is empty. */
export const adminSeedSuggestedContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const { count } = await db.from("partner_contacts").select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { added: 0 };
    const { SUGGESTED_CREATORS } = await import("./suggested-creators");
    const rows = SUGGESTED_CREATORS.map((c) => ({ name: c.name, instagram: c.instagram, tiktok: c.tiktok ?? null, youtube: c.youtube ?? null, country: c.country, niche: c.niche, followers: c.followers }));
    const { error } = await db.from("partner_contacts").insert(rows);
    if (error) return { error: error.message };
    return { added: rows.length };
  });

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(200).optional().nullable(),
  instagram: z.string().trim().max(300).optional().nullable(),
  tiktok: z.string().trim().max(300).optional().nullable(),
  youtube: z.string().trim().max(300).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  niche: z.string().trim().max(120).optional().nullable(),
  followers: z.string().trim().max(40).optional().nullable(),
  status: z.enum(["to_contact", "contacted", "in_discussion", "active_partner", "declined"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const adminSaveContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const row = { ...rest, updated_at: new Date().toISOString() };
    const res = id ? await db.from("partner_contacts").update(row).eq("id", id) : await db.from("partner_contacts").insert(row);
    if (res.error) return { error: res.error.message };
    return { ok: true };
  });

export const adminDeleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("partner_contacts").delete().eq("id", data.id);
    return error ? { error: error.message } : { ok: true };
  });

export const adminCheckPartnerCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().max(40), exceptId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const code = normalizePartnerCode(data.code);
    if (!code) return { available: false, reason: "Use 2–31 lowercase letters, numbers, - or _." };
    let q = db.from("partners").select("id").eq("code", code);
    if (data.exceptId) q = q.neq("id", data.exceptId);
    const { data: hit } = await q.maybeSingle();
    return hit ? { available: false, reason: `“${code}” is already taken.` } : { available: true };
  });

/**
 * Creates a partner with a unique code. Creates (or links) their SmartyGym account
 * and gives lifetime complimentary access. New accounts must change the temporary password.
 */
export const adminCreatePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().toLowerCase().email(),
      code: z.string().max(40),
      password: z.string().min(8).max(100),
      instagram: z.string().trim().max(300).optional().nullable(),
      tiktok: z.string().trim().max(300).optional().nullable(),
      contactId: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; code: string; createdAccount: boolean } | { error: string }> => {
    try {
      const db = await assertAdmin(context.userId);
      const code = normalizePartnerCode(data.code);
      if (!code) return { error: "The code must be 2–31 lowercase letters, numbers, - or _." };
      const { data: taken } = await db.from("partners").select("id").eq("code", code).maybeSingle();
      if (taken) return { error: `The code “${code}” is already taken.` };
      const { data: emailTaken } = await db.from("partners").select("id").ilike("email", data.email).maybeSingle();
      if (emailTaken) return { error: "This email is already a partner." };

      let userId: string | null = null;
      let createdAccount = false;
      const { data: profile } = await db.from("profiles").select("id").ilike("email", data.email).maybeSingle();
      if (profile) {
        userId = profile.id;
      } else {
        const { data: created, error } = await db.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          app_metadata: { must_change_password: true, created_by_admin: true, partner: true },
        });
        if (error || !created?.user) return { error: error?.message ?? "Could not create the partner account." };
        userId = created.user.id;
        createdAccount = true;
      }

      // Lifetime complimentary access (does not count as revenue).
      const { data: grant } = await db.from("subscriptions").select("id").eq("user_id", userId).eq("provider", "admin_grant").maybeSingle();
      const grantRow = { status: "active", environment: "live", current_period_start: new Date().toISOString(), current_period_end: "2099-12-31T00:00:00.000Z" };
      const g = grant
        ? await db.from("subscriptions").update(grantRow).eq("id", grant.id)
        : await db.from("subscriptions").insert({ user_id: userId, provider: "admin_grant", ...grantRow });
      if (g.error) return { error: g.error.message };

      const { data: partner, error: pErr } = await db.from("partners").insert({
        name: data.name, email: data.email, code, user_id: userId,
        instagram: data.instagram ?? null, tiktok: data.tiktok ?? null,
      }).select("id").single();
      if (pErr) return { error: pErr.message };
      if (data.contactId) {
        await db.from("partner_contacts").update({ status: "active_partner", partner_id: partner.id, email: data.email }).eq("id", data.contactId);
      }
      return { ok: true, code, createdAccount };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not create partner" };
    }
  });

export const adminUpdatePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      code: z.string().max(40).optional(),
      status: z.enum(["active", "paused", "ended"]).optional(),
      media_kit_url: z.string().trim().max(500).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.code !== undefined) {
      const code = normalizePartnerCode(data.code);
      if (!code) return { error: "The code must be 2–31 lowercase letters, numbers, - or _." };
      const { data: hit } = await db.from("partners").select("id").eq("code", code).neq("id", data.id).maybeSingle();
      if (hit) return { error: `The code “${code}” is already taken.` };
      patch["code"] = code;
    }
    if (data.status) patch["status"] = data.status;
    if (data.media_kit_url !== undefined) patch["media_kit_url"] = data.media_kit_url || null;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    const { error } = await db.from("partners").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    // Keep stored referral codes in step so history stays attached.
    if (patch["code"]) await db.from("partner_referrals").update({ code: patch["code"] }).eq("partner_id", data.id);
    return { ok: true };
  });

export const adminRecordPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      partnerId: z.string().uuid(),
      amountCents: z.number().int().positive().max(100_000_000),
      method: z.string().trim().min(1).max(60),
      reference: z.string().trim().max(200).optional().nullable(),
      periodLabel: z.string().trim().max(60).optional().nullable(),
      notes: z.string().max(1000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const now = new Date();
    const receipt = `SG-P-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const { error } = await db.from("partner_payouts").insert({
      partner_id: data.partnerId, amount_cents: data.amountCents, method: data.method,
      reference: data.reference ?? null, period_label: data.periodLabel ?? null, notes: data.notes ?? null, receipt_number: receipt,
    });
    return error ? { error: error.message } : { ok: true, receipt };
  });

export type LedgerEntry = { id: string; kind: string; gross_cents: number; net_cents: number; commission_cents: number; paid_at: string; environment: string };
export type PayoutEntry = { id: string; amount_cents: number; method: string; reference: string | null; receipt_number: string; period_label: string | null; paid_at: string };

export const adminPartnerLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ partnerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const [{ data: comms }, { data: pays }, { data: refs }] = await Promise.all([
      db.from("partner_commissions").select("id,kind,gross_cents,net_cents,commission_cents,paid_at,environment").eq("partner_id", data.partnerId).order("paid_at", { ascending: false }).limit(500),
      db.from("partner_payouts").select("*").eq("partner_id", data.partnerId).order("paid_at", { ascending: false }),
      db.from("partner_referrals").select("user_id,created_at").eq("partner_id", data.partnerId).order("created_at", { ascending: false }).limit(500),
    ]);
    const ids = (refs ?? []).map((r: any) => r.user_id);
    const { data: profiles } = ids.length ? await db.from("profiles").select("id,email,display_name").in("id", ids) : { data: [] };
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return {
      commissions: (comms ?? []) as LedgerEntry[],
      payouts: (pays ?? []) as PayoutEntry[],
      members: (refs ?? []).map((r: any) => ({ joined: r.created_at, email: (byId.get(r.user_id) as any)?.email ?? "—", name: (byId.get(r.user_id) as any)?.display_name ?? null })),
    };
  });

/** userId → partner name, for the Customers badges. */
export const adminPartnerAttribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const [{ data: refs }, { data: partners }] = await Promise.all([
      db.from("partner_referrals").select("user_id,partner_id"),
      db.from("partners").select("id,name,user_id"),
    ]);
    const names = new Map((partners ?? []).map((p: any) => [p.id, p.name]));
    const referred: Record<string, string> = {};
    for (const r of refs ?? []) referred[r.user_id] = String(names.get(r.partner_id) ?? "Partner");
    const partnerAccounts: Record<string, string> = {};
    for (const p of partners ?? []) if (p.user_id) partnerAccounts[p.user_id] = p.name;
    return { referred, partnerAccounts };
  });

/* ---------------- Partner's own dashboard ---------------- */
export const getMyPartnerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Row-level security returns only this partner's own rows.
    const { data: partner } = await (context.supabase as any).from("partners")
      .select("id,name,code,status,share_rate,vat_rate,click_count,media_kit_url").eq("user_id", context.userId).maybeSingle();
    if (!partner) return { partner: null };
    const [{ data: comms }, { data: pays }] = await Promise.all([
      (context.supabase as any).from("partner_commissions").select("id,kind,gross_cents,net_cents,commission_cents,paid_at,environment")
        .eq("partner_id", partner.id).eq("environment", "live").order("paid_at", { ascending: false }).limit(500),
      (context.supabase as any).from("partner_payouts").select("id,amount_cents,method,reference,receipt_number,period_label,paid_at")
        .eq("partner_id", partner.id).order("paid_at", { ascending: false }),
    ]);
    // Counts only — never other members' identities.
    const db = await admin();
    const { data: refs } = await db.from("partner_referrals").select("user_id").eq("partner_id", partner.id);
    const ids = (refs ?? []).map((r: any) => r.user_id);
    let active = 0;
    if (ids.length) {
      const { data: subs } = await db.from("subscriptions").select("user_id,status,current_period_end").eq("provider", "stripe").eq("environment", "live").in("user_id", ids);
      const now = Date.now();
      active = new Set((subs ?? []).filter((s: any) => ["active", "trialing", "past_due"].includes(s.status) && (!s.current_period_end || Date.parse(s.current_period_end) > now)).map((s: any) => s.user_id)).size;
    }
    return {
      partner: { ...partner, share_rate: Number(partner.share_rate), vat_rate: Number(partner.vat_rate) },
      signups: ids.length,
      active,
      commissions: (comms ?? []) as LedgerEntry[],
      payouts: (pays ?? []) as PayoutEntry[],
    };
  });

/** Sends one personal invitation to a saved creator's own email (recipient read from Contacts, never from the browser). */
export const adminSendInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contactId: z.string().uuid(), subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { data: c } = await db.from("partner_contacts").select("id, email, status").eq("id", data.contactId).maybeSingle();
    const to = (c?.email ?? "").trim();
    if (!c || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "Add a valid email for this creator first." };
    const apiKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!apiKey || !resendKey) return { error: "Email sending is not configured." };
    const { escapeHtml } = await import("../broadcast-email.server");
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:600px">${data.body
      .split(/\n\s*\n/).map((p) => `<p style="margin:0 0 14px">${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`).join("")}</div>`;
    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": resendKey },
      body: JSON.stringify({ from: "Haris Falas <no-reply@smartygym.com>", to: [to], reply_to: "smartygym@outlook.com", subject: data.subject, html, text: data.body }),
    });
    if (!res.ok) { console.error("invitation send failed", res.status, await res.text()); return { error: "The email could not be sent. Try again or use Outlook." }; }
    if (c.status === "to_contact") await db.from("partner_contacts").update({ status: "contacted", updated_at: new Date().toISOString() }).eq("id", c.id);
    return { ok: true };
  });
