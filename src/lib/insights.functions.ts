import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const TARGET = "https://smartygym.com/";

export type InsightRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchTypeTotal = { type: string; label: string; clicks: number; impressions: number };

export type InsightsReport = {
  siteUrl: string;
  from: string;
  to: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  daily: InsightRow[];
  searchTypes: SearchTypeTotal[];
  queries: InsightRow[];
  pages: InsightRow[];
  countries: InsightRow[];
  devices: InsightRow[];
};

const SEARCH_TYPES: { type: string; label: string }[] = [
  { type: "web", label: "Google Search (web)" },
  { type: "image", label: "Google Images" },
  { type: "video", label: "Google Videos" },
  { type: "news", label: "Google News tab" },
  { type: "discover", label: "Google Discover" },
  { type: "googleNews", label: "Google News app" },
];

function headers() {
  const lovable = process.env.LOVABLE_API_KEY;
  const conn = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovable || !conn) throw new Error("Google Search Console is not connected");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn };
}

function covers(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const d = siteUrl.slice(10).toLowerCase();
    const h = target.hostname.toLowerCase();
    return h === d || h.endsWith(`.${d}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

async function resolveSite(): Promise<string> {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: headers() });
  if (!res.ok) throw new Error(`Could not list properties [${res.status}]: ${await res.text()}`);
  const { siteEntry = [] } = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
  };
  const target = new URL(TARGET);
  const matches = siteEntry.filter(
    (e) => e.permissionLevel !== "siteUnverifiedUser" && covers(e.siteUrl, target),
  );
  if (!matches.length) throw new Error("No verified Search Console property covers smartygym.com");
  const exact = matches.find((m) => m.siteUrl === TARGET);
  return (exact ?? matches[0]!).siteUrl;
}

type ApiRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(siteUrl: string, body: Record<string, unknown>): Promise<ApiRow[]> {
  const res = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (res.status === 403) throw new Error("The connected Google account cannot read this property");
  if (!res.ok) throw new Error(`Search Console query failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { rows?: ApiRow[] };
  return json.rows ?? [];
}

const toRow = (r: ApiRow): InsightRow => ({
  key: r.keys?.[0] ?? "",
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: r.ctr,
  position: r.position,
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

/** Real Google Search Console numbers for smartygym.com over a date range. */
export const adminGetInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.from) || !/^\d{4}-\d{2}-\d{2}$/.test(d.to))
      throw new Error("Invalid date range");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ report: InsightsReport } | { error: string }> => {
    try {
      await assertAdmin(context.userId);
      const siteUrl = await resolveSite();
      const base = { startDate: data.from, endDate: data.to, dataState: "all" };
      const [totalRows, daily, queries, pages, countries, devices, ...types] = await Promise.all([
        query(siteUrl, { ...base }),
        query(siteUrl, { ...base, dimensions: ["date"], rowLimit: 1000 }),
        query(siteUrl, { ...base, dimensions: ["query"], rowLimit: 25 }),
        query(siteUrl, { ...base, dimensions: ["page"], rowLimit: 25 }),
        query(siteUrl, { ...base, dimensions: ["country"], rowLimit: 15 }),
        query(siteUrl, { ...base, dimensions: ["device"], rowLimit: 5 }),
        ...SEARCH_TYPES.map((t) => query(siteUrl, { ...base, type: t.type }).catch(() => [])),
      ]);
      const t = totalRows[0];
      return {
        report: {
          siteUrl,
          from: data.from,
          to: data.to,
          totals: {
            clicks: t?.clicks ?? 0,
            impressions: t?.impressions ?? 0,
            ctr: t?.ctr ?? 0,
            position: t?.position ?? 0,
          },
          daily: daily.map(toRow).sort((a, b) => a.key.localeCompare(b.key)),
          searchTypes: SEARCH_TYPES.map((s, i) => ({
            ...s,
            clicks: types[i]?.[0]?.clicks ?? 0,
            impressions: types[i]?.[0]?.impressions ?? 0,
          })),
          queries: queries.map(toRow),
          pages: pages.map(toRow),
          countries: countries.map(toRow),
          devices: devices.map(toRow),
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Insights request failed" };
    }
  });
