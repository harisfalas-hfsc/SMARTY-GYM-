/**
 * IndexNow submitter — tells Bing (and every IndexNow partner, which is what
 * Copilot and several AI answer engines read) that a URL is new or changed.
 * Fire-and-report only; failures never break the job that called it.
 */
import { SITE_URL } from "@/lib/seo/site";

/** Static key, also served at /<key>.txt so IndexNow can verify ownership. */
export const INDEXNOW_KEY = "8f2c41d7a9b34e6ea0c5d81f37b9e42c";

export interface IndexNowResult {
  submitted: number;
  ok: boolean;
  detail: string;
}

export async function submitToIndexNow(paths: string[]): Promise<IndexNowResult> {
  const urlList = Array.from(
    new Set(paths.map((p) => (/^https?:\/\//i.test(p) ? p : `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`))),
  ).slice(0, 10000);
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
      submitted: urlList.length,
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
