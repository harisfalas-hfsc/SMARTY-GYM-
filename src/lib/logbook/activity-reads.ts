import { supabase } from "@/integrations/supabase/client";
import { activityEvents } from "./activity";
import { demoActivityOn, demoEvents } from "./demo-activity";

/** Owner-scoped, RLS-protected reads only; never writes. */
export async function loadActivity(userId: string, start: string, end: string) {
  if (demoActivityOn()) return demoEvents(new Date()).filter(e => e.at >= start && e.at < end);
  const range = <T,>(q: T) => q;
  const [w, c, cm, rx, rt] = await Promise.all([
    supabase.from("workouts").select("name,created_by,created_at,completed_at,status,shared_at,favorited_at").eq("user_id", userId).is("deleted_at", null)
      .or(`and(created_at.gte.${start},created_at.lt.${end}),and(completed_at.gte.${start},completed_at.lt.${end}),and(shared_at.gte.${start},shared_at.lt.${end}),and(favorited_at.gte.${start},favorited_at.lt.${end})`),
    supabase.from("smarty_checkins").select("morning_completed_at,night_completed_at").eq("user_id", userId)
      .or(`and(morning_completed_at.gte.${start},morning_completed_at.lt.${end}),and(night_completed_at.gte.${start},night_completed_at.lt.${end})`),
    supabase.from("community_comments").select("created_at").eq("user_id", userId).is("deleted_at", null).gte("created_at", start).lt("created_at", end),
    supabase.from("community_reactions").select("created_at").eq("user_id", userId).gte("created_at", start).lt("created_at", end),
    supabase.from("community_ratings").select("created_at").eq("user_id", userId).gte("created_at", start).lt("created_at", end),
  ].map(range));
  const err = [w, c, cm, rx, rt].find(r => r.error);
  if (err) throw new Error("Activity is unavailable");
  const inRange = (t: string | null) => !!t && t >= start && t < end;
  return activityEvents({
    workouts: (w.data ?? []) as never, checkins: (c.data ?? []) as never,
    comments: (cm.data ?? []) as never, reactions: (rx.data ?? []) as never, ratings: (rt.data ?? []) as never,
  }).filter(e => inRange(new Date(e.at).toISOString()));
}
