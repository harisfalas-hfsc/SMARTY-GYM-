import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/seo/site";
import { publicPages } from "@/lib/seo/page-seo";
import { PRIVATE_PREFIXES } from "@/lib/seo/route-inventory";
import { readKeywordIndex } from "@/lib/seo/keyword-index.server";

/**
 * Weekly SEO health checks, reported in the seo-refresh job. Read-only:
 * nothing here changes pages or content. Each item becomes one line of the
 * admin report (PASS / WARNING / ERROR).
 */
export interface SeoHealthItem {
  number: number;
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

const GSC = "https://connector-gateway.lovable.dev/google_search_console";
const GSC_SITE = `${SITE_URL}/`;

/** Search themes people use for this kind of product (intent, not competitor names). */
const SEARCH_THEMES = [
  "workout builder", "create your own workout", "exercise library", "home workout",
  "no equipment workout", "bodyweight workout", "small space workout", "strength training",
  "muscle building", "mobility", "stretching", "cardio workout", "hiit", "pilates",
  "recovery", "workout tracking", "training log", "workout of the day", "kettlebell workout",
  "dumbbell workout", "fat loss workout", "beginner workout", "workout timer", "1rm calculator",
  "sports science training", "online personal training",
];

async function fetchText(url: string, ms = 15000): Promise<{ status: number; body: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "SmartyGym-SEO-Health/1.0" } });
  return { status: res.status, body: await res.text() };
}

function dupes(values: string[]): string[] {
  const seen = new Map<string, number>();
  for (const v of values.map((x) => x.trim().toLowerCase()).filter(Boolean)) seen.set(v, (seen.get(v) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([v, n]) => `${v} (×${n})`);
}

async function gsc(path: string, init?: RequestInit): Promise<unknown> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovable || !conn) throw new Error("Search Console is not connected");
  const res = await fetch(`${GSC}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Search Console [${res.status}]: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

export async function runSeoHealth(db: SupabaseClient): Promise<SeoHealthItem[]> {
  const items: SeoHealthItem[] = [];
  const add = (key: string, label: string, status: SeoHealthItem["status"], detail: string) =>
    items.push({ number: items.length + 1, key, label, status, detail });

  // 1. Sitemap health (live public sitemap).
  let locs: string[] = [];
  try {
    const { status, body } = await fetchText(`${SITE_URL}/sitemap.xml`);
    locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    const dup = locs.length - new Set(locs).size;
    const priv = locs.filter((u) => PRIVATE_PREFIXES.some((p) => new URL(u).pathname.startsWith(p)) || /\/w\//.test(u));
    const bad = locs.filter((u) => !u.startsWith(`${SITE_URL}/`));
    const ok = status === 200 && locs.length > 0 && !dup && !priv.length && !bad.length;
    add("sitemap", "Sitemap health", ok ? "pass" : "fail",
      `HTTP ${status}, ${locs.length} public addresses, ${dup} duplicates, ${priv.length} private, ${bad.length} invalid`);
  } catch (e) {
    add("sitemap", "Sitemap health", "fail", `Sitemap could not be read: ${e instanceof Error ? e.message : e}`);
  }

  // 2. Duplicate metadata across public pages, articles and workout pages.
  try {
    const pages = publicPages(false);
    const { data: arts, error } = await db.from("blog_articles")
      .select("title,seo_title,seo_description,excerpt").eq("is_published", true).limit(2000);
    if (error) throw error;
    const { listPublicSmartyWorkouts, smartyWorkoutSearchData } = await import("@/lib/seo/smarty-workout-public.server");
    const workouts = (await listPublicSmartyWorkouts()).map(smartyWorkoutSearchData);
    const titles = [...pages.map((p) => p.title), ...(arts ?? []).map((a) => a.seo_title ?? a.title ?? ""), ...workouts.map((w) => w.title)];
    const descs = [...pages.map((p) => p.description), ...(arts ?? []).map((a) => a.seo_description ?? a.excerpt ?? ""), ...workouts.map((w) => w.description)];
    const dt = dupes(titles), dd = dupes(descs);
    add("duplicate-metadata", "Duplicate titles & descriptions", dt.length || dd.length ? "warn" : "pass",
      `${titles.length} titles checked, ${dt.length} repeated${dt.length ? `: ${dt.slice(0, 5).join("; ")}` : ""}; ${dd.length} repeated descriptions${dd.length ? `: ${dd.slice(0, 3).map((d) => d.slice(0, 70)).join("; ")}` : ""}`);
  } catch (e) {
    add("duplicate-metadata", "Duplicate titles & descriptions", "fail", e instanceof Error ? e.message : String(e));
  }

  // 3. Structured data on a sample of key public pages.
  const sample = ["/", "/smarty-workouts", "/exercise-library", "/blog", "/haris-falas", "/wod",
    ...locs.filter((u) => /\/smarty-workouts\/[0-9a-f-]{36}$/.test(u)).slice(0, 2).map((u) => new URL(u).pathname),
    ...locs.filter((u) => /\/blog\/[a-z0-9-]+$/.test(u)).slice(0, 2).map((u) => new URL(u).pathname)];
  const sdErrors: string[] = [];
  const metaErrors: string[] = [];
  for (const path of sample) {
    try {
      const { status, body } = await fetchText(`${SITE_URL}${path}`);
      if (status !== 200) { sdErrors.push(`${path}: HTTP ${status}`); continue; }
      const blocks = [...body.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)];
      if (!blocks.length) sdErrors.push(`${path}: no structured data`);
      for (const b of blocks) {
        try { const j = JSON.parse(b[1]!); if (!j["@type"] && !j["@graph"]) sdErrors.push(`${path}: block without @type`); }
        catch { sdErrors.push(`${path}: invalid JSON-LD`); }
      }
      const canon = body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      if (!canon) metaErrors.push(`${path}: no canonical`);
      else if (canon.replace(/\/$/, "") !== `${SITE_URL}${path}`.replace(/\/$/, "")) metaErrors.push(`${path}: canonical → ${canon}`);
      if (/<meta[^>]*name="robots"[^>]*noindex/i.test(body)) metaErrors.push(`${path}: noindex but in sitemap`);
      if (!/<meta[^>]*name="description"/i.test(body)) metaErrors.push(`${path}: no description`);
    } catch (e) {
      sdErrors.push(`${path}: ${e instanceof Error ? e.message : e}`);
    }
  }
  add("structured-data", "Structured data", sdErrors.length ? "fail" : "pass",
    sdErrors.length ? sdErrors.slice(0, 8).join("; ") : `${sample.length} pages checked, all valid`);
  add("canonical-metadata", "Canonical, robots & descriptions", metaErrors.length ? "warn" : "pass",
    metaErrors.length ? metaErrors.slice(0, 8).join("; ") : `${sample.length} pages checked, all consistent`);

  // 4. Google: sitemap status + URL Inspection sample.
  try {
    const sites = (await gsc("/webmasters/v3/sites")) as { siteEntry?: { siteUrl: string; permissionLevel?: string }[] };
    const site = sites.siteEntry?.find((s) => s.siteUrl === GSC_SITE && s.permissionLevel !== "siteUnverifiedUser");
    if (!site) throw new Error("smartygym.com is not a verified property for the connected account");
    const sm = (await gsc(`/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps`)) as {
      sitemap?: { path: string; errors?: string; warnings?: string; lastDownloaded?: string; contents?: { type: string; submitted: string }[] }[];
    };
    const smLines = (sm.sitemap ?? []).map((s) =>
      `${s.path.replace(SITE_URL, "")}: ${s.contents?.find((c) => c.type === "web")?.submitted ?? 0} submitted, ${s.errors ?? 0} errors, ${s.warnings ?? 0} warnings, read ${s.lastDownloaded?.slice(0, 10) ?? "never"}`);
    const smErr = (sm.sitemap ?? []).some((s) => Number(s.errors ?? 0) > 0);
    add("google-sitemaps", "Google sitemap status", smErr ? "fail" : "pass", smLines.join("; ") || "No sitemaps submitted");

    const inspect = sample.slice(0, 8);
    let indexed = 0;
    const notIndexed: string[] = [];
    for (const path of inspect) {
      const r = (await gsc("/v1/urlInspection/index:inspect", {
        method: "POST",
        body: JSON.stringify({ inspectionUrl: `${SITE_URL}${path}`, siteUrl: site.siteUrl }),
      })) as { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string } } };
      const s = r.inspectionResult?.indexStatusResult;
      if (s?.verdict === "PASS") indexed++;
      else notIndexed.push(`${path} (${s?.coverageState ?? s?.verdict ?? "unknown"})`);
    }
    add("google-indexed", "Indexed URLs (Google sample)", notIndexed.length ? "warn" : "pass",
      `${indexed}/${inspect.length} sampled pages indexed${notIndexed.length ? `; not yet: ${notIndexed.join("; ")}` : ""}`);
  } catch (e) {
    add("google", "Google Search Console", "warn", e instanceof Error ? e.message : String(e));
  }

  // 5. Search-intent gaps against our own keyword index and public pages.
  try {
    const index = await readKeywordIndex();
    const haystack = [
      ...(index?.keywords ?? []),
      ...publicPages(false).flatMap((p) => [p.title, p.keyphrase, ...p.keywords]),
    ].join(" | ").toLowerCase();
    const gaps = SEARCH_THEMES.filter((t) => !haystack.includes(t));
    add("intent-gaps", "Competitor gap opportunities", gaps.length ? "warn" : "pass",
      gaps.length ? `Search themes with no matching public page or phrase: ${gaps.join(", ")}` : `All ${SEARCH_THEMES.length} search themes covered`);
  } catch (e) {
    add("intent-gaps", "Competitor gap opportunities", "warn", e instanceof Error ? e.message : String(e));
  }

  // 6. IndexNow queue.
  try {
    const { data, error } = await db.from("seo_indexnow_queue").select("state");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const r of data ?? []) counts[String((r as { state: string }).state)] = (counts[String((r as { state: string }).state)] ?? 0) + 1;
    const failed = Object.entries(counts).filter(([k]) => /fail/i.test(k)).reduce((a, [, n]) => a + n, 0);
    add("indexnow", "IndexNow queue", failed ? "warn" : "pass",
      Object.entries(counts).map(([k, n]) => `${k}: ${n}`).join(", ") || "Queue empty");
  } catch (e) {
    add("indexnow", "IndexNow queue", "warn", e instanceof Error ? e.message : String(e));
  }

  // 7. SEO job history.
  try {
    const { data, error } = await db.from("cron_runs").select("status,ran_at")
      .eq("job_key", "seo-refresh").order("ran_at", { ascending: false }).limit(20);
    if (error) throw error;
    const lastOk = data?.find((r) => r.status === "ok" || r.status === "skipped");
    const fails = (data ?? []).filter((r) => r.status === "failed").length;
    add("seo-jobs", "SEO job history", fails ? "warn" : "pass",
      `Last successful run: ${lastOk?.ran_at?.slice(0, 16).replace("T", " ") ?? "none"}; ${fails} failed of the last ${data?.length ?? 0}`);
  } catch (e) {
    add("seo-jobs", "SEO job history", "warn", e instanceof Error ? e.message : String(e));
  }

  return items;
}

export function healthLines(items: SeoHealthItem[]): string[] {
  const tag = { pass: "PASS", warn: "WARNING", fail: "ERROR" } as const;
  return items.map((i) => `${tag[i.status]} ${i.label}: ${i.detail}`);
}
