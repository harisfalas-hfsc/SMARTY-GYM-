import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCronConfigs, motivationPool } from "@/lib/cron/jobs.server";
import { DAILY_PROFILE_COLUMNS, runMotivationForUser, runWodForUser } from "@/lib/daily.server";
const db = supabaseAdmin as any;
const jobs = await getCronConfigs(db);
const { data } = await db.from("profiles").select(DAILY_PROFILE_COLUMNS).limit(5);
const profs = data ?? [];
console.log("profiles:", profs.length, profs.map((p:any)=>({tz:p.timezone,mh:p.motivation_hour,notify:p.notify_motivation,auto:p.auto_workout_enabled,wod:p.wod_mode,onboarded:p.onboarded})));
const pool = motivationPool(jobs["daily-motivation"]);
for (const p of profs) {
  try { console.log("motivation ->", await runMotivationForUser(db, p, pool)); }
  catch (e:any) { console.log("motivation FAIL", e.message); }
  try { const r = await runWodForUser(db, p.id, p); console.log("wod ->", JSON.stringify(r)); }
  catch (e:any) { console.log("wod FAIL", e.message); }
}
const { runScheduleReminders } = await import("@/lib/schedule-notify.server");
console.log("schedule reminders sent:", await runScheduleReminders(db));
const { reportError } = await import("@/lib/errors/report.server");
console.log("error alert:", JSON.stringify(await reportError({ source: "self-test", message: "Automated verification alert (safe to ignore)", route: "/scripts/verify", userId: null })));
