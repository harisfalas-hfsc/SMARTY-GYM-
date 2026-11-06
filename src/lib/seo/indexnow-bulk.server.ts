/**
 * Bulk IndexNow delivery for the Admin SEO section and the weekly SEO job.
 * Read-only for pages and content: it only tells search engines which public
 * addresses exist, and records what was sent in seo_indexnow_queue.
 */
import { SITE_URL } from "@/lib/seo/site";
import { INDEXNOW_KEY, normalizeIndexNowUrls } from "@/lib/seo/indexnow.server";

export const LAST_PUSH_SETTING = "seo_indexnow_last_push";
const BATCH = 10000; // IndexNow maximum per request

export interface BulkPushResult {
  ok: boolean;
  total: number;
  submitted: number;
  batches: { size: number; status: number | null; detail: string }[];
  at: string;
  mode: "all" | "new";
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Every public address: the main sitemap plus every exercise guide. */
export async function collectPublicUrls(): Promise<{ urls: string[]; exercises: number; pages: number }> {
  const { listPublicExerciseSlugs } = await import("@/lib/seo/exercise-public.server");
  const exercises = (await listPublicExerciseSlugs())
    .filter((r) => /^[a-z0-9-]+$/.test(r.slug))
    .map((r) => `${SITE_URL}/exercise-library/${r.slug}`);
  let pages: string[] = [];
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
    if (res.ok) pages = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.trim());
  } catch {
    /* main sitemap unreachable — exercises still go out */
  }
  const urls = normalizeIndexNowUrls([...pages, ...exercises]);
  return { urls, exercises: exercises.length, pages: pages.length };
}

async function post(urlList: string[]): Promise<{ status: number | null; ok: boolean; detail: string }> {
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(30000),
    });
    // 200 = received, 202 = accepted (key check pending). Both are success.
    return { status: res.status, ok: res.status === 200 || res.status === 202, detail: `IndexNow answered ${res.status}` };
  } catch (e) {
    return { status: null, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function recordSent(urls: string[]) {
  const client = await db();
  const now = new Date().toISOString();
  for (let i = 0; i < urls.length; i += 500) {
    const rows = urls.slice(i, i + 500).map((url) => ({
      url, state: "sent", submitted_at: now, changed_at: now, retry_at: now, attempts: 1, last_error: null,
    }));
    const { error } = await client.from("seo_indexnow_queue").upsert(rows, { onConflict: "url" });
    if (error) throw new Error(error.message);
  }
}

/** Sends URLs in IndexNow-sized batches, records what was accepted and saves the result. */
export async function pushUrls(urls: string[], mode: "all" | "new"): Promise<BulkPushResult> {
  const batches: BulkPushResult["batches"] = [];
  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const r = await post(chunk);
    batches.push({ size: chunk.length, status: r.status, detail: r.detail });
    if (r.ok) {
      submitted += chunk.length;
      await recordSent(chunk);
    }
  }
  const result: BulkPushResult = {
    ok: urls.length === 0 || submitted === urls.length,
    total: urls.length,
    submitted,
    batches,
    at: new Date().toISOString(),
    mode,
  };
  if (urls.length) {
    const client = await db();
    await client
      .from("app_settings")
      .upsert({ key: LAST_PUSH_SETTING, value: result, updated_at: result.at }, { onConflict: "key" });
  }
  return result;
}

/** Public addresses never sent to IndexNow before (e.g. newly added exercises). */
export async function findUnsentUrls(urls: string[]): Promise<string[]> {
  const client = await db();
  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("seo_indexnow_queue").select("url").range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) known.add(r.url);
    if (!data || data.length < 1000) break;
  }
  return urls.filter((u) => !known.has(u));
}

/** Weekly automatic step: tell search engines only about public pages they were never told about. */
export async function pushNewPublicUrls(): Promise<BulkPushResult> {
  const { urls } = await collectPublicUrls();
  return pushUrls(await findUnsentUrls(urls), "new");
}
