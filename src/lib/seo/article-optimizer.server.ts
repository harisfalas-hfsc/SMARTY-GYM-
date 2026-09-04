/**
 * Background SEO optimizer for blog articles.
 *
 * For each article that has never been optimized, or whose text changed since it
 * was, the model produces a search title, meta description, focus key phrase,
 * supporting keywords, an image alt text and 3 FAQ pairs. The values are stored
 * on the article row and rendered as invisible head data by /blog/$slug.
 *
 * Bounded per run, leased so two runs never overlap, and each article is marked
 * complete in the same step it is processed.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiTerminalError, generateSeoJson } from "@/lib/seo/ai.server";

type DB = SupabaseClient;

export const ARTICLE_BATCH_SIZE = 6;
const LEASE_KEY = "article-seo";
const LEASE_MINUTES = 15;

export interface ArticleSeoPayload {
  seo_title: string;
  seo_description: string;
  focus_keyphrase: string;
  seo_keywords: string[];
  image_alt: string;
  faq: { question: string; answer: string }[];
}

const SCHEMA = {
  name: "article_seo",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "seo_title",
      "seo_description",
      "focus_keyphrase",
      "seo_keywords",
      "image_alt",
      "faq",
    ],
    properties: {
      seo_title: { type: "string" },
      seo_description: { type: "string" },
      focus_keyphrase: { type: "string" },
      seo_keywords: { type: "array", items: { type: "string" } },
      image_alt: { type: "string" },
      faq: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: { question: { type: "string" }, answer: { type: "string" } },
        },
      },
    },
  },
} as const;

const INSTRUCTIONS = [
  "You optimize fitness articles for Google Search, Bing and AI answer engines (ChatGPT, Claude, Perplexity, Gemini, Grok).",
  "Write for humans first: natural language, no keyword stuffing, no clickbait, no emojis, no quotes around the title.",
  "seo_title: at most 60 characters, contains the focus key phrase, and ends with ' | SmartyGym' only if it still fits.",
  "seo_description: 140-158 characters, contains the focus key phrase once, states the concrete benefit of reading.",
  "focus_keyphrase: 2-5 words, the search phrase this article should win, lowercase.",
  "seo_keywords: 8-12 supporting phrases people actually search, lowercase, no duplicates of each other.",
  "image_alt: one descriptive sentence under 125 characters describing the cover image for a blind reader.",
  "faq: exactly 3 question/answer pairs answering what a reader would ask next; answers 1-3 sentences, self-contained so an AI engine can quote them.",
].join("\n");

export function contentHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  seo_content_hash: string | null;
}

export function articleHash(a: Pick<ArticleRow, "title" | "excerpt" | "content">): string {
  return contentHash(`${a.title}\n${a.excerpt ?? ""}\n${(a.content ?? "").slice(0, 20000)}`);
}

async function acquireLease(db: DB): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();
  const { data } = await db.from("seo_state").select("lease_until").eq("key", LEASE_KEY).maybeSingle();
  if (data?.lease_until && new Date(data.lease_until) > now) return false;
  await db.from("seo_state").upsert({ key: LEASE_KEY, lease_until: until }, { onConflict: "key" });
  return true;
}

async function releaseLease(db: DB, patch: Record<string, unknown> = {}) {
  await db
    .from("seo_state")
    .upsert({ key: LEASE_KEY, lease_until: null, ...patch }, { onConflict: "key" });
}

async function readPause(db: DB): Promise<string | null> {
  const { data } = await db
    .from("seo_state")
    .select("paused_reason")
    .eq("key", LEASE_KEY)
    .maybeSingle();
  return data?.paused_reason ?? null;
}

export interface ArticleOptimizeResult {
  status: "ok" | "skipped" | "paused" | "failed";
  optimized: number;
  remaining: number;
  slugs: string[];
  failures: string[];
  summary: string;
}

/**
 * Optimizes up to `limit` articles that are new or changed. Returns counts so the
 * weekly job can report them. A 402/403 from the gateway pauses the work and a
 * later run probes a single article before resuming.
 */
export async function optimizeArticles(
  db: DB,
  options: { limit?: number; slug?: string } = {},
): Promise<ArticleOptimizeResult> {
  const failures: string[] = [];
  const slugs: string[] = [];

  const paused = await readPause(db);
  const limit = options.slug ? 1 : paused ? 1 : (options.limit ?? ARTICLE_BATCH_SIZE);

  if (!options.slug && !(await acquireLease(db))) {
    return {
      status: "skipped",
      optimized: 0,
      remaining: 0,
      slugs: [],
      failures: [],
      summary: "Another SEO optimization run is still in progress.",
    };
  }

  try {
    let query = db
      .from("blog_articles")
      .select("id, slug, title, excerpt, content, category, seo_content_hash")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (options.slug) query = query.eq("slug", options.slug);
    const { data, error } = await query.limit(400);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ArticleRow[];
    const pending = rows.filter((r) => r.seo_content_hash !== articleHash(r));
    const batch = pending.slice(0, limit);

    for (const article of batch) {
      try {
        const payload = await generateSeoJson<ArticleSeoPayload>({
          instructions: INSTRUCTIONS,
          schema: SCHEMA as unknown as { name: string; schema: Record<string, unknown> },
          input: [
            `Category: ${article.category ?? "Fitness"}`,
            `Current title: ${article.title}`,
            `Excerpt: ${article.excerpt ?? ""}`,
            "Article body:",
            (article.content ?? "").slice(0, 12000),
          ].join("\n"),
        });

        const { error: updateError } = await db
          .from("blog_articles")
          .update({
            seo_title: payload.seo_title.slice(0, 70),
            seo_description: payload.seo_description.slice(0, 175),
            focus_keyphrase: payload.focus_keyphrase.slice(0, 120),
            seo_keywords: (payload.seo_keywords ?? []).slice(0, 14),
            image_alt: payload.image_alt.slice(0, 160),
            seo_faq: (payload.faq ?? []).slice(0, 4),
            seo_content_hash: articleHash(article),
            seo_optimized_at: new Date().toISOString(),
          })
          .eq("id", article.id);
        if (updateError) throw new Error(updateError.message);

        slugs.push(article.slug);
        if (paused) await releaseLease(db, { paused_reason: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push(`${article.slug}: ${message}`);
        if (err instanceof AiTerminalError && (err.status === 402 || err.status === 403)) {
          await releaseLease(db, { paused_reason: message });
          return {
            status: "paused",
            optimized: slugs.length,
            remaining: pending.length - slugs.length,
            slugs,
            failures,
            summary: `AI optimization paused: ${message}`,
          };
        }
        break;
      }
    }

    const remaining = Math.max(pending.length - slugs.length, 0);
    return {
      status: failures.length && !slugs.length ? "failed" : "ok",
      optimized: slugs.length,
      remaining,
      slugs,
      failures,
      summary: slugs.length
        ? `Optimized ${slugs.length} article${slugs.length === 1 ? "" : "s"}${remaining ? `, ${remaining} still queued` : ""}.`
        : remaining
          ? `Nothing optimized, ${remaining} article(s) still queued.`
          : "Every published article is already optimized.",
    };
  } finally {
    if (!options.slug) await releaseLease(db);
  }
}
