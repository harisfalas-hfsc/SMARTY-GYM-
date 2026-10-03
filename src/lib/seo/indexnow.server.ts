/**
 * Durable change-only IndexNow delivery. Submission does not guarantee indexing.
 */
import { SITE_URL } from "@/lib/seo/site";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Static key, also served at /<key>.txt so IndexNow can verify ownership. */
export const INDEXNOW_KEY = "8f2c41d7a9b34e6ea0c5d81f37b9e42c";

export interface IndexNowResult {
  submitted: number;
  ok: boolean;
  detail: string;
}

export function normalizeIndexNowUrls(paths: string[]): string[] {
  return [
    ...new Set(
      paths
        .map((path) => {
          try {
            const url = new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL);
            if (path.startsWith("http")) {
              const absolute = new URL(path);
              if (absolute.origin !== SITE_URL || absolute.search || absolute.hash) return null;
              return normalizeIndexNowUrls([absolute.pathname])[0] ?? null;
            }
            if (url.origin !== SITE_URL || url.search || url.hash) return null;
            if (
              /^\/(admin|account|auth|reset-password|checkout|profile|logbook|progress|inbox|messages|notifications|create-your-own-workout|create-your-workout|coach|smarty-ritual|smarty-checkins|w)(\/|$)/.test(
                url.pathname,
              )
            )
              return null;
            return url.href;
          } catch {
            return null;
          }
        })
        .filter((url): url is string => Boolean(url)),
    ),
  ].slice(0, 10000);
}

async function postIndexNow(urlList: string[]): Promise<IndexNowResult> {
  if (!urlList.length) return { submitted: 0, ok: true, detail: "Nothing to submit." };

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
    });
    return {
      submitted: res.ok ? urlList.length : 0,
      ok: res.ok,
      detail: `IndexNow responded ${res.status} for ${urlList.length} URL(s).`,
    };
  } catch (err) {
    return {
      submitted: 0,
      ok: false,
      detail: `IndexNow submission failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Persist changed URLs, retry failures, and never send the same unchanged URL twice. */
export async function submitToIndexNow(paths: string[]): Promise<IndexNowResult> {
  const db = supabaseAdmin;
  try {
    for (const url of normalizeIndexNowUrls(paths)) {
      const { data, error } = await db
        .from("seo_indexnow_queue")
        .select("state")
        .eq("url", url)
        .maybeSingle();
      if (error) throw error;
      if (data?.state === "pending") continue;
      // Callers supply only URLs whose public content actually changed. A previously
      // submitted URL must be eligible again after a later article/workout update.
      const { error: writeError } = await db.from("seo_indexnow_queue").upsert(
        {
          url,
          state: "pending",
          changed_at: new Date().toISOString(),
          submitted_at: null,
          attempts: 0,
          retry_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "url" },
      );
      if (writeError) throw writeError;
    }
    const { data: due, error } = await db
      .from("seo_indexnow_queue")
      .select("url, attempts")
      .eq("state", "pending")
      .lte("retry_at", new Date().toISOString())
      .order("retry_at")
      .limit(100);
    if (error) throw error;
    if (!due?.length)
      return { submitted: 0, ok: true, detail: "No changed public URLs due for submission." };
    const result = await postIndexNow(due.map((row: { url: string }) => row.url));
    for (const row of due as { url: string; attempts: number }[]) {
      const attempts = row.attempts + 1;
      const backoff = Math.min(7 * 86400, 60 * 2 ** Math.min(attempts, 16));
      const { error: updateError } = await db
        .from("seo_indexnow_queue")
        .update(
          result.ok
            ? { state: "sent", submitted_at: new Date().toISOString(), attempts, last_error: null }
            : {
                attempts,
                retry_at: new Date(Date.now() + backoff * 1000).toISOString(),
                last_error: result.detail,
              },
        )
        .eq("url", row.url);
      if (updateError) throw updateError;
    }
    return result;
  } catch (e) {
    return {
      submitted: 0,
      ok: false,
      detail: `IndexNow queue unavailable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
