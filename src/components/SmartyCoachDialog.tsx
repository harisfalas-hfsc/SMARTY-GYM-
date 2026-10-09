import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, ArrowRight, CalendarClock, Dumbbell, Medal, RefreshCw, Sparkles, Target } from "lucide-react";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import coachIcon from "@/assets/smarty-coach.png";

export function SmartyCoachDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const load = useServerFn(getCoachSnapshot);
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CoachSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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
  }, [open, snapshot, loading, failed]);

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
      <DialogContent className="max-w-xl gap-4 p-4 sm:p-6">
        <DialogHeader className="items-start pr-10 text-left">
          <div className="flex items-center gap-3">
            <img src={coachIcon} alt="" className="h-14 w-14 shrink-0 object-contain" />
            <div>
              <DialogTitle>Smarty Coach</DialogTitle>
              <DialogDescription>Your training history, connected to what comes next.</DialogDescription>
            </div>
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
          <div className="space-y-3">
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
            <p className="text-center text-xs text-muted-foreground">This is a suggestion based only on information you logged. It does not change your plan automatically.</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}