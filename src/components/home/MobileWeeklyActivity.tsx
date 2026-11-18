import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronRight, ClipboardCheck, Dumbbell, Trophy, Users } from "lucide-react";
import { iconInk } from "@/lib/icon-tone";
import { useAuth } from "@/hooks/useAuth";
import { getMyAccessState } from "@/lib/access.functions";
import { localGreeting, localWeek } from "@/lib/logbook/weekly-activity";
import { briefingGroups, eventsByDay, type BriefingGroup } from "@/lib/logbook/activity";
import { loadActivity } from "@/lib/logbook/activity-reads";
import { dayKey } from "@/lib/logbook/rows";

const GROUP_VIEW: Record<BriefingGroup, { Icon: typeof Dumbbell; tone: string; one: string; many: string }> = {
  trained: { Icon: Trophy, tone: "logbook", one: "workout done", many: "workouts done" },
  workouts: { Icon: Dumbbell, tone: "workouts", one: "workout saved", many: "workout actions" },
  checkins: { Icon: ClipboardCheck, tone: "Smarty Check-ins", one: "check-in", many: "check-ins" },
  community: { Icon: Users, tone: "Smarty Community", one: "community action", many: "community actions" },
};

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
    queryFn: () => loadActivity(user!.id, start!, end!),
  });
  const byDay = now && access.data?.premium ? eventsByDay(activity.data ?? [], now) : new Map();
  const completed = new Set<string>(byDay.keys());
  const todayEvents = now ? byDay.get(dayKey(now)) ?? [] : [];
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
      {week.map(({ date, key, today }, index) => <span key={key} aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${today ? ", today" : ""}${completed.has(key) ? ", activity recorded" : ""}`} aria-current={today ? "date" : undefined} className="flex min-h-14 min-w-0 flex-col items-center gap-1.5">
        <span className={`text-[10px] font-semibold ${today ? "text-brand-blue" : "text-muted-foreground"}`}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-bold ${completed.has(key) ? "border-brand-blue bg-brand-blue text-hero-foreground" : today ? "border-brand-blue bg-transparent text-brand-blue" : "border-border text-muted-foreground"} ${today ? "ring-2 ring-brand-blue/30 ring-offset-2 ring-offset-card" : ""}`}>
          {completed.has(key) ? <Check aria-hidden="true" className="h-4 w-4" /> : date.getDate()}
        </span>
      </span>)}
    </div>
    {user && access.data?.premium && now && (todayEvents.length
      ? <div className="mt-3 flex items-center gap-3 overflow-hidden whitespace-nowrap" aria-label="Today's activity">
          <span className="text-xs font-semibold text-muted-foreground">Today</span>
          {briefingGroups(todayEvents).map(([g, n]) => { const { Icon, tone, one, many } = GROUP_VIEW[g]; return (
            <span key={g} aria-label={`${n} ${n === 1 ? one : many}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums">
              <Icon aria-hidden="true" className={`h-4 w-4 ${iconInk(tone)}`} />{n}
            </span>); })}
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">Tap for details</span>
        </div>
      : <p className="mt-2 text-xs text-muted-foreground">Nothing yet today</p>)}
    {activity.isError && <p className="mt-2 text-xs text-muted-foreground">Training activity is temporarily unavailable.</p>}
    {!loading && !user && <p className="mt-2 text-xs font-semibold text-brand-blue">Track your streak</p>}
  </>;
  const className = "app-card block p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
  return user
    ? <Link to="/logbook" search={{ view: "calendar", filter: "all" }} aria-label="Open your Logbook calendar" className={className}>{content}</Link>
    : <Link to="/auth" aria-label="Sign in to track your training" className={className}>{content}</Link>;
}