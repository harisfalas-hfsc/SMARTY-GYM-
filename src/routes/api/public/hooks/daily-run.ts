import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduler (pg_cron → every 5 minutes). Member-facing per-hour jobs only act
 * on the first tick of each hour; fixed/weekly jobs fire at their exact minute.
 * Runs every automated job in `src/lib/cron/registry.ts`:
 *  - the daily motivational message, at each athlete's chosen local hour
 *  - the shared Workout of the Day selection, at 00:00 Cyprus time
 *  - scheduled-workout reminders
 *  - the automatic SEO update, at the fixed time set in the Admin panel
 * Every job is idempotent and can be switched off in Admin → Cron jobs.
 */
export const Route = createFileRoute("/api/public/hooks/daily-run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Shared-secret auth. The publishable key is public, so it is NOT accepted here.
        const presented =
          request.headers.get("x-daily-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        let authorized = false;
        const envSecret = process.env["DAILY_RUN_SECRET"] ?? "";
        if (envSecret && presented === envSecret) authorized = true;
        if (!authorized && presented) {
          const { data: row } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "daily_run_token")
            .maybeSingle();
          const token = (row as { value?: { token?: string } } | null)?.value?.token ?? "";
          if (token && presented === token) authorized = true;
        }
        if (!authorized) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { localHour, localDateISO } = await import("@/lib/wod-cycle");
        const { DAILY_PROFILE_COLUMNS, runMotivationForUser } = await import("@/lib/daily.server");
        type DailyProfile = import("@/lib/daily.server").DailyProfile;

        const db = supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient;

        const {
          getCronConfigs,
          isDueNow,
          markJobRan,
          motivationPool,
          recordRun,
          recordDailyHeartbeat,
        } = await import("@/lib/cron/jobs.server");
        const jobs = await getCronConfigs(db);
        const motivationOn = jobs["daily-motivation"]?.enabled ?? false;
        const scheduleOn = jobs["schedule-reminders"]?.enabled ?? false;
        const pool = motivationPool(jobs["daily-motivation"]);

        const failures: string[] = [];
        let motivations = 0;
        let profiles: DailyProfile[] = [];

        // Per-member hourly jobs keep their original once-an-hour rhythm.
        const firstTickOfHour = new Date().getUTCMinutes() < 5;

        if (motivationOn && firstTickOfHour) {
          const { data, error } = await db
            .from("profiles")
            .select(DAILY_PROFILE_COLUMNS)
            .eq("notify_motivation", true)
            .limit(2000);
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          profiles = ((data as DailyProfile[] | null) ?? []).filter(Boolean);
        }

        for (const prof of profiles) {
          const tz = prof.timezone || "Europe/Athens";
          const hour = localHour(new Date(), tz);
          const today = localDateISO(new Date(), tz);

          try {
            if (motivationOn && prof.notify_motivation && hour === (prof.motivation_hour ?? 7)) {
              if (await runMotivationForUser(db, prof, pool)) motivations += 1;
            }
          } catch (e) {
            failures.push(`motivation:${prof.id}:${e instanceof Error ? e.message : "error"}`);
          }
        }

        // Automatic recovery: rebuild any workout (incl. Workout of the Day) that failed.
        let recovered = 0;
        if (jobs["workout-recovery"]?.enabled ?? true) {
          try {
            const { retryPendingGenerations, sweepAbandonedGenerations } =
              await import("@/lib/workout-generation.server");
            recovered = (await retryPendingGenerations(10)).recovered;
            const sweptCount = (await sweepAbandonedGenerations(25)).alerted;
            if (recovered || sweptCount) {
              await recordRun(db, {
                jobKey: "workout-recovery",
                status: "ok",
                changed: true,
                summary: `${recovered} workout(s) recovered, ${sweptCount ?? 0} abandoned creation(s) reported to you.`,
              });
            } else {
              await recordDailyHeartbeat(
                db,
                "workout-recovery",
                "Checked: nothing needed recovery today so far.",
              );
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`recovery:${message}`);
            await recordRun(db, {
              jobKey: "workout-recovery",
              status: "failed",
              summary: `Recovery failed: ${message}`,
            });
          }
        }

        let scheduleReminders = 0;
        if (scheduleOn) {
          try {
            const { runScheduleReminders } = await import("@/lib/schedule-notify.server");
            scheduleReminders = await runScheduleReminders(db);
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`schedule:${message}`);
            await recordRun(db, {
              jobKey: "schedule-reminders",
              status: "failed",
              summary: `Scheduled workout reminders failed: ${message}`,
            });
          }
        }

        let checkinReminders = 0;
        if (jobs["checkin-reminders"]?.enabled && firstTickOfHour) {
          try {
            const { runCheckinReminders } = await import("@/lib/checkin-reminders.server");
            checkinReminders = await runCheckinReminders(db);
            if (checkinReminders)
              await recordRun(db, {
                jobKey: "checkin-reminders",
                status: "ok",
                changed: true,
                summary: `${checkinReminders} check-in reminder(s) sent.`,
              });
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`checkin:${message}`);
            await recordRun(db, {
              jobKey: "checkin-reminders",
              status: "failed",
              summary: `Check-in reminders failed: ${message}`,
            });
          }
        }

        // Shared Workout of the Day — midnight pick for today + tomorrow; every tick fills empty slots.
        let wod: { status: string; summary: string } | null = null;
        const wodConfig = jobs["wod-selection"];
        if (wodConfig?.enabled) {
          try {
            const { selectWodForDate, addDays } = await import("@/lib/wod/select.server");
            const today = localDateISO(new Date());
            const due = isDueNow(wodConfig);
            const dates = due ? [today, addDays(today, 1)] : [today];
            const results = [];
            for (const d of dates) results.push(await selectWodForDate(db, d));
            const filled = results.flatMap((r) =>
              r.filled.map((f) => `${r.date} ${f.slot}: ${f.name}`),
            );
            const missing = results.flatMap((r) =>
              r.missing.map((m) => `${r.date} ${r.category} ${m}: no matching workout`),
            );
            wod = {
              status: (missing.length ? "failed" : "ok") as "failed" | "ok",
              summary: `${filled.length} slot(s) filled${missing.length ? `, ${missing.length} without a matching workout` : ""}.`,
            };
            if (due || filled.length || (missing.length && firstTickOfHour)) {
              await recordRun(db, {
                jobKey: "wod-selection",
                status: wod.status as "failed" | "ok",
                changed: filled.length > 0,
                summary: wod.summary,
                details: { added: filled, failures: missing },
                trigger: "schedule",
              });
            }
            if (missing.length && (due || firstTickOfHour))
              failures.push(...missing.map((m) => `wod:${m}`));
            if (due) await markJobRan(db, "wod-selection", wodConfig);
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`wod:${message}`);
            await recordRun(db, {
              jobKey: "wod-selection",
              status: "failed",
              summary: `Workout of the Day selection crashed: ${message}`,
              trigger: "schedule",
            });
          }
        }

        // Automatic SEO update — fixed time, once a day, only when something changed.
        let seo: { status: string; summary: string } | null = null;
        const seoConfig = jobs["seo-refresh"];
        if (seoConfig && isDueNow(seoConfig)) {
          try {
            const { runSeoRefresh } = await import("@/lib/cron/seo-refresh.server");
            const result = await runSeoRefresh(db, { config: seoConfig, trigger: "schedule" });
            seo = { status: result.status, summary: result.summary };
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
              trigger: "schedule",
            });
            if (result.status !== "failed") await markJobRan(db, "seo-refresh", seoConfig);
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`seo:${message}`);
            await recordRun(db, {
              jobKey: "seo-refresh",
              status: "failed",
              summary: `SEO update crashed: ${message}`,
              trigger: "schedule",
            });
          }
        }

        // Weekly blog article — Sunday at the fixed time set in the Admin panel.
        let blog: { status: string; summary: string } | null = null;
        const blogConfig = jobs["generate-weekly-blog-article"];
        if (blogConfig && isDueNow(blogConfig)) {
          try {
            const { runWeeklyBlogArticle } = await import("@/lib/cron/blog-generator.server");
            const result = await runWeeklyBlogArticle(db, {
              config: blogConfig,
              trigger: "schedule",
            });
            blog = { status: result.status, summary: result.summary };
            await recordRun(db, {
              jobKey: "generate-weekly-blog-article",
              status: result.status,
              changed: result.changed,
              summary: result.summary,
              details: { failures: result.failures },
              trigger: "schedule",
            });
            if (result.status !== "failed")
              await markJobRan(db, "generate-weekly-blog-article", blogConfig);
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`blog:${message}`);
            await recordRun(db, {
              jobKey: "generate-weekly-blog-article",
              status: "failed",
              summary: `Weekly blog article crashed: ${message}`,
              trigger: "schedule",
            });
          }
        }

        // Nightly system health check — fixed time, once a day, always emailed.
        let health: { status: string; summary: string } | null = null;
        const healthConfig = jobs["health-check"];
        if (healthConfig && isDueNow(healthConfig)) {
          try {
            const { runHealthCheck } = await import("@/lib/cron/health-check.server");
            const report = await runHealthCheck(db, {
              config: healthConfig,
              trigger: "schedule",
            });
            health = { status: report.status, summary: report.summary };
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
              trigger: "schedule",
            });
            await markJobRan(db, "health-check", healthConfig);
          } catch (e) {
            const message = e instanceof Error ? e.message : "error";
            failures.push(`health:${message}`);
            await recordRun(db, {
              jobKey: "health-check",
              status: "failed",
              summary: `Health check crashed: ${message}`,
              trigger: "schedule",
            });
          }
        }

        // Any failure inside an automated job is a real problem — alert the admin.
        if (failures.length) {
          const { reportError } = await import("@/lib/errors/report.server");
          for (const f of failures.slice(0, 10)) {
            const [source, maybeUser, ...rest] = f.split(":");
            const looksLikeUser = /^[0-9a-f-]{36}$/i.test(maybeUser ?? "");
            await reportError({
              source: `job-${source}`,
              message: (looksLikeUser ? rest.join(":") : [maybeUser, ...rest].join(":")) || f,
              route: "/api/public/hooks/daily-run",
              userId: looksLikeUser ? (maybeUser as string) : null,
            });
          }
        }

        // One history row per hourly tick for the member-facing jobs.
        if (motivations || failures.some((f) => f.startsWith("motivation:"))) {
          await recordRun(db, {
            jobKey: "daily-motivation",
            status: failures.some((f) => f.startsWith("motivation:")) ? "failed" : "ok",
            changed: motivations > 0,
            summary: `${motivations} motivation message(s) sent.`,
            details: { failures: failures.filter((f) => f.startsWith("motivation:")).slice(0, 50) },
          });
        }
        if (scheduleReminders) {
          await recordRun(db, {
            jobKey: "schedule-reminders",
            status: "ok",
            changed: true,
            summary: `${scheduleReminders} scheduled workout reminder(s) sent.`,
          });
        } else if (scheduleOn && !failures.some((f) => f.startsWith("schedule:"))) {
          await recordDailyHeartbeat(
            db,
            "schedule-reminders",
            "Checked: no scheduled workout reminders due so far today.",
          );
        }
        if (
          jobs["checkin-reminders"]?.enabled &&
          firstTickOfHour &&
          !checkinReminders &&
          !failures.some((f) => f.startsWith("checkin:"))
        ) {
          await recordDailyHeartbeat(
            db,
            "checkin-reminders",
            "Checked: no check-in reminders due so far today.",
          );
        }

        return Response.json({
          ok: true,
          scanned: profiles.length,
          motivations,
          wod,
          scheduleReminders,
          checkinReminders,
          seo,
          health,
          blog,
          failures,
        });
      },
    },
  },
});
