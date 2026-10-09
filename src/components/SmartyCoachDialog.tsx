import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Library,
  Medal,
  PencilLine,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import coachIcon from "@/assets/smarty-coach.png";

type NavTarget =
  | { to: "/wod" }
  | { to: "/smarty-workouts" }
  | { to: "/create-your-own-workout" }
  | { to: "/shared-workouts" }
  | { to: "/blog" }
  | { to: "/exercise-library" }
  | { to: "/tools" };

function OptionRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function SmartyCoachDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const load = useServerFn(getCoachSnapshot);
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CoachSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<"home" | "next">("home");

  const fetchSnapshot = () => {
    setLoading(true);
    setFailed(false);
    void load()
      .then(setSnapshot)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open && !snapshot && !loading && !failed) fetchSnapshot();
    if (!open) setView("home");
  }, [open, snapshot, loading, failed]);

  const go = (target: NavTarget["to"]) => {
    onOpenChange(false);
    void navigate({ to: target });
  };

  const followAction = () => {
    if (!snapshot) return;
    const action = snapshot.action;
    onOpenChange(false);
    if (action.to === "/logbook") {
      void navigate({ to: action.to, search: action.search ?? { view: "list", filter: "all" }, hash: action.hash });
      return;
    }
    if (action.to === "/smarty-workouts/$workoutId") {
      void navigate({ to: action.to, params: action.params });
      return;
    }
    void navigate({ to: action.to });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-3 p-4 sm:p-6">
        <DialogHeader className="text-center sm:items-center sm:pr-0 sm:text-center">
          <div className="mx-auto inline-flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <img src={coachIcon} alt="" className="h-8 w-8 shrink-0 object-contain" />
              <DialogTitle>Smarty Coach</DialogTitle>
            </div>
            <DialogDescription>
              {snapshot ? `Hello, ${snapshot.firstName}. Welcome back.` : "Your training history, connected to what comes next."}
            </DialogDescription>
          </div>
        </DialogHeader>




        {loading ? (
          <div className="space-y-3" aria-label="Loading coaching recommendation">
            <div className="h-24 animate-pulse rounded-md bg-secondary" />
            <div className="h-32 animate-pulse rounded-md bg-secondary" />
          </div>
        ) : failed ? (
          <div className="rounded-md border border-border bg-secondary/50 p-4 text-center">
            <p className="font-semibold">Your recommendation is taking a little longer.</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing is blocked. Try again when you are ready.</p>
            <Button className="mt-4" variant="outline" onClick={fetchSnapshot}><RefreshCw /> Try again</Button>
          </div>
        ) : snapshot ? (
          view === "home" ? (
            <div className="max-h-[calc(100dvh-9rem)] space-y-3 overflow-y-auto pr-1">
              {/* Card 1: What to do next — opens the detailed recommendation view */}
              <button
                type="button"
                onClick={() => setView("next")}
                className="w-full rounded-md border-2 border-primary bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase text-primary">What to do next</span>
                    <span className="mt-1 block text-lg font-extrabold leading-tight">{snapshot.headline}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-foreground">{snapshot.recommendation}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">See the full recommendation <ChevronRight className="h-4 w-4" /></span>
                  </span>
                </div>
              </button>

              {/* Card 2: Training options */}
              <section className="rounded-md border border-border p-4">
                <div className="flex items-center gap-2 font-bold"><Dumbbell className="text-primary" /> Train your way</div>
                <div className="mt-3 space-y-2">
                  <OptionRow icon={<CalendarDays />} title="Workout of the Day" subtitle="Today's shared workout, fresh every day." onClick={() => go("/wod")} />
                  <OptionRow icon={<Dumbbell />} title="Smarty Workouts" subtitle="The full library, built by Haris." onClick={() => go("/smarty-workouts")} />
                  <OptionRow icon={<PencilLine />} title="Create Your Own Workout" subtitle="Build it yourself or let the Coach build it." onClick={() => go("/create-your-own-workout")} />
                  <OptionRow icon={<Users />} title="Shared Workouts" subtitle="See what other members are training." onClick={() => go("/shared-workouts")} />
                </div>
              </section>

              {/* Card 3: Learn and explore */}
              <section className="rounded-md border border-border p-4">
                <div className="flex items-center gap-2 font-bold"><BookOpen className="text-primary" /> Learn and explore</div>
                <div className="mt-3 space-y-2">
                  <OptionRow icon={<BookOpen />} title="Blog" subtitle="Training articles and guides." onClick={() => go("/blog")} />
                  <OptionRow icon={<Library />} title="Exercise Library" subtitle="Every exercise, with video and form tips." onClick={() => go("/exercise-library")} />
                  <OptionRow icon={<Wrench />} title="Smarty Tools" subtitle="Timers, trackers and calculators." onClick={() => go("/tools")} />
                </div>
              </section>

              <p className="text-center text-xs text-muted-foreground">This is a suggestion based only on information you logged. It does not change your plan automatically.</p>
            </div>
          ) : (
            <div className="max-h-[calc(100dvh-9rem)] space-y-3 overflow-y-auto pr-1">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setView("home")}><ArrowLeft /> Back</Button>

              <section className="rounded-md border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-primary">Hi {snapshot.firstName}</p>
                    <h3 className="mt-1 text-lg font-extrabold leading-tight">{snapshot.headline}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{snapshot.recommendation}</p>
                  </div>
                </div>
              </section>

              {snapshot.lastSession ? (
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 font-bold"><Activity className="text-primary" /> Your last session</div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                    <p className="font-semibold">{snapshot.lastSession.name}</p>
                    <p className="text-xs text-muted-foreground">{snapshot.lastSession.date}</p>
                  </div>
                  {snapshot.lastSession.facts.length ? <p className="mt-1 text-sm text-muted-foreground">{snapshot.lastSession.facts.join(" · ")}</p> : null}
                </section>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 font-bold"><Medal className="text-amber-500" /> Compared with before</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{snapshot.comparison}</p>
                  {snapshot.personalRecord ? <p className="mt-2 text-sm font-semibold text-primary">Personal record · {snapshot.personalRecord}</p> : null}
                </section>
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 font-bold"><Target className="text-emerald-500" /> What to do next</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{snapshot.nextStep}</p>
                </section>
              </div>

              {snapshot.smartyPick ? (
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 font-bold"><Dumbbell className="text-primary" /> Recommended Smarty Workout</div>
                  <p className="mt-2 font-semibold">{snapshot.smartyPick.name}</p>
                  <p className="text-xs text-muted-foreground">{snapshot.smartyPick.category} · {snapshot.smartyPick.minutes} min · {snapshot.smartyPick.stars} star{snapshot.smartyPick.stars === 1 ? "" : "s"}</p>
                </section>
              ) : null}

              {snapshot.custom ? (
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 font-bold"><Dumbbell className="text-primary" /> Build this session yourself</div>
                  <p className="mt-1 text-xs text-muted-foreground">{snapshot.custom.dose} · {snapshot.custom.rest} · {snapshot.custom.effort}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {snapshot.custom.exercises.map((e) => <li key={e.id} className="flex gap-2"><span className="text-primary">•</span>{e.name}</li>)}
                  </ul>
                </section>
              ) : null}

              {snapshot.insights ? (
                <section className="rounded-md border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold"><BarChart3 className="text-primary" /> Your Insights</div>
                    <span className="text-xs text-muted-foreground">{snapshot.insights.week}</span>
                  </div>
                  <p className="mt-2 text-sm">{snapshot.insights.headline}</p>
                  {snapshot.insights.tip ? <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">{snapshot.insights.tip.title}.</span> {snapshot.insights.tip.body}</p> : null}
                  <button type="button" className="mt-2 text-sm font-semibold text-primary hover:underline" onClick={() => { onOpenChange(false); void navigate({ to: "/logbook", search: { view: "list", filter: "all" } as never, hash: "insights" }); }}>Open full Insights</button>
                </section>
              ) : null}

              <section className="rounded-md border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2 font-bold"><CalendarClock className="text-primary" /> Why this fits</div>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {snapshot.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-primary">•</span><span>{reason}</span></li>)}
                </ul>
                {snapshot.equipment.length ? <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Dumbbell className="mt-0.5 h-3.5 w-3.5" /> Uses only equipment from your Training Profile.</p> : null}
              </section>

              <Button className="w-full" onClick={followAction}>{snapshot.action.label}<ArrowRight /></Button>
            </div>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
