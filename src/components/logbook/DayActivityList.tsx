import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ACTIVITY_LABEL } from "@/lib/logbook/activity";
import { loadActivity } from "@/lib/logbook/activity-reads";

/** Everything the member did on the selected day(s), read-only. */
export function DayActivityList({ start, end }: { start: string; end: string }) {
  const { user } = useAuth();
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`); to.setDate(to.getDate() + 1);
  const q = useQuery({
    queryKey: ["logbook-activity", user?.id, start, end],
    enabled: Boolean(user),
    queryFn: () => loadActivity(user!.id, from.toISOString(), to.toISOString()),
  });
  const events = (q.data ?? []).filter(e => new Date(e.at) <= new Date());
  return (
    <section className="app-card p-4" aria-label="Activity">
      <p className="flex items-center gap-2 text-sm font-bold"><Activity className="h-4 w-4 text-brand-blue" />Activity</p>
      {q.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
        : q.isError ? <p className="mt-2 text-xs text-muted-foreground">Activity is temporarily unavailable.</p>
        : events.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No activity recorded.</p>
        : <ul className="mt-2 space-y-1.5">{events.map((e, i) => (
          <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
            <span className="text-xs tabular-nums text-muted-foreground">{new Date(e.at).toLocaleString(undefined, start === end ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="min-w-0 truncate"><span className="font-semibold">{ACTIVITY_LABEL[e.kind]}</span> · {e.label}</span>
          </li>))}</ul>}
    </section>
  );
}
