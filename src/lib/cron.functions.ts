import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CRON_JOBS, type CronJobDefinition } from "@/lib/cron/registry";
import type { CronJobConfig, CronRunRow } from "@/lib/cron/jobs.server";

async function assertAdmin(ctx: { userId: string; claims: any }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden: admin access required");
}

export interface CronOverview {
  definitions: CronJobDefinition[];
  configs: Record<string, CronJobConfig>;
  runs: CronRunRow[];
  index: { total: number; generated_at: string | null; exercises: number; workouts: number } | null;
}

export const adminGetCronJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CronOverview | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;
      const { getCronConfigs, listRuns } = await import("@/lib/cron/jobs.server");
      const { readKeywordIndex } = await import("@/lib/seo/keyword-index.server");
      const [configs, runs, index] = await Promise.all([
        getCronConfigs(db),
        listRuns(db, 600),
        readKeywordIndex(),
      ]);
      return {
        definitions: CRON_JOBS,
        configs,
        runs,
        index: index
          ? {
              total: index.total,
              generated_at: index.generated_at,
              exercises: index.counts?.exercises ?? 0,
              workouts: index.counts?.workouts ?? 0,
            }
          : null,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load cron jobs" };
    }
  });

export const adminSaveCronJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      key: string;
      enabled?: boolean;
      hour?: number;
      minute?: number;
      content?: import("@/lib/cron/jobs.server").CronContent;
    }) => data,
  )
  .handler(async ({ context, data }): Promise<{ config: CronJobConfig } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;
      const { saveCronConfig } = await import("@/lib/cron/jobs.server");
      const config = await saveCronConfig(db, data.key, {
        ...(data.enabled === undefined ? {} : { enabled: data.enabled }),
        ...(data.hour === undefined ? {} : { hour: data.hour }),
        ...(data.minute === undefined ? {} : { minute: data.minute }),
        ...(data.content === undefined ? {} : { content: data.content }),
      });
      return { config };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to save job" };
    }
  });

export const adminRunCronJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      key: string;
      force?: boolean;
      brief?: { titleKeywords?: string; topicKeywords?: string };
    }) => data,
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{ status: string; summary: string; emailed?: boolean } | { error: string }> => {
      try {
        await assertAdmin(context as any);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;
        const { getCronConfig, recordRun, markJobRan } = await import("@/lib/cron/jobs.server");

        if (data.key === "health-check") {
          const config = await getCronConfig(db, "health-check");
          const { runHealthCheck } = await import("@/lib/cron/health-check.server");
          const report = await runHealthCheck(db, { config, trigger: "manual" });
          await recordRun(db, {
            jobKey: "health-check",
            status: report.status === "ok" ? "ok" : "failed",
            changed: report.failed > 0,
            summary: report.summary,
            details: {
              failures: report.items
                .filter((i) => i.status !== "pass")
                .map((i) => `${i.label}: ${i.detail}`)
                .slice(0, 50),
              items: report.items,
            },
            trigger: "manual",
          });
          return { status: report.status, summary: report.summary, emailed: report.emailed };
        }

        if (data.key === "generate-weekly-blog-article") {
          const config = await getCronConfig(db, "generate-weekly-blog-article");
          const { runWeeklyBlogArticle } = await import("@/lib/cron/blog-generator.server");
          const result = await runWeeklyBlogArticle(db, {
            config,
            trigger: "manual",
            force: data.force ?? false,
            ...(data.brief ? { brief: data.brief } : {}),
          });
          await recordRun(db, {
            jobKey: "generate-weekly-blog-article",
            status: result.status,
            changed: result.changed,
            summary: result.summary,
            details: { failures: result.failures },
            trigger: "manual",
          });
          if (result.status === "ok") await markJobRan(db, "generate-weekly-blog-article", config);
          return { status: result.status, summary: result.summary };
        }

        if (data.key === "user-activity-report") {
          const config = await getCronConfig(db, "user-activity-report");
          const { runUserActivityReport } = await import("@/lib/activity/run.server");
          const r = await runUserActivityReport(db, { config, trigger: "manual" });
          await recordRun(db, { jobKey: "user-activity-report", status: r.status, changed: true, summary: r.summary, trigger: "manual" });
          return { status: r.status, summary: r.summary, emailed: true };
        }

        if (data.key === "wod-selection") {
          const { selectWodForDate, addDays } = await import("@/lib/wod/select.server");
          const { localDateISO } = await import("@/lib/wod-cycle");
          const today = localDateISO(new Date());
          const results = [
            await selectWodForDate(db, today),
            await selectWodForDate(db, addDays(today, 1)),
          ];
          const filled = results.flatMap((r) =>
            r.filled.map((f) => `${r.date} ${f.slot}: ${f.name}`),
          );
          const missing = results.flatMap((r) =>
            r.missing.map((m) => `${r.date} ${r.category} ${m}: no matching workout`),
          );
          const status = (missing.length ? "failed" : "ok") as "failed" | "ok";
          const summary = filled.length
            ? `${filled.length} slot(s) filled${missing.length ? `, ${missing.length} without a matching workout` : ""}.`
            : missing.length
              ? `${missing.length} slot(s) without a matching workout.`
              : "Today and tomorrow were already picked — nothing to change.";
          await recordRun(db, {
            jobKey: "wod-selection",
            status,
            changed: filled.length > 0,
            summary,
            details: { added: filled, failures: missing },
            trigger: "manual",
          });
          return { status, summary };
        }

        if (data.key !== "seo-refresh") {
          return { error: "This job cannot be run on demand." };
        }

        const config = await getCronConfig(db, "seo-refresh");
        const { runSeoRefresh } = await import("@/lib/cron/seo-refresh.server");
        const result = await runSeoRefresh(db, {
          config,
          trigger: "manual",
          force: data.force ?? false,
        });
        await recordRun(db, {
          jobKey: "seo-refresh",
          status: result.status,
          changed: result.changed,
          summary: result.summary,
          details: {
            added: result.added.slice(0, 200),
            failures: result.failures,
            items: result.health,
          },
          trigger: "manual",
        });
        if (result.status !== "failed") await markJobRan(db, "seo-refresh", config);
        return { status: result.status, summary: result.summary, emailed: result.emailed };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Failed to run job" };
      }
    },
  );

export interface ErrorEventRow {
  id: string;
  kind: string;
  severity: string;
  message: string;
  source: string | null;
  route: string | null;
  user_email: string | null;
  occurrences: number;
  created_at: string;
  resolved_at: string | null;
}

export const adminListErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ errors: ErrorEventRow[] } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("error_events")
        .select(
          "id,kind,severity,message,source,route,user_email,occurrences,created_at,resolved_at",
        )
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return { error: error.message };
      return { errors: (data as ErrorEventRow[] | null) ?? [] };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load problems" };
    }
  });

export const adminResolveError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("error_events")
        .update({ resolved_at: new Date().toISOString() } as never)
        .eq("id", data.id);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to update" };
    }
  });

export const adminResolveAllErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("error_events")
        .update({ resolved_at: new Date().toISOString() } as never)
        .is("resolved_at", null);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to update" };
    }
  });

export const adminClearResolvedErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("error_events")
        .delete()
        .not("resolved_at", "is", null);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to clear" };
    }
  });

/* ---------------- System health (admin panel, live step-by-step run) ---------------- */

export interface HealthItemDTO {
  number: number;
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export const adminHealthCheckStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { key: string }) => data)
  .handler(
    async ({ context, data }): Promise<{ item: HealthItemDTO | null } | { error: string }> => {
      try {
        await assertAdmin(context as any);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;
        const { runHealthCheck } = await import("@/lib/cron/health-check.server");
        const r = await runHealthCheck(db, {
          trigger: "manual",
          only: [data.key],
          skipEmail: true,
        });
        return { item: (r.items[0] as HealthItemDTO | undefined) ?? null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Check failed" };
      }
    },
  );

export const adminFinishHealthAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { startedAt: string; items: HealthItemDTO[] }) => data)
  .handler(
    async ({
      context,
      data,
    }): Promise<
      { summary: string; status: string; emailed: boolean; recipient: string } | { error: string }
    > => {
      try {
        await assertAdmin(context as any);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;
        const { getCronConfig, recordRun } = await import("@/lib/cron/jobs.server");
        const { buildReport, emailReport, healthRecipient } =
          await import("@/lib/cron/health-check.server");
        const config = await getCronConfig(db, "health-check");
        const items = data.items.slice(0, 60).map((i) => ({
          number: i.number,
          key: String(i.key),
          label: String(i.label).slice(0, 200),
          status: (["pass", "warn", "fail"].includes(i.status) ? i.status : "fail") as
            "pass" | "warn" | "fail",
          detail: String(i.detail).slice(0, 1000),
        }));
        const report = buildReport(
          items,
          new Date(data.startedAt),
          "manual",
          healthRecipient(config),
        );
        report.emailed = await emailReport(report);
        await recordRun(db, {
          jobKey: "health-check",
          status: report.status === "ok" ? "ok" : "failed",
          changed: report.failed > 0,
          summary: report.summary,
          details: {
            failures: report.items
              .filter((i) => i.status !== "pass")
              .map((i) => `${i.label}: ${i.detail}`),
            items: report.items,
          },
          trigger: "manual",
        });
        return {
          summary: report.summary,
          status: report.status,
          emailed: report.emailed,
          recipient: report.recipient,
        };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Could not finish the audit" };
      }
    },
  );

export const adminListHealthRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ runs: CronRunRow[] } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await (supabaseAdmin as any)
        .from("cron_runs")
        .select("*")
        .eq("job_key", "health-check")
        .order("ran_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return { runs: (data ?? []) as CronRunRow[] };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load history" };
    }
  });
