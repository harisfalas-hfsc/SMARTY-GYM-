import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, Dumbbell, Gauge, RefreshCw, Target } from "lucide-react";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import coachIcon from "@/assets/smarty-coach.png";

const CACHE_VERSION = 2;
const CACHE_MAX_AGE = 12 * 60 * 60 * 1000;

type CachedSnapshot = { version: number; savedAt: number; snapshot: CoachSnapshot };

function cacheKey(accountKey: string) {
  return `smarty:coach-snapshot:v${CACHE_VERSION}:${accountKey}`;
}

function readCached(accountKey: string | null): CoachSnapshot | null {
  if (!accountKey) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(accountKey)) ?? "null") as CachedSnapshot | null;
    if (!parsed || parsed.version !== CACHE_VERSION || Date.now() - parsed.savedAt > CACHE_MAX_AGE) return null;
    return parsed.snapshot;
  } catch {
    return null;
  }
}

function saveCached(accountKey: string | null, snapshot: CoachSnapshot) {
  if (!accountKey) return;
  try {
    const value: CachedSnapshot = { version: CACHE_VERSION, savedAt: Date.now(), snapshot };
    localStorage.setItem(cacheKey(accountKey), JSON.stringify(value));
  } catch {
    /* the live snapshot still works when storage is unavailable */
  }
}

export function SmartyCoachDialog({
  open,
  onOpenChange,
  visitor = false,
  accountKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor?: boolean;
  accountKey: string | null;
}) {
  const load = useServerFn(getCoachSnapshot);
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CoachSnapshot | null>(() => readCached(accountKey));
  const [loading, setLoading] = useState(!visitor && !readCached(accountKey));
  const [failed, setFailed] = useState(false);

  const fetchSnapshot = () => {
    if (visitor) return;
    if (!snapshot) setLoading(true);
    setFailed(false);
    void load()
      .then((next) => {
        setSnapshot(next);
        saveCached(accountKey, next);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSnapshot(readCached(accountKey));
    setFailed(false);
  }, [accountKey]);

  useEffect(() => {
    if (!visitor && open) fetchSnapshot();
  }, [open, visitor, accountKey]);

  useEffect(() => {
    if (open) document.documentElement.dataset.smartyCoach = "open";
    else delete document.documentElement.dataset.smartyCoach;
    return () => {
      delete document.documentElement.dataset.smartyCoach;
    };
  }, [open]);

  const changeOpen = (next: boolean) => {
    onOpenChange(next);
    if (!next) window.dispatchEvent(new Event("smarty:coach-closed"));
  };

  const followAction = () => {
    if (!snapshot) return;
    const action = snapshot.action;
    changeOpen(false);
    if (action.to === "/logbook") {
      void navigate({ to: action.to, search: action.search ?? { view: "list", filter: "all" }, hash: action.hash });
    } else if (action.to === "/smarty-workouts/$workoutId") {
      void navigate({ to: action.to, params: action.params });
    } else {
      void navigate({ to: action.to });
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-lg gap-3 p-4 sm:max-w-2xl sm:p-5">
        <DialogHeader className="items-center pr-0 text-center">
          <div className="flex items-center gap-2">
            <img src={coachIcon} alt="" className="h-8 w-8 shrink-0 object-contain" />
            <DialogTitle>Smarty Coach</DialogTitle>
          </div>
          <DialogDescription>
            {visitor ? "Personal training guidance, built from your own training." : snapshot?.greeting ?? "Preparing your personal briefing."}
          </DialogDescription>
        </DialogHeader>

        {visitor ? (
          <div className="space-y-3">
            <section className="rounded-md border-2 border-primary bg-primary/5 p-4 text-center">
              <Brain className="mx-auto h-7 w-7 text-primary" />
              <h3 className="mt-2 text-lg font-extrabold">Your training. Your next step.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to connect Smarty Coach with your readiness, goals and completed workouts.</p>
            </section>
            <Button className="w-full" onClick={() => { changeOpen(false); void navigate({ to: "/auth" }); }}>
              Sign in or join <ArrowRight />
            </Button>
          </div>
        ) : loading && !snapshot ? (
          <div className="space-y-3" aria-label="Preparing your personal coaching briefing">
            <section className="rounded-md border-2 border-primary bg-primary/5 p-4 text-center">
              <img src={coachIcon} alt="" className="mx-auto h-10 w-10 object-contain" />
              <p className="mt-2 font-bold">Connecting your latest training</p>
              <p className="mt-1 text-sm text-muted-foreground">Readiness, goals and recent performance are being brought together.</p>
            </section>
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
            <div className="h-24 animate-pulse rounded-md bg-secondary" />
          </div>
        ) : failed && !snapshot ? (
          <div className="rounded-md border border-border bg-secondary/50 p-4 text-center">
            <p className="font-semibold">Your recommendation is taking a little longer.</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing is blocked. Try again when you are ready.</p>
            <Button className="mt-4" variant="outline" onClick={fetchSnapshot}><RefreshCw /> Try again</Button>
          </div>
        ) : snapshot ? (
          <div className="max-h-[calc(100dvh-10rem)] space-y-3 overflow-y-auto pr-1 pb-1">
            <section className="rounded-md border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Target /></span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-primary">Today’s focus</p>
                  <h3 className="mt-1 text-lg font-extrabold leading-tight">{snapshot.headline}</h3>
                  <p className="mt-1 text-sm leading-relaxed">{snapshot.recommendation}</p>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {[snapshot.todayFocus.category, snapshot.todayFocus.bodyFocus, snapshot.todayFocus.intensity].filter(Boolean).join(" · ")}
                  </p>
                  {snapshot.todayFocus.workoutName ? <p className="mt-1 text-sm font-bold">{snapshot.todayFocus.workoutName}</p> : null}
                  {snapshot.todayFocus.duration || snapshot.todayFocus.stars ? (
                    <p className="text-xs text-muted-foreground">
                      {[snapshot.todayFocus.duration ? `${snapshot.todayFocus.duration} min` : null, snapshot.todayFocus.stars ? `${snapshot.todayFocus.stars} star${snapshot.todayFocus.stars === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <section className="rounded-md border border-border p-4">
                <div className="flex items-center gap-2 font-bold"><Gauge className="text-chart-2" /> Readiness</div>
                <p className="mt-2 text-lg font-extrabold">{snapshot.readinessDisplay.label}{snapshot.readinessDisplay.score !== null ? ` · ${snapshot.readinessDisplay.score}/10` : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {snapshot.readinessDisplay.basis === "check-in" ? "From today’s Smarty Check-in and recent training." : snapshot.readinessDisplay.basis === "training-history" ? "From your recent Training Load and logged sessions." : "More logged training or a Check-in will make this more specific."}
                </p>
              </section>

              <section className="rounded-md border border-border p-4">
                <div className="flex items-center gap-2 font-bold"><Activity className="text-chart-3" /> Your last session</div>
                {snapshot.lastSession ? (
                  <>
                    <p className="mt-2 font-semibold">{snapshot.lastSession.name}</p>
                    <p className="text-xs text-muted-foreground">{snapshot.lastSession.date}</p>
                    {snapshot.lastSession.facts.length ? <p className="mt-1 text-sm text-muted-foreground">{snapshot.lastSession.facts.join(" · ")}</p> : null}
                  </>
                ) : <p className="mt-2 text-sm text-muted-foreground">No completed session yet.</p>}
              </section>
            </div>

            <section className="rounded-md border border-border p-4">
              <div className="flex items-center gap-2 font-bold"><Brain className="text-chart-4" /> Why this fits</div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {snapshot.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-primary">•</span><span>{reason}</span></li>)}
              </ul>
              {(snapshot.goals.primary || snapshot.goals.secondary) ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Training Profile · {[snapshot.goals.primary ? `Primary: ${snapshot.goals.primary}` : null, snapshot.goals.secondary ? `Secondary: ${snapshot.goals.secondary}` : null].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {snapshot.equipment.length ? <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><Dumbbell className="mt-0.5 h-3.5 w-3.5" /> Uses only equipment from your Training Profile.</p> : null}
            </section>

            <Button className="w-full" onClick={followAction}>{snapshot.action.label}<ArrowRight /></Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
