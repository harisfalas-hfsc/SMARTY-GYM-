import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Dumbbell, Home, Loader2, Play, Shuffle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getTodayWod, type WodCard, type WodDay } from "@/lib/wod.functions";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { useCheckinRevision } from "@/hooks/useCheckinRevision";
import { localGreeting } from "@/lib/logbook/weekly-activity";
import { MobileWeeklyActivity } from "@/components/home/MobileWeeklyActivity";
import coachPhoto from "@/assets/haris-falas-coach.jpg";
import { coverVariant, fallbackTo } from "@/lib/cover-image";
import fallbackImage from "@/assets/hero-wod-card.jpg";

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
    void loadCoach().then(setCoach).catch(() => setCoach(null));
  }, [open, visitor, accountKey, revision]);

  useEffect(() => {
    if (open) document.documentElement.dataset.smartyFloor = "open";
    else delete document.documentElement.dataset.smartyFloor;
    return () => { delete document.documentElement.dataset.smartyFloor; };
  }, [open]);

  const close = (next: boolean) => { onOpenChange(next); if (!next) window.dispatchEvent(new Event("smarty:coach-closed")); };
  const go = (to: string, params?: Record<string, string>) => { close(false); void navigate({ to: to as never, params: params as never }); };
  const openCoach = () => { close(false); window.dispatchEvent(new Event("smarty:open-coach")); };

  const member = !visitor && coach?.access !== "locked" && !!coach;
  const score = coach?.readinessDisplay.score ?? null;
  const name = member ? coach?.firstName ?? firstName : null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        onInteractOutside={(e) => { if ((e.target as HTMLElement | null)?.closest?.("[data-bottom-nav]")) e.preventDefault(); }}
        onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus({ preventScroll: true }); }}
        className="coach-floor fixed inset-2 left-2 top-2 max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))] flex h-auto w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-coach-bg p-0 text-coach-text shadow-none! outline-none sm:max-w-none md:inset-4 md:left-1/2 md:top-4 md:w-[min(64rem,calc(100vw-2rem))] md:-translate-x-1/2 [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-md [&>button]:border [&>button]:border-coach-line [&>button]:bg-coach-card [&>button]:p-2 [&>button]:text-coach-text [&>button]:opacity-100 [&>button_svg]:h-5 [&>button_svg]:w-5"
      >
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <header className="border-b border-coach-line px-4 py-5 pr-14 sm:px-8 sm:py-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-coach-gold">Workout of the Day</p>
            <DialogTitle className="mt-1 text-2xl font-extrabold text-coach-text sm:text-4xl">{greeting}{name ? `, ${name}` : ""}.</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-coach-muted sm:text-base">
              {wod ? <>Today: <span className="font-semibold text-coach-text">{[wod.category, wod.difficulty].filter(Boolean).join(" · ")}</span>. Pick one and start training.</> : "Today's training is ready. Pick one and start."}
            </DialogDescription>
          </header>

          <div className="space-y-6 px-4 py-5 sm:px-8 sm:py-7">
            {/* Coach briefing */}
            <button type="button" onClick={openCoach} className="app-card flex w-full items-center gap-4 p-4 text-left">
              <img src={coachPhoto} alt="Coach Haris Falas" className="h-14 w-14 shrink-0 rounded-full border border-coach-line object-cover object-top" />
              <div className="min-w-0 flex-1">
                {member && coach ? <>
                  <div className="flex items-center gap-2">
                    {score !== null
                      ? <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold ${score >= 7 ? "border-coach-good text-coach-good" : "border-coach-line"}`}>{score}</span>
                      : <CalendarCheck className="h-5 w-5 shrink-0 text-coach-muted" />}
                    <p className="text-xs font-bold uppercase tracking-wide text-coach-muted">Readiness · <span className={score !== null && score >= 7 ? "text-coach-good" : "text-coach-text"}>{coach.readinessDisplay.label}</span></p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-coach-text">{coach.readinessDisplay.reason}</p>
                </> : <>
                  <p className="text-xs font-bold uppercase tracking-wide text-coach-gold">Smarty Coach</p>
                  <p className="mt-1 text-sm leading-snug text-coach-text">{visitor ? "Today's plan is ready. Sign in as a Premium member for your personal readiness briefing." : coach ? "Join Premium to unlock your readiness briefing." : "Preparing your briefing…"}</p>
                </>}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-coach-muted" />
            </button>

            {/* Week strip (stays visible; taps through to the Logbook calendar) */}
            <div onClickCapture={() => close(false)}><MobileWeeklyActivity /></div>

            {/* Two workouts */}
            {wodFailed ? <p className="app-card p-6 text-center text-sm text-coach-muted">Workout of the Day is unavailable right now. Please try again shortly.</p>
              : !wod ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-coach-muted" /></div>
              : wod.cards.length === 0 ? <p className="app-card p-6 text-center text-sm text-coach-muted">Today's workouts are being prepared. Check back soon.</p>
              : <div className={`grid gap-4 ${wod.cards.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {wod.cards.map((c) => <WodFloorCard key={c.slot} card={c} onStart={() => go("/smarty-workouts/$workoutId", { workoutId: c.workout.id })} />)}
                </div>}

            <button type="button" onClick={() => go("/wod")} className="mx-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">See the full Workout of the Day page <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WodFloorCard({ card, onStart }: { card: WodCard; onStart: () => void }) {
  const w = card.workout;
  const slot = SLOT[card.slot] ?? SLOT.EQUIPMENT;
  return (
    <article className="app-card overflow-hidden p-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img src={coverVariant(w.image_url, 640) ?? fallbackImage} onError={fallbackTo(w.image_url ?? fallbackImage)} alt="" className="h-full w-full object-cover" loading="eager" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-hero-foreground ${slot.cls}`}><slot.Icon className="h-3.5 w-3.5" />{slot.label}</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-coach-text">{w.name}</h3>
          <p className="mt-1 text-sm text-coach-muted">{[w.category, w.duration_min ? `${w.duration_min} min` : null, w.difficulty_stars ? `Level ${w.difficulty_stars}` : null].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={onStart} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover">
          <Play className="h-4 w-4" /> Start Training
        </button>
      </div>
    </article>
  );
}
