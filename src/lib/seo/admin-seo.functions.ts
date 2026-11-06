import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
  return supabaseAdmin as any;
}

const SITEMAPS = ["sitemap-index.xml", "sitemap.xml", "sitemap-exercises.xml", "image-sitemap.xml"];

/** Overview for the Admin SEO section. Read-only. */
export const adminSeoOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const { collectPublicUrls, LAST_PUSH_SETTING } = await import("@/lib/seo/indexnow-bulk.server");
    const { SITE_URL } = await import("@/lib/seo/site");
    const { INDEXNOW_KEY } = await import("@/lib/seo/indexnow.server");
    const [{ urls, exercises, pages }, last, sent, pending] = await Promise.all([
      collectPublicUrls(),
      db.from("app_settings").select("value").eq("key", LAST_PUSH_SETTING).maybeSingle(),
      db.from("seo_indexnow_queue").select("url", { count: "exact", head: true }).eq("state", "sent"),
      db.from("seo_indexnow_queue").select("url", { count: "exact", head: true }).eq("state", "pending"),
    ]);
    let keyFileOk = false;
    try {
      const r = await fetch(`${SITE_URL}/${INDEXNOW_KEY}.txt`, { signal: AbortSignal.timeout(10000) });
      keyFileOk = r.ok && (await r.text()).trim() === INDEXNOW_KEY;
    } catch {
      keyFileOk = false;
    }
    return {
      totalUrls: urls.length,
      exercises,
      pages,
      sentCount: sent.count ?? 0,
      pendingCount: pending.count ?? 0,
      keyFileOk,
      lastPush: (last.data?.value ?? null) as import("@/lib/seo/indexnow-bulk.server").BulkPushResult | null,
    };
  });

/** One click: send every public address (pages + all exercise guides) to IndexNow. */
export const adminSeoPushAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { onlyNew?: boolean }) => ({ onlyNew: Boolean(d?.onlyNew) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { collectPublicUrls, findUnsentUrls, pushUrls } = await import("@/lib/seo/indexnow-bulk.server");
    const { urls } = await collectPublicUrls();
    const list = data.onlyNew ? await findUnsentUrls(urls) : urls;
    return pushUrls(list, data.onlyNew ? "new" : "all");
  });

/** Runs the same SEO health checks as the weekly job, on demand. Read-only. */
export const adminSeoHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const { runSeoHealth } = await import("@/lib/seo/seo-health.server");
    return runSeoHealth(db);
  });

async function gsc(path: string, method = "GET") {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovable || !conn) throw new Error("Google Search Console is not connected");
  const res = await fetch(`https://connector-gateway.lovable.dev/google_search_console${path}`, {
    method,
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google Search Console [${res.status}]: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function resolveProperty(): Promise<string> {
  const { SITE_URL } = await import("@/lib/seo/site");
  const { siteEntry = [] } = (await gsc("/webmasters/v3/sites")) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
  };
  const verified = siteEntry.filter((e) => e.permissionLevel !== "siteUnverifiedUser");
  const host = new URL(SITE_URL).hostname;
  const exact = verified.find((e) => e.siteUrl === `${SITE_URL}/`);
  const covering = verified.find((e) =>
    e.siteUrl.startsWith("sc-domain:")
      ? host === e.siteUrl.slice(10) || host.endsWith(`.${e.siteUrl.slice(10)}`)
      : `${SITE_URL}/`.startsWith(e.siteUrl),
  );
  const pick = exact ?? covering;
  if (!pick) throw new Error("No verified Google Search Console property covers smartygym.com");
  return pick.siteUrl;
}

/** Google sitemap status, read live from Search Console. */
export const adminSeoSitemapStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { SITE_URL } = await import("@/lib/seo/site");
    const site = await resolveProperty();
    const out = [];
    for (const name of SITEMAPS) {
      const feed = `${SITE_URL}/${name}`;
      try {
        const s = await gsc(`/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(feed)}`);
        out.push({
          name,
          lastSubmitted: s.lastSubmitted ?? null,
          lastDownloaded: s.lastDownloaded ?? null,
          errors: Number(s.errors ?? 0),
          warnings: Number(s.warnings ?? 0),
          submitted: (s.contents ?? []).reduce((n: number, c: { submitted?: string }) => n + Number(c.submitted ?? 0), 0),
        });
      } catch (e) {
        out.push({ name, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return out as {
      name: string; lastSubmitted?: string | null; lastDownloaded?: string | null;
      errors?: number; warnings?: number; submitted?: number; error?: string;
    }[];
  });

/** Re-submits the four sitemaps to Google so it re-reads them. */
export const adminSeoResubmitSitemaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { SITE_URL } = await import("@/lib/seo/site");
    const site = await resolveProperty();
    const out: { name: string; ok: boolean; detail: string }[] = [];
    for (const name of SITEMAPS) {
      try {
        await gsc(
          `/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(`${SITE_URL}/${name}`)}`,
          "PUT",
        );
        out.push({ name, ok: true, detail: "Submitted" });
      } catch (e) {
        out.push({ name, ok: false, detail: e instanceof Error ? e.message : String(e) });
      }
    }
    return out;
  });
