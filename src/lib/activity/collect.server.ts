import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReport, fmtDateTime, rangeBounds, type ActivityEvent, type ActivityReport, type ActivityUser } from "./report";

type Row = Record<string, any>;
const inRange = (v: string | null | undefined, from: string, to: string) => !!v && v >= from && v < to;

async function rows(q: PromiseLike<{ data: unknown; error: { message: string } | null }>, label: string): Promise<Row[]> {
  const { data, error } = await q;
  if (error) throw new Error(`${label}: ${error.message}`);
  return (data as Row[] | null) ?? [];
}

/** Every member action between two Cyprus dates (inclusive), grouped by member. */
export async function collectUserActivity(db: SupabaseClient, fromDate: string, toDate: string): Promise<ActivityReport> {
  const { from, to } = rangeBounds(fromDate, toDate);
  const span = (col: string) => `and(${col}.gte.${from},${col}.lt.${to})`;
  const ev: ActivityEvent[] = [];
  const push = (userId: string | null, at: string | null, kind: ActivityEvent["kind"], text: string) => {
    if (userId && at) ev.push({ userId, at, kind, text });
  };

  const [profiles, subs, workouts, reactions, ratings, comments, checkins, badges, feedback, threads] = await Promise.all([
    rows(db.from("profiles").select("id,display_name,email,created_at,onboarded,updated_at").limit(10000), "profiles"),
    rows(db.from("subscriptions").select("user_id,status,created_at,current_period_end,cancel_at_period_end").order("created_at", { ascending: false }).limit(10000), "subscriptions"),
    rows(
      db
        .from("workouts")
        .select("id,user_id,name,category,created_at,completed_at,shared_at,scheduled_at,favorited_at,updated_at,community_source_id,is_wod")
        .or([span("created_at"), span("completed_at"), span("shared_at"), span("favorited_at"), span("updated_at")].join(","))
        .limit(10000),
      "workouts",
    ),
    rows(db.from("community_reactions").select("user_id,workout_id,value,updated_at").gte("updated_at", from).lt("updated_at", to).limit(5000), "reactions"),
    rows(db.from("community_ratings").select("user_id,workout_id,value,updated_at").gte("updated_at", from).lt("updated_at", to).limit(5000), "ratings"),
    rows(db.from("community_comments").select("user_id,workout_id,body,created_at").gte("created_at", from).lt("created_at", to).limit(5000), "comments"),
    rows(db.from("smarty_checkins").select("user_id,morning_completed_at,night_completed_at,daily_smarty_score").or([span("morning_completed_at"), span("night_completed_at")].join(",")).limit(5000), "check-ins"),
    rows(db.from("user_badges").select("user_id,badge_name,earned_at").gte("earned_at", from).lt("earned_at", to).limit(5000), "badges"),
    rows(db.from("workout_feedback").select("user_id,workout_id,feeling,rpe,created_at").gte("created_at", from).lt("created_at", to).limit(5000), "feedback"),
    rows(db.from("support_threads").select("user_id,subject,created_at").not("user_id", "is", null).gte("created_at", from).lt("created_at", to).limit(2000), "messages"),
  ]);

  // Names of workouts referenced by social rows.
  const names = new Map<string, string>(workouts.map((w) => [w.id, w.name]));
  const missing = [...new Set([...reactions, ...ratings, ...comments, ...feedback].map((r) => r.workout_id).filter((id) => id && !names.has(id)))];
  for (let i = 0; i < missing.length; i += 200) {
    const part = await rows(db.from("workouts").select("id,name").in("id", missing.slice(i, i + 200)), "workout names");
    for (const w of part) names.set(w.id, w.name);
  }
  const wn = (id: string) => `“${names.get(id) ?? "a workout"}”`;

  for (const p of profiles) {
    if (inRange(p.created_at, from, to)) push(p.id, p.created_at, "joined", "Created an account");
  }
  const latestSub = new Map<string, Row>();
  for (const s of subs) {
    if (!latestSub.has(s.user_id)) latestSub.set(s.user_id, s);
    if (inRange(s.created_at, from, to)) push(s.user_id, s.created_at, "subscribed", "Subscribed to Premium");
    if (inRange(s.current_period_end, from, to))
      push(s.user_id, s.current_period_end, "membership-end", s.cancel_at_period_end || !["active", "trialing"].includes(s.status) ? "Membership ended" : "Membership period renewed");
  }
  for (const w of workouts) {
    const label = `“${w.name}”${w.category ? ` (${w.category})` : ""}`;
    if (inRange(w.created_at, from, to))
      push(w.user_id, w.created_at, w.community_source_id ? "copied" : "created", w.community_source_id ? `Added shared workout ${label} to the Logbook` : w.is_wod ? `Opened Workout of the Day ${label}` : `Created workout ${label}`);
    if (inRange(w.completed_at, from, to)) push(w.user_id, w.completed_at, "completed", `Completed ${label}`);
    if (inRange(w.shared_at, from, to)) push(w.user_id, w.shared_at, "shared", `Shared ${label} with the community`);
    if (inRange(w.favorited_at, from, to)) push(w.user_id, w.favorited_at, "favorited", `Favorited ${label}`);
    if (w.scheduled_at && inRange(w.updated_at, from, to) && !inRange(w.completed_at, from, to))
      push(w.user_id, w.updated_at, "scheduled", `Scheduled ${label} for ${fmtDateTime(w.scheduled_at)}`);
  }
  for (const r of reactions) push(r.user_id, r.updated_at, r.value > 0 ? "liked" : "disliked", `${r.value > 0 ? "Liked" : "Disliked"} ${wn(r.workout_id)}`);
  for (const r of ratings) push(r.user_id, r.updated_at, "rated", `Rated ${wn(r.workout_id)} ${r.value}/5`);
  for (const c of comments) push(c.user_id, c.created_at, "commented", `Commented on ${wn(c.workout_id)}: “${String(c.body).slice(0, 80)}”`);
  for (const c of checkins) {
    if (inRange(c.morning_completed_at, from, to)) push(c.user_id, c.morning_completed_at, "checkin", "Completed the Morning Smarty Check-in");
    if (inRange(c.night_completed_at, from, to))
      push(c.user_id, c.night_completed_at, "checkin", `Completed the Night Smarty Check-in${c.daily_smarty_score != null ? ` (score ${c.daily_smarty_score})` : ""}`);
  }
  for (const b of badges) push(b.user_id, b.earned_at, "badge", `Earned badge “${b.badge_name}”`);
  for (const f of feedback) push(f.user_id, f.created_at, "feedback", `Gave feedback on ${wn(f.workout_id)}${f.rpe ? ` (effort ${f.rpe}/10)` : ""}`);
  for (const t of threads) push(t.user_id, t.created_at, "message", `Sent a message: “${t.subject}”`);

  const people: Omit<ActivityUser, "events">[] = profiles.map((p) => {
    const s = latestSub.get(p.id);
    const active = s && ["active", "trialing"].includes(s.status) && (!s.current_period_end || s.current_period_end > new Date().toISOString());
    return {
      userId: p.id,
      name: p.display_name || (p.email ? String(p.email).split("@")[0] : "Member"),
      email: p.email ?? "",
      joinedAt: p.created_at,
      access: active ? (s.cancel_at_period_end ? "Premium (cancels at period end)" : "Premium") : s ? "Premium ended" : "Free member",
      membershipEndsAt: s?.current_period_end ?? null,
    };
  });
  return buildReport(fromDate, toDate, people, ev);
}
