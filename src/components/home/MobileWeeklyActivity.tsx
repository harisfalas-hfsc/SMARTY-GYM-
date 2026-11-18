import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMyAccessState } from "@/lib/access.functions";
import { supabase } from "@/integrations/supabase/client";
import { completedDays, localGreeting, localWeek } from "@/lib/logbook/weekly-activity";

export function MobileWeeklyActivity() {
  const { user, displayName, loading } = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const readAccess = useServerFn(getMyAccessState);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  const week = now ? localWeek(now) : [];
  const start = week[0]?.date.toISOString();
  const endDate = week[6] ? new Date(week[6].date) : null;
  endDate?.setDate(endDate.getDate() + 1);
  const end = endDate?.toISOString();
  const access = useQuery({
    queryKey: ["home-week-access", user?.id],
    queryFn: () => readAccess({}),
    enabled: !loading && Boolean(user),
  });
  const activity = useQuery({
    queryKey: ["home-week-activity", user?.id, start],
    enabled: Boolean(user && start && end && access.data?.premium),
    queryFn: async () => {
      if (!user || !start || !end) return [];
      // Owner-scoped, RLS-protected reads only. No activity is created here.
      const [workouts, sessions] = await Promise.all([
        supabase.from("workouts").select("completed_at").eq("user_id", user.id)
          .eq("status", "completed").gte("completed_at", start).lt("completed_at", end),
        supabase.from("workout_results").select("performed_at").eq("user_id", user.id)
          .gte("performed_at", start).lt("performed_at", end),
      ]);
      if (workouts.error || sessions.error) throw new Error("Training activity is unavailable");
      return [...(workouts.data ?? []).map(row => row.completed_at), ...(sessions.data ?? []).map(row => row.performed_at)];
    },
  });
  const completed = now && access.data?.premium ? completedDays(activity.data ?? [], now) : new Set<string>();
  const firstName = displayName?.trim().split(/\s+/)[0];
  const content = <>
    <div className="flex min-h-10 items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-bold leading-5">{now ? user ? `${localGreeting(now)}${firstName ? `, ${firstName}` : ""}` : "Ready to train today?" : "Your week"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{now ? now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "\u00a0"}</p>
      </div>
      <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
    <div className="mt-3 grid grid-cols-7 gap-1">
      {week.map(({ date, key, today }, index) => <span key={key} aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${today ? ", today" : ""}${completed.has(key) ? ", training recorded" : ""}`} aria-current={today ? "date" : undefined} className="flex min-h-14 min-w-0 flex-col items-center gap-1.5">
        <span className={`text-[10px] font-semibold ${today ? "text-brand-blue" : "text-muted-foreground"}`}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-bold ${completed.has(key) ? "border-brand-blue bg-brand-blue text-hero-foreground" : today ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-border text-muted-foreground"} ${today ? "ring-2 ring-brand-blue/30 ring-offset-2 ring-offset-card" : ""}`}>
          {completed.has(key) ? <Check aria-hidden="true" className="h-4 w-4" /> : date.getDate()}
        </span>
      </span>)}
    </div>
    {activity.isError && <p className="mt-2 text-xs text-muted-foreground">Training activity is temporarily unavailable.</p>}
    {!loading && !user && <p className="mt-2 text-xs font-semibold text-brand-blue">Track your streak</p>}
  </>;
  const className = "app-card block p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
  return user
    ? <Link to="/logbook" search={{ view: "calendar", filter: "all" }} aria-label="Open your Logbook calendar" className={className}>{content}</Link>
    : <Link to="/auth" aria-label="Sign in to track your training" className={className}>{content}</Link>;
}