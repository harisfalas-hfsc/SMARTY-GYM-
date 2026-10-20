import { useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, ChevronDown, Dumbbell, Gauge, RefreshCw, Target, type LucideIcon } from "lucide-react";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandText } from "@/components/BrandText";
import coachPhoto from "@/assets/about-smartygym-card.jpg";

const CACHE_VERSION = 2;
const CACHE_MAX_AGE = 12 * 60 * 60 * 1000;

type CachedSnapshot = { version: number; savedAt: number; snapshot: CoachSnapshot };

function BriefingCard({ title, icon: Icon, tone, children }: { title: string; icon: LucideIcon; tone: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-primary/45 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Icon className={`h-5 w-5 shrink-0 ${tone}`} />{title}
      </h3>
      <div className="mt-2 space-y-1 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

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
  const briefingRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const element = briefingRef.current;
    if (!element || !open) { setHasMore(false); return; }
    element.scrollTop = 0;
    const update = () => setHasMore(element.scrollHeight - element.clientHeight - element.scrollTop > 4);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [open, snapshot, visitor]);

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

  const showCoachIntroduction = visitor || snapshot?.access === "locked";

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus({ preventScroll: true }); }} className="outline-none flex h-[30.625rem] max-w-lg flex-col gap-3 overflow-hidden p-4 sm:max-w-2xl sm:p-5">
        <DialogHeader className="shrink-0 items-center px-10 text-center sm:items-center sm:px-10 sm:text-center">
          <DialogTitle className="text-primary">Smarty Coach</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {showCoachIntroduction ? <><span className="block">Your personal coach. Anytime, anywhere.</span>{!visitor ? <span className="block"><BrandText text={`${snapshot?.wasPremium ? "Welcome back" : "Welcome"}${snapshot?.firstName ? `, ${snapshot.firstName}` : ""}.`} name={snapshot?.firstName} /></span> : null}</> : snapshot ? <><span className="block"><BrandText text={snapshot.greeting.replace(/[.!]$/, "!")} name={snapshot.firstName} /></span><span className="block">Welcome back.</span></> : "Preparing your personal briefing."}
          </DialogDescription>
        </DialogHeader>

        <div ref={briefingRef} aria-label="Smarty Coach briefing" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto pr-1 pb-1 [scrollbar-width:thin] [scrollbar-color:var(--primary)_var(--secondary)]">
        <div className="space-y-3">
        <img src={coachPhoto} alt="Coach holding a tablet with a workout demonstration in the gym" className="aspect-[2/1] w-full rounded-md object-cover" />
        {showCoachIntroduction ? (
          <div className="space-y-3">
            <section className="px-1 py-1 text-center">
              <h3 className="text-lg font-extrabold text-primary">A personal trainer in your pocket.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your daily training companion — helping you choose what to train, when to push and when to recover. Become a Premium member for personal guidance that grows with your training.</p>
              {!visitor ? <p className="mt-3 text-sm font-semibold text-primary">{snapshot?.wasPremium ? "Your Premium membership is inactive. Reactivate it to unlock your personal guidance." : "Subscribe to Premium to unlock your personal guidance."}</p> : null}
            </section>
            <Button className="w-full" onClick={() => { if (visitor) { changeOpen(false); void navigate({ to: "/auth" }); } else followAction(); }}>
              {visitor ? "Sign in or join" : snapshot?.wasPremium ? "Reactivate Premium" : "Subscribe now"} <ArrowRight />
            </Button>
          </div>
        ) : loading && !snapshot ? (
          <div className="space-y-3" aria-label="Preparing your personal coaching briefing">
            <section className="rounded-md border-2 border-primary bg-primary/5 p-4 text-center">
              <p className="mt-2 font-bold">Connecting your latest training</p>
              <p className="mt-1 text-sm text-muted-foreground">Readiness, goals and recent performance are being brought together.</p>
            </section>
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
            <div className="h-24 animate-pulse rounded-md bg-secondary" />
          </div>
        ) : failed && !snapshot ? (
          <div className="rounded-md border border-border-strong bg-secondary/50 p-4 text-center">
            <p className="font-semibold">Your recommendation is taking a little longer.</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing is blocked. Try again when you are ready.</p>
            <Button className="mt-4" variant="outline" onClick={fetchSnapshot}><RefreshCw /> Try again</Button>
          </div>
        ) : snapshot ? (
            <div className="space-y-3">
            <BriefingCard title="Today’s focus" icon={Target} tone="text-primary">
                  {snapshot.headline !== "Welcome back" ? <p className="text-base font-extrabold leading-tight"><BrandText text={snapshot.headline} name={snapshot.firstName} /></p> : null}
                  <p className="text-muted-foreground"><BrandText text={snapshot.recommendation} name={snapshot.firstName} /></p>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {[snapshot.todayFocus.category, snapshot.todayFocus.bodyFocus, snapshot.todayFocus.intensity].filter(Boolean).join(" · ")}
                  </p>
                  {snapshot.todayFocus.workoutName ? <p className="mt-1 text-sm font-bold">{snapshot.todayFocus.workoutName}</p> : null}
                  {snapshot.todayFocus.duration || snapshot.todayFocus.stars ? (
                    <p className="text-xs text-muted-foreground">
                      {[snapshot.todayFocus.duration ? `${snapshot.todayFocus.duration} min` : null, snapshot.todayFocus.stars ? `${snapshot.todayFocus.stars} star${snapshot.todayFocus.stars === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
            </BriefingCard>

            <div className="grid gap-3 sm:grid-cols-2">
              <BriefingCard title="Readiness" icon={Gauge} tone="text-chart-2">
                <p className="text-base font-extrabold leading-tight">{snapshot.readinessDisplay.label}{snapshot.readinessDisplay.score !== null ? ` · ${snapshot.readinessDisplay.score}/10` : ""}</p>
                <p className="text-muted-foreground">
                  {snapshot.readinessDisplay.reason}
                </p>
              </BriefingCard>

              <BriefingCard title="Your last session" icon={Activity} tone="text-chart-3">
                {snapshot.lastSession ? (
                  <>
                    <p className="text-base font-extrabold leading-tight">{snapshot.lastSession.name}</p>
                    <p className="text-xs text-muted-foreground">{snapshot.lastSession.date}</p>
                    {snapshot.lastSession.facts.length ? <p className="mt-1 text-sm text-muted-foreground">{snapshot.lastSession.facts.join(" · ")}</p> : null}
                  </>
                ) : <p className="mt-2 text-sm text-muted-foreground">No completed session yet.</p>}
              </BriefingCard>
            </div>

            <BriefingCard title="Why this fits" icon={Brain} tone="text-chart-4">
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {snapshot.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-primary">•</span><span><BrandText text={reason} name={snapshot.firstName} /></span></li>)}
              </ul>
              {(snapshot.goals.primary || snapshot.goals.secondary) ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Training Profile · {[snapshot.goals.primary ? `Primary: ${snapshot.goals.primary}` : null, snapshot.goals.secondary ? `Secondary: ${snapshot.goals.secondary}` : null].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {snapshot.equipment.length ? <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><Dumbbell className="mt-0.5 h-3.5 w-3.5" /> Uses only equipment from your Training Profile.</p> : null}
            </BriefingCard>

            <Button className="w-full" onClick={followAction}>{snapshot.action.label}<ArrowRight /></Button>
          </div>
        ) : null}
        </div>
        </div>
        {hasMore ? <Button variant="ghost" size="icon" className="mx-auto h-7 w-10 shrink-0 text-primary" aria-label="Show more of your Coach briefing" title="Show more" onClick={() => briefingRef.current?.scrollBy({ top: (briefingRef.current?.clientHeight ?? 300) * 0.75, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><ChevronDown className="h-5 w-5" /></Button> : null}
      </DialogContent>
    </Dialog>
  );
}
