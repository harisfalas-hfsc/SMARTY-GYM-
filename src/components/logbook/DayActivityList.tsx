import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ACTIVITY_LABEL } from "@/lib/logbook/activity";
import { loadActivity } from "@/lib/logbook/activity-reads";

/** Everything the member did on the selected day(s), read-only. Every line wraps — nothing is cut off. */
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
  const oneDay = start === end;
  return (
    <section className="app-card p-4" aria-label="What you did">
      <p className="flex items-center gap-2 text-base font-bold">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-blue text-[10px] leading-none text-primary-foreground">✓</span>
        What you did
        {events.length ? <span className="text-sm font-normal text-muted-foreground">· {events.length}</span> : null}
      </p>
      {q.isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        : q.isError ? <p className="mt-2 text-sm text-muted-foreground">Activity is temporarily unavailable.</p>
        : events.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing done {oneDay ? "on this day" : "on these days"}.</p>
        : <ul className="mt-3 divide-y divide-border">{events.map((e, i) => (
          <li key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5">
            <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">
              {new Date(e.at).toLocaleString(undefined, oneDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" })}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug">
                {ACTIVITY_LABEL[e.kind]}
                {e.sample ? <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 align-middle text-[10px] font-medium text-muted-foreground">Sample</span> : null}
              </span>
              <span className="block break-words text-sm leading-snug text-muted-foreground">{e.label}</span>
            </span>
          </li>))}</ul>}
    </section>
  );
}
