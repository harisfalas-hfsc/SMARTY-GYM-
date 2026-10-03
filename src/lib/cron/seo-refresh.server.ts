import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildKeywordIndex,
  mergeIndexes,
  readKeywordIndex,
  saveKeywordIndex,
} from "@/lib/seo/keyword-index.server";
import type { CronJobConfig } from "@/lib/cron/jobs.server";
import { optimizeArticles } from "@/lib/seo/article-optimizer.server";
import { optimizeSharedWorkouts } from "@/lib/seo/workout-seo.server";
import { submitToIndexNow } from "@/lib/seo/indexnow.server";

type DB = SupabaseClient;

export interface SeoRefreshResult {
  changed: boolean;
  status: "ok" | "skipped" | "failed";
  summary: string;
  total: number;
  added: string[];
  failures: string[];
  counts: { exercises: number; workouts: number; articles: number };
  emailed: boolean;
  /** Content optimization performed in this run. */
  optimization?: {
    articles: number;
    articlesQueued: number;
    workouts: number;
    workoutsQueued: number;
    submittedToSearchEngines: number;
    notes: string[];
  };
}

function extraKeywordsFrom(config: CronJobConfig | undefined): string[] {
  const raw = config?.content?.keywords;
  if (Array.isArray(raw)) return raw.map((k) => String(k));
  return [];
}

/** Batch size per run, overridable from the job's settings in the admin panel. */
function batchLimit(config: CronJobConfig | undefined, key: string, fallback: number): number {
  const raw = (config?.content as Record<string, unknown> | undefined)?.[key];
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 && n <= 40 ? Math.floor(n) : fallback;
}

/**
 * Weekly SEO run. Three bounded steps, each safe to repeat:
 *   1. optimize new or changed blog articles (title, description, key phrase,
  *      keywords and image alt text) with the AI model;
 *   2. optimize newly shared community workouts the same way;
 *   3. rebuild the site keyword index from every public page, training topic,
  *      active exercise and publicly accessible workout, then notify IndexNow
  *      only about updated public URLs. Obsolete terms are removed.
 */
export async function runSeoRefresh(
  db: DB,
  options: { config?: CronJobConfig; trigger: "schedule" | "manual"; force?: boolean } = {
    trigger: "schedule",
  },
): Promise<SeoRefreshResult> {
  const failures: string[] = [];
  const startedAt = new Date();
  const notes: string[] = [];
  const changedPaths: string[] = [];

  const articleRun = await optimizeArticles(db, {
    limit: batchLimit(options.config, "articleBatch", 6),
  }).catch((e) => {
    const message = e instanceof Error ? e.message : String(e);
    failures.push(`articles:${message}`);
    return null;
  });
  if (articleRun) {
    notes.push(`Articles: ${articleRun.summary}`);
    failures.push(...articleRun.failures.map((f) => `article:${f}`));
    changedPaths.push(...articleRun.slugs.map((s) => `/blog/${s}`));
  }

  const workoutRun = await optimizeSharedWorkouts(db, {
    limit: batchLimit(options.config, "workoutBatch", 8),
  }).catch((e) => {
    const message = e instanceof Error ? e.message : String(e);
    failures.push(`workouts:${message}`);
    return null;
  });
  if (workoutRun) {
    notes.push(`Shared workouts: ${workoutRun.summary}`);
    failures.push(...workoutRun.failures.map((f) => `workout:${f}`));
    const { isFreeAccessMode } = await import("@/lib/free-access.server");
    try {
      if (await isFreeAccessMode()) changedPaths.push(...workoutRun.optimizedIds.map((id) => `/community/workout/${id}`));
    } catch (e) {
      failures.push(`access:${e instanceof Error ? e.message : String(e)}`);
    }
  }

  let submitted = 0;

  const optimization = {
    articles: articleRun?.optimized ?? 0,
    articlesQueued: articleRun?.remaining ?? 0,
    workouts: workoutRun?.optimized ?? 0,
    workoutsQueued: workoutRun?.remaining ?? 0,
    submittedToSearchEngines: submitted,
    notes,
  };

  let built;
  try {
    built = await buildKeywordIndex(db, extraKeywordsFrom(options.config));
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    failures.push(`build:${message}`);
    const result: SeoRefreshResult = {
      changed: false,
      status: "failed",
      summary: `SEO update failed: ${message}`,
      total: 0,
      added: [],
      failures,
      counts: { exercises: 0, workouts: 0, articles: 0 },
      emailed: false,
      optimization,
    };
    result.emailed = await emailReport(result, startedAt, options.trigger);
    return result;
  }

  const previous = await readKeywordIndex();
  const { merged, added } = mergeIndexes(previous, built);

  const optimizedSomething = optimization.articles > 0 || optimization.workouts > 0;
  const unchanged =
    !options.force &&
    !optimizedSomething &&
    previous !== null &&
    previous.version >= 2 &&
    added.length === 0 &&
    previous.hash === built.hash;

  if (unchanged) {
    const queued = await submitToIndexNow([]);
    if (!queued.ok) failures.push(`indexnow:${queued.detail}`);
    const audit = auditStatus(built.counts, failures);
    return {
      changed: false,
      status: failures.length ? "failed" : "skipped",
      summary: `${audit} ${failures.length ? `SEO retry failed: ${failures.join("; ")}` : `No new keywords, pages, articles or workouts since the last run — nothing to update (${merged.total} keywords indexed).`}`,
      total: merged.total,
      added: [],
      failures,
      counts: built.counts,
      emailed: await emailReport({ changed: false, status: failures.length ? "failed" : "skipped", summary: `${audit} ${failures.join("; ")}`, total: merged.total, added: [], failures, counts: built.counts, emailed: false, optimization }, startedAt, options.trigger),
      optimization,
    };
  }

  try {
    await saveKeywordIndex(merged);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    failures.push(`save:${message}`);
  }

  const urlsToSubmit = [...changedPaths, ...(articleRun?.optimized ? ["/blog"] : [])];
  {
    const ping = await submitToIndexNow(urlsToSubmit);
    submitted = ping.ok ? ping.submitted : 0;
    notes.push(ping.detail);
    if (!ping.ok) failures.push(`indexnow:${ping.detail}`);
  }
  optimization.submittedToSearchEngines = submitted;

  const optimizedLine = optimizedSomething
    ? ` Optimized ${optimization.articles} article${optimization.articles === 1 ? "" : "s"} and ${optimization.workouts} shared workout${optimization.workouts === 1 ? "" : "s"}${optimization.submittedToSearchEngines ? `, ${optimization.submittedToSearchEngines} URL(s) submitted to the search engines` : ""}.`
    : "";

  const result: SeoRefreshResult = {
    changed: failures.length === 0,
    status: failures.length ? "failed" : "ok",
    summary: `${auditStatus(built.counts, failures)} ${failures.length
      ? `SEO update finished with errors: ${failures.join("; ")}`
      : `SEO index updated — ${added.length} new keyword${added.length === 1 ? "" : "s"}, ${merged.total} internal phrases in total (${built.counts.exercises} active exercises, ${built.counts.workouts} publicly accessible shared workouts, ${built.counts.articles} blog articles).${optimizedLine}`}`,
    total: merged.total,
    added,
    failures,
    counts: built.counts,
    emailed: false,
    optimization,
  };

  result.emailed = await emailReport(result, startedAt, options.trigger);
  return result;
}

/** Local weekly checks only. Google coverage is checked separately in Search Console. */
function auditStatus(counts: SeoRefreshResult["counts"], failures: string[]): string {
  const checks = [
    `${counts.exercises > 0 ? "PASS" : "WARNING"} active exercise sources: ${counts.exercises}`,
    `${counts.articles > 0 ? "PASS" : "WARNING"} published article sources: ${counts.articles}`,
    `${failures.length ? "ERROR" : "PASS"} background refresh and submission: ${failures.length ? failures.length + " failure(s)" : "no reported errors"}`,
  ];
  return `Weekly local SEO audit — ${checks.join("; ")}. Google crawl and indexing status not checked by this job.`;
}

async function emailReport(
  result: SeoRefreshResult,
  startedAt: Date,
  trigger: "schedule" | "manual",
): Promise<boolean> {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const finishedAt = new Date();
    await sendTemplateEmail("cron-report", (process.env["CRON_REPORT_RECIPIENT"] || "smartygym@outlook.com"), {
      templateData: {
        jobLabel: "Automatic SEO update",
        status: result.status,
        trigger,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSec: Math.max(1, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)),
        summary: result.summary,
        added: result.added.slice(0, 120),
        addedCount: result.added.length,
        total: result.total,
        exercises: result.counts.exercises,
        workouts: result.counts.workouts,
        articles: result.counts.articles,
        failures: result.failures,
        articlesOptimized: result.optimization?.articles ?? 0,
        articlesQueued: result.optimization?.articlesQueued ?? 0,
        workoutsOptimized: result.optimization?.workouts ?? 0,
        workoutsQueued: result.optimization?.workoutsQueued ?? 0,
        urlsSubmitted: result.optimization?.submittedToSearchEngines ?? 0,
      },
      idempotencyKey: `seo-report:${startedAt.toISOString().slice(0, 13)}:${trigger}`,
    });
    return true;
  } catch (e) {
    console.error("[cron/seo] report email failed", e);
    return false;
  }
}
