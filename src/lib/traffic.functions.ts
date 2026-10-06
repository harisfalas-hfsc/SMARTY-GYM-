import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Classify a visit into a human-readable traffic source. */
export function classifySource(referrerHost: string | null, utmSource: string | null): string {
  const raw = (utmSource || referrerHost || "").toLowerCase();
  if (!raw) return "direct";
  if (raw.includes("google")) return "google";
  if (raw.includes("instagram")) return "instagram";
  if (raw.includes("tiktok")) return "tiktok";
  if (raw.includes("facebook") || raw.includes("fb.") || raw === "fb") return "facebook";
  if (raw.includes("youtube") || raw.includes("youtu.be")) return "youtube";
  if (raw.includes("twitter") || raw === "x" || raw.includes("x.com")) return "x";
  if (raw.includes("linkedin")) return "linkedin";
  if (raw.includes("pinterest")) return "pinterest";
  if (raw.includes("bing")) return "bing";
  if (raw.includes("smartygym")) return "direct"; // internal navigation
  return "other";
}

export const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  bing: "Bing",
  direct: "Direct / bookmark",
  other: "Other websites",
};

const SESSION_RE = /^[a-zA-Z0-9-]{8,64}$/;

/** Record one page visit. Public (no login needed) — visitors count too. */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((d: {
    sessionId: string;
    path: string;
    referrerHost?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
  }) => {
    if (!SESSION_RE.test(d.sessionId)) throw new Error("Invalid session");
    if (!d.path || d.path.length > 300 || !d.path.startsWith("/")) throw new Error("Invalid path");
    const clean = (v?: string | null) => (v && v.length <= 200 ? v : null);
    return {
      sessionId: d.sessionId,
      path: d.path,
      referrerHost: clean(d.referrerHost),
      utmSource: clean(d.utmSource),
      utmMedium: clean(d.utmMedium),
      utmCampaign: clean(d.utmCampaign),
    };
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_visits").insert({
        session_id: data.sessionId,
        path: data.path,
        source: classifySource(data.referrerHost ?? null, data.utmSource ?? null),
        referrer_host: data.referrerHost,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
}

export type TrafficReport = {
  from: string;
  to: string;
  totalVisits: number;
  uniqueVisitors: number;
  bySource: { source: string; label: string; visits: number; visitors: number }[];
  daily: { date: string; visits: number }[];
  topPages: { path: string; visits: number }[];
};

/** Real first-party traffic numbers from the site's own visit log. */
export const adminGetTraffic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.from) || !/^\d{4}-\d{2}-\d{2}$/.test(d.to))
      throw new Error("Invalid date range");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ report: TrafficReport } | { error: string }> => {
    try {
      await assertAdmin(context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const fromIso = `${data.from}T00:00:00.000Z`;
      const toIso = `${data.to}T23:59:59.999Z`;
      const { data: rows, error } = await supabaseAdmin
        .from("site_visits")
        .select("created_at, session_id, path, source")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: true })
        .limit(50000);
      if (error) throw new Error(error.message);

      const visits = rows ?? [];
      const visitors = new Set(visits.map((v) => v.session_id));
      const sourceMap = new Map<string, { visits: number; sessions: Set<string> }>();
      const dayMap = new Map<string, number>();
      const pageMap = new Map<string, number>();
      for (const v of visits) {
        const s = sourceMap.get(v.source) ?? { visits: 0, sessions: new Set<string>() };
        s.visits += 1;
        s.sessions.add(v.session_id);
        sourceMap.set(v.source, s);
        const day = v.created_at.slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
        pageMap.set(v.path, (pageMap.get(v.path) ?? 0) + 1);
      }
      return {
        report: {
          from: data.from,
          to: data.to,
          totalVisits: visits.length,
          uniqueVisitors: visitors.size,
          bySource: [...sourceMap.entries()]
            .map(([source, s]) => ({
              source,
              label: SOURCE_LABELS[source] ?? source,
              visits: s.visits,
              visitors: s.sessions.size,
            }))
            .sort((a, b) => b.visits - a.visits),
          daily: [...dayMap.entries()]
            .map(([date, v]) => ({ date, visits: v }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          topPages: [...pageMap.entries()]
            .map(([path, v]) => ({ path, visits: v }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 15),
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Traffic request failed" };
    }
  });
