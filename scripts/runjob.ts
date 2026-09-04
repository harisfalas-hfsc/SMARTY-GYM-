import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCronConfigs } from "@/lib/cron/jobs.server";
const db = supabaseAdmin as any;
const jobs = await getCronConfigs(db);
const which = process.argv[2];
if (which === "health") {
  const { runHealthCheck } = await import("@/lib/cron/health-check.server");
  const r = await runHealthCheck(db, { config: jobs["health-check"], trigger: "manual" });
  console.log(JSON.stringify({status:r.status,summary:r.summary,items:r.items.map(i=>`${i.status.toUpperCase()} ${i.label}: ${i.detail}`)},null,1));
} else if (which === "seo") {
  const { runSeoRefresh } = await import("@/lib/cron/seo-refresh.server");
  const r = await runSeoRefresh(db, { config: jobs["seo-refresh"], trigger: "manual" });
  console.log(JSON.stringify({status:r.status,summary:r.summary,added:r.added.length,failures:r.failures},null,1));
} else if (which === "blog") {
  const { runWeeklyBlogArticle } = await import("@/lib/cron/blog-generator.server");
  const r = await runWeeklyBlogArticle(db, { config: jobs["generate-weekly-blog-article"], trigger: "manual", force: true } as any);
  console.log(JSON.stringify({status:r.status,summary:r.summary,failures:r.failures},null,1));
}
