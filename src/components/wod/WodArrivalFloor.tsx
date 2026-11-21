import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardCheck, CalendarClock, Wand2, MessageCircle, Dumbbell, Home, Loader2, Play, Shuffle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getTodayWod, type WodCard, type WodDay } from "@/lib/wod.functions";
import { getCoachSnapshot } from "@/lib/coach.functions";
import { dailyWorkoutAction, type CoachSnapshot } from "@/lib/coach-snapshot";
import { CheckinPrompt } from "@/components/checkins/CheckinPrompt";
import { useCheckinRevision } from "@/hooks/useCheckinRevision";
import { localGreeting } from "@/lib/logbook/weekly-activity";
import { MobileWeeklyActivity } from "@/components/home/MobileWeeklyActivity";
import coachPhoto from "@/assets/haris-falas-coach.jpg";
import { coverVariant } from "@/lib/cover-image";
import { WodRotatingImage } from "@/components/wod/WodRotatingImage";
import fallbackImage from "@/assets/hero-wod-card.jpg";
import { readinessTone } from "@/lib/performance/readiness-tone";
import { useWodFeaturePhoto } from "@/hooks/useWodFeaturePhoto";

const SLOT: Record<string, { Icon: typeof Home; label: string; cls: string }> = {
  BODYWEIGHT: { Icon: Home, label: "No Equipment", cls: "bg-wod-bodyweight" },
  EQUIPMENT: { Icon: Dumbbell, label: "With Equipment", cls: "bg-wod-equipment" },
  RECOVERY: { Icon: Shuffle, label: "Recovery", cls: "bg-wod-recovery" },
};

/** Arrival floor: today's two WODs with a short Coach briefing, readiness and the week strip. */
export function WodArrivalFloor({ open, onOpenChange, visitor, accountKey, firstName }: { open: boolean; onOpenChange: (open: boolean) => void; visitor: boolean; accountKey: string | null; firstName?: string | null }) {
  const navigate = useNavigate();
  const revision = useCheckinRevision();
  const loadCoach = useServerFn(getCoachSnapshot);
  const [wod, setWod] = useState<WodDay | null>(null);
  const [wodFailed, setWodFailed] = useState(false);
  const [coach, setCoach] = useState<CoachSnapshot | null>(null);
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => { setGreeting(localGreeting(new Date())); }, [open]);
  useEffect(() => {
    if (!open || wod) return;
    void getTodayWod().then((r) => ("error" in r ? setWodFailed(true) : setWod(r.today))).catch(() => setWodFailed(true));
  }, [open, wod]);
  useEffect(() => { setCoach(null); }, [accountKey]);
  useEffect(() => {
    if (visitor || !open) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void loadCoach().then((next) => { if (active) setCoach(next); }).catch(() => { if (active) setCoach(null); });
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [open, visitor, accountKey, revision]);

  useEffect(() => {
    if (open) document.documentElement.dataset.smartyFloor = "open";
    else delete document.documentElement.dataset.smartyFloor;
    return () => { delete document.documentElement.dataset.smartyFloor; };
  }, [open]);

  const close = (next: boolean) => { onOpenChange(next); if (!next) window.dispatchEvent(new Event("smarty:coach-closed")); };
  const go = (to: string, params?: Record<string, string>) => { close(false); void navigate({ to: to as never, params: params as never }); };
  const openReadiness = () => {
    if (visitor) return go("/auth");
    close(false);
    void navigate({ to: "/logbook" as never, hash: "insights" });
    window.setTimeout(() => window.dispatchEvent(new Event("smarty:open-insights")), 0);
  };

  const openCoach = () => { onOpenChange(false); window.setTimeout(() => window.dispatchEvent(new Event("smarty:open-coach")), 0); };

  const member = !visitor && coach?.access !== "locked" && !!coach;
  const score = coach?.readinessDisplay.score ?? null;
  const name = member ? coach?.firstName ?? firstName : null;

  const today = member ? coach?.today ?? null : null;
  const TodayIcon = today?.kind === "completed" ? CheckCircle2 : today?.kind === "unfinished" ? ClipboardCheck : today?.kind === "scheduled" ? CalendarClock : Wand2;
  const todayAction = today ? (() => {
    const a = dailyWorkoutAction(today, today.kind === "unfinished" ? (today.started ? "Finish or mark complete" : "Mark complete & log") : "Start Training");
    return a && "params" in a ? { to: a.to, label: a.label, params: a.params as Record<string, string> } : null;
  })() : null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        onInteractOutside={(e) => { if ((e.target as HTMLElement | null)?.closest?.("[data-bottom-nav]")) e.preventDefault(); }}
        onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus({ preventScroll: true }); }}
        className="coach-floor fixed inset-2 left-2 top-2 max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))] flex h-auto w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-coach-bg p-0 text-coach-text shadow-none! outline-none sm:max-w-none md:inset-4 md:left-1/2 md:top-4 md:w-[min(64rem,calc(100vw-2rem))] md:-translate-x-1/2 [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-md [&>button]:border [&>button]:border-coach-line [&>button]:bg-coach-card [&>button]:p-2 [&>button]:text-coach-text [&>button]:opacity-100 [&>button_svg]:h-5 [&>button_svg]:w-5"
      >
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <DialogTitle className="sr-only">{greeting}{name ? `, ${name}` : ""}. Workout of the Day</DialogTitle>
          <DialogDescription className="sr-only">Your week, readiness and today's two workouts.</DialogDescription>
          <div className="space-y-4 px-4 pb-5 pt-3 sm:px-8 sm:pb-7">
            {/* Week strip (greeting lives here; taps through to the Logbook calendar) */}
            <div onClickCapture={() => close(false)} ><MobileWeeklyActivity hideArrow readiness={member && coach ? coach.readinessDisplay : null} /></div>

            {/* Readiness — opens Logbook with Insights already open */}
            <button type="button" onClick={openReadiness} className="app-card flex w-full items-center gap-4 p-4 text-left">
              <img src={coachPhoto} alt="Coach Haris Falas" className="h-14 w-14 shrink-0 rounded-full border border-coach-line object-cover object-top" />
              <div className="min-w-0 flex-1">
                {member && coach ? <>
                  <div className="flex items-center gap-2">
                    {score !== null
                      ? <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold ${readinessTone(score)}`}>{score}</span>
                      : <CalendarCheck className="h-5 w-5 shrink-0 text-coach-muted" />}
                    <p className="text-xs font-bold uppercase tracking-wide text-coach-muted">Readiness · <span className={readinessTone(score)}>{coach.readinessDisplay.label}</span></p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-coach-text">{coach.readinessDisplay.reason}</p>
                </> : <>
                  <p className="text-xs font-bold uppercase tracking-wide text-coach-gold">Readiness</p>
                  <p className="mt-1 text-sm leading-snug text-coach-text">{visitor ? "Sign in as a Premium member to see your readiness." : coach ? "Join Premium to unlock your readiness." : "Preparing your readiness…"}</p>
                </>}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-coach-muted" />
            </button>

            {member ? <CheckinPrompt /> : null}

            {/* Today's state — same rule and wording as Smarty Coach */}
            {member && today && today.kind !== "ready" ? (
              <section className="app-card space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <TodayIcon className={`h-5 w-5 shrink-0 ${today.kind === "completed" ? "text-coach-good" : "text-primary"}`} />
                  <h2 className="text-base font-extrabold uppercase tracking-wide text-coach-text">{today.title}</h2>
                </div>
                <p className="text-sm leading-snug text-coach-text">{today.message}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {today.kind === "completed" ? <>
                    <button type="button" onClick={() => go("/smarty-ritual")} className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover">Open Smarty Ritual</button>
                    <button type="button" onClick={openReadiness} className="app-card flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-bold text-coach-text">See Training Load</button>
                  </> : todayAction ? (
                    <button type="button" onClick={() => go(todayAction.to, todayAction.params)} className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover"><Play className="h-4 w-4" /> {todayAction.label}</button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* Two workouts */}
            <section className="app-card space-y-3 p-4">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-coach-text">Today's Workout of the Day</h2>
            <Link to="/wod" onClick={() => close(false)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">About Workout of the Day <ArrowRight className="h-4 w-4 shrink-0" /></Link>
            {wodFailed ? <p className="app-card p-6 text-center text-sm text-coach-muted">Workout of the Day is unavailable right now. Please try again shortly.</p>
              : !wod ? <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-coach-muted" /></div>
              : wod.cards.length === 0 ? <p className="app-card p-6 text-center text-sm text-coach-muted">Today's workouts are being prepared. Check back soon.</p>
              : <div className={`grid gap-4 ${wod.cards.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {wod.cards.map((c, index) => <WodFloorCard key={c.slot} card={c} photos={wod.cards.flatMap(({ workout }) => workout.image_url ? [workout.image_url] : [])} photoOffset={index} onStart={() => go("/smarty-workouts/$workoutId", { workoutId: c.workout.id })} />)}
                </div>}
            </section>

            {/* Other ways to train */}
            <section className="app-card space-y-3 p-4">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-coach-text">Other ways to train</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => go("/create-your-own-workout")} className="app-card flex min-h-14 items-center gap-3 p-4 text-left"><Sparkles className="h-5 w-5 shrink-0 text-primary" /><span className="flex-1 text-sm font-bold text-coach-text">Create your own workout</span><ArrowRight className="h-4 w-4 text-coach-muted" /></button>
              <button type="button" onClick={() => go("/smarty-workouts")} className="app-card flex min-h-14 items-center gap-3 p-4 text-left"><Dumbbell className="h-5 w-5 shrink-0 text-primary" /><span className="flex-1 text-sm font-bold text-coach-text">Explore Smarty Workouts</span><ArrowRight className="h-4 w-4 text-coach-muted" /></button>
            </div>
            </section>
            <button type="button" onClick={openCoach} className="mx-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><MessageCircle className="h-4 w-4" /> Open Smarty Coach <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WodFloorCard({ card, photos, photoOffset, onStart }: { card: WodCard; photos: string[]; photoOffset: number; onStart: () => void }) {
  const w = card.workout;
  const photo = useWodFeaturePhoto(w.image_url ?? fallbackImage, photos, photoOffset);
  const slot = SLOT[card.slot] ?? SLOT.EQUIPMENT;
  return (
    <article className="app-card overflow-hidden p-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <WodRotatingImage src={coverVariant(photo, 640) ?? photo} fallback={photo} alt="" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-hero-foreground ${slot.cls}`}><slot.Icon className="h-3.5 w-3.5" />{slot.label}</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-coach-text">{w.name}</h3>
        </div>
        <button type="button" onClick={onStart} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover">
          <Play className="h-4 w-4" /> Start Training
        </button>
      </div>
    </article>
  );
}
