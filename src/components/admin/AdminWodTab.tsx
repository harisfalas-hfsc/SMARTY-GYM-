import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, Eye, Loader2, RefreshCw, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminCycleTab } from "@/components/admin/AdminCycleTab";
import { adminWodAssign, adminWodCandidates, adminWodOverview, adminWodRepick, type WodAdminDay } from "@/lib/wod.functions";
import { SLOT_LABEL, type WodSlot } from "@/lib/wod/rules";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { difficultyLabel } from "@/lib/workout/spec";

type Candidate = { id: string; name: string; difficulty_stars: number; focus: string | null; duration_min: number; lastUsed: string | null };

function fmt(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export function AdminWodTab() {
  const overview = useServerFn(adminWodOverview);
  const repick = useServerFn(adminWodRepick);
  const candidates = useServerFn(adminWodCandidates);
  const assign = useServerFn(adminWodAssign);
  const [view, setView] = useState<"schedule" | "plan">("schedule");
  const [today, setToday] = useState<string>("");
  const [days, setDays] = useState<WodAdminDay[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [swap, setSwap] = useState<{ date: string; slot: WodSlot; any: boolean } | null>(null);
  const [list, setList] = useState<Candidate[] | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    const r = await overview({ data: { days: 36 } });
    if ("error" in r) toast.error(r.error);
    else {
      setToday(r.today);
      setDays(r.days);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doRepick(date: string, slot?: WodSlot, fillOnly = false) {
    setBusy(`${date}:${slot ?? "all"}`);
    try {
      const r = await repick({ data: { date, ...(slot ? { slot } : {}), fillOnly } });
      if ("error" in r) toast.error(r.error);
      else if (r.missing.length) toast.warning(`No matching workout for: ${r.missing.map((m) => SLOT_LABEL[m]).join(", ")}`);
      else toast.success(r.filled ? "Picked with the automatic rules." : "Already filled.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function openSwap(date: string, slot: WodSlot, any = false) {
    setSwap({ date, slot, any });
    setList(null);
    setFilter("");
    const r = await candidates({ data: { date, slot, any } });
    if ("error" in r) toast.error(r.error);
    else setList(r.workouts);
  }

  async function pick(id: string) {
    if (!swap) return;
    const r = await assign({ data: { date: swap.date, slot: swap.slot, workoutId: id } });
    if ("error" in r) toast.error(r.error);
    else {
      toast.success("Workout of the Day updated.");
      setSwap(null);
      await load();
    }
  }

  const upcomingMissing = (days ?? []).filter((d) => d.date >= today).flatMap((d) =>
    d.expected.filter((s) => (d.available[s] ?? 0) < 3).map((s) => ({ d, s, n: d.available[s] ?? 0 })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><CalendarDays className="h-5 w-5 text-primary" />Workout of the Day</h2>
          <p className="text-sm text-muted-foreground">Picked every night at 00:00 Cyprus time from Smarty Workouts, following the 84-day periodization. Overrides are never replaced automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "schedule" ? "default" : "outline"} size="sm" onClick={() => setView("schedule")}>Schedule</Button>
          <Button variant={view === "plan" ? "default" : "outline"} size="sm" onClick={() => setView("plan")}>Periodization system</Button>
        </div>
      </div>

      {view === "plan" ? (
        <AdminCycleTab />
      ) : days === null ? (
        <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {upcomingMissing.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-card p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-destructive" />Coverage check</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {upcomingMissing.map(({ d, s, n }) => (
                  <li key={`${d.date}-${s}`}>{fmt(d.date)} · {categoryLabel(d.category)} {d.difficulty ?? ""} {SLOT_LABEL[s]}: {n === 0 ? "no matching workout" : `only ${n} matching`}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {days.map((d) => {
              const isToday = d.date === today;
              const past = d.date < today;
              return (
                <div key={d.date} className={`rounded-lg border bg-card p-4 ${isToday ? "border-primary" : "border-border"} ${past ? "opacity-80" : ""}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{fmt(d.date)}</span>
                      {isToday && <Badge>Today</Badge>}
                      {d.date === days.find((x) => x.date > today)?.date && <Badge variant="outline">Tomorrow</Badge>}
                      <span className="text-sm text-muted-foreground">Day {d.cycleDay} · {categoryLabel(d.category)} · {d.difficulty ?? "—"}{d.focus ? ` · ${d.focus}` : ""}</span>
                    </div>
                    {!past && (
                      <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void doRepick(d.date)}>
                        {busy === `${d.date}:all` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}Re-pick day
                      </Button>
                    )}
                  </div>
                  <div className={`grid gap-3 ${d.expected.length > 1 ? "md:grid-cols-2" : ""}`}>
                    {d.expected.map((slot) => {
                      const card = d.cards.find((c) => c.slot === slot);
                      return (
                        <div key={slot} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">{SLOT_LABEL[slot]}</p>
                            <span className="text-[11px] text-muted-foreground">{d.available[slot] ?? 0} matching</span>
                          </div>
                          {card ? (
                            <>
                              <p className="mt-1 font-semibold">{card.workout.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {difficultyLabel(card.workout.difficulty_stars)} · {card.workout.duration_min} min{card.workout.focus ? ` · ${card.workout.focus}` : ""}
                                {card.source === "override" ? " · Override" : " · Automatic"}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">{past ? "Not picked" : "Will be picked at 00:00"}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {card && (
                              <Button variant="outline" size="sm" asChild>
                                <Link to="/smarty-workouts/$workoutId" params={{ workoutId: card.workout.id }}><Eye className="mr-1 h-3.5 w-3.5" />View</Link>
                              </Button>
                            )}
                            {!past && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => void openSwap(d.date, slot)}><Repeat2 className="mr-1 h-3.5 w-3.5" />{card ? "Swap" : "Choose"}</Button>
                                <Button variant="outline" size="sm" onClick={() => void openSwap(d.date, slot, true)}>Override (any)</Button>
                                <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => void doRepick(d.date, slot)}>Re-pick</Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!swap} onOpenChange={(o) => !o && setSwap(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{swap ? `${SLOT_LABEL[swap.slot]} for ${fmt(swap.date)}` : ""}</DialogTitle>
            <DialogDescription>
              {swap?.any ? "Any visible Smarty Workout of this type — outside the day's plan." : "Workouts that match the day's category, level and equipment."} Never-used workouts are listed first.
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} />
          {list === null ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {list.length === 0 && <p className="text-sm text-muted-foreground">No matching workouts.</p>}
              {[...list]
                .filter((w) => w.name.toLowerCase().includes(filter.toLowerCase()))
                .sort((a, b) => (a.lastUsed ?? "").localeCompare(b.lastUsed ?? ""))
                .map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{difficultyLabel(w.difficulty_stars)} · {w.duration_min} min{w.focus ? ` · ${w.focus}` : ""} · {w.lastUsed ? `last used ${w.lastUsed}` : "never used"}</p>
                    </div>
                    <Button size="sm" onClick={() => void pick(w.id)}>Pick</Button>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
