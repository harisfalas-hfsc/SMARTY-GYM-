import type { SupabaseClient } from "@supabase/supabase-js";

/** Articles published within this many days are picked up by the email job. */
export const BLOG_EMAIL_LOOKBACK_DAYS = 8;

export interface BlogEmailResult {
  status: "ok" | "skipped" | "failed";
  changed: boolean;
  summary: string;
  failures: string[];
}

/**
 * Sends the member email for every recently published blog article.
 * Runs separately from article creation (own day/time in Admin). Each member
 * gets each article once — repeats are blocked per article by broadcast dedupe.
 */
export async function runBlogEmailBroadcast(db: SupabaseClient, now = new Date()): Promise<BlogEmailResult> {
  const since = new Date(now.getTime() - BLOG_EMAIL_LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from("blog_articles")
    .select("slug,title,excerpt,published_at")
    .eq("is_published", true)
    .gte("published_at", since)
    .order("published_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);
  const articles = (data as { slug: string; title: string; excerpt: string | null }[] | null) ?? [];
  if (!articles.length)
    return { status: "skipped", changed: false, summary: "No new article to email.", failures: [] };

  const { newArticleAnnouncement } = await import("@/lib/broadcast-content");
  const { sendBroadcastEmail } = await import("@/lib/broadcast-email.server");
  const failures: string[] = [];
  const lines: string[] = [];
  let total = 0;
  for (const a of articles) {
    try {
      const n = await sendBroadcastEmail(db, newArticleAnnouncement(a.slug, a.title, a.excerpt ?? ""));
      total += n;
      if (n) lines.push(`“${a.title}”: ${n} email(s)`);
    } catch (e) {
      failures.push(`${a.slug}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return {
    status: failures.length ? "failed" : total ? "ok" : "skipped",
    changed: total > 0,
    summary: total
      ? `Article emails sent — ${lines.join("; ")}.`
      : failures.length
        ? `Article emails failed: ${failures.slice(0, 3).join(" | ")}`
        : "Every recent article was already emailed.",
    failures,
  };
}
