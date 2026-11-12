import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight, BatteryLow, BookOpen, CalendarCheck, ChevronDown, ChevronRight, Clock, Compass, Dumbbell,
  Flame, HelpCircle, Library, NotebookPen, RefreshCw, Smile, Timer, Trophy, Users, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import { getCoachSnapshot } from "@/lib/coach.functions";
import type { CoachSnapshot } from "@/lib/coach-snapshot";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { feelingReply, type Feeling } from "@/lib/coach/feeling-replies";
import { BrandText } from "@/components/BrandText";
import coachPhoto from "@/assets/haris-falas-coach.jpg";

const CACHE_VERSION = 2;
const CACHE_MAX_AGE = 12 * 60 * 60 * 1000;
type CachedSnapshot = { version: number; savedAt: number; snapshot: CoachSnapshot };
const cacheKey = (k: string) => `smarty:coach-snapshot:v${CACHE_VERSION}:${k}`;

function readCached(accountKey: string | null): CoachSnapshot | null {
  if (!accountKey) return null;
  try {
    const p = JSON.parse(localStorage.getItem(cacheKey(accountKey)) ?? "null") as CachedSnapshot | null;
    if (!p || p.version !== CACHE_VERSION || Date.now() - p.savedAt > CACHE_MAX_AGE) return null;
    return p.snapshot;
  } catch { return null; }
}
function saveCached(accountKey: string | null, snapshot: CoachSnapshot) {
  if (!accountKey) return;
  try { localStorage.setItem(cacheKey(accountKey), JSON.stringify({ version: CACHE_VERSION, savedAt: Date.now(), snapshot })); } catch { /* optional */ }
}

const FEELINGS: { id: Feeling; label: string; icon: LucideIcon }[] = [
  { id: "great", label: "Feeling great", icon: Smile },
  { id: "tired", label: "A little tired", icon: BatteryLow },
  { id: "sore", label: "Sore from last session", icon: Flame },
  { id: "short", label: "Short on time", icon: Clock },
  { id: "decide", label: "Help me decide", icon: HelpCircle },
];

const QUESTIONS = [
  { q: "What should I train today?", icon: Compass, a: "" },
  { q: "I'm feeling sore. What should I do?", icon: Flame, a: "Mild soreness is fine — train another area or choose Recovery. If a muscle is very sore or painful, rest it. Sleep, water and normal meals help it recover. Sharp pain is not soreness: stop and get it checked." },
  { q: "How much rest between sets?", icon: Timer, a: "For strength, rest about 90–120 seconds so every set is strong. For muscle building, 60–90 seconds. For conditioning, 30–60 seconds. In my workouts the rest is already written — follow it." },
  { q: "How do I choose my working weight?", icon: Dumbbell, a: "Choose a weight you can lift for every rep with good form, finishing each set with about two or three reps left in the tank (around 7–8 out of 10 effort). If form breaks, go lighter. If it feels easy, go up a little next time." },
];

const TOPICS: { title: string; items: string[] }[] = [
  { title: "Training Principles", items: ["Consistency beats intensity. Three good sessions a week, every week, wins.", "Always start with the Activation section — never skip your warm-up.", "Progress a little at a time: one more rep or slightly more weight."] },
  { title: "Strength & Hypertrophy", items: ["Good form first, then load.", "Control every rep — no swinging, no rushing.", "Train each muscle group about twice a week."] },
  { title: "Conditioning", items: ["Work hard in the intervals, recover fully in the rests.", "You should be breathing hard but still in control of your movement.", "Mix conditioning with strength across the week."] },
  { title: "Recovery & Mobility", items: ["Sleep is your best recovery tool.", "Easy days help hard days work better.", "Do the Cool-down section after every workout."] },
  { title: "Nutrition Fundamentals", items: ["Eat enough protein at every meal.", "Drink water through the day, more on training days.", "Keep it simple: mostly whole foods, regular meals."] },
];

function Section({ n, title, subtitle, children }: { n: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <header className="flex items-baseline gap-3 border-b border-coach-line pb-3">
        <span className="text-sm font-bold text-coach-gold">{n}</span>
        <div>
          <h3 className="text-base font-extrabold uppercase tracking-wide text-coach-text sm:text-lg">{title}</h3>
          {subtitle ? <p className="text-sm text-coach-muted">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function Tile({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-coach-line bg-coach-card p-3 text-center text-sm font-semibold text-coach-text transition-colors hover:border-coach-gold/70">
      <Icon className="h-6 w-6 text-coach-gold" />{label}
    </button>
  );
}

const card = "rounded-md border border-coach-line bg-coach-card p-4 sm:p-5";
const goldBtn = "flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-coach-gold px-4 text-sm font-extrabold uppercase tracking-wide text-coach-bg transition-opacity hover:opacity-90";

export function SmartyCoachDialog({ open, onOpenChange, visitor = false, accountKey }: { open: boolean; onOpenChange: (open: boolean) => void; visitor?: boolean; accountKey: string | null }) {
  const load = useServerFn(getCoachSnapshot);
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CoachSnapshot | null>(() => readCached(accountKey));
  const [loading, setLoading] = useState(!visitor && !readCached(accountKey));
  const [failed, setFailed] = useState(false);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [turn, setTurn] = useState(0);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [openTopic, setOpenTopic] = useState<number | null>(null);

  const fetchSnapshot = () => {
    if (visitor) return;
    if (!snapshot) setLoading(true);
    setFailed(false);
    void load().then((next) => { setSnapshot(next); saveCached(accountKey, next); }).catch(() => setFailed(true)).finally(() => setLoading(false));
  };

  useEffect(() => { setSnapshot(readCached(accountKey)); setFailed(false); }, [accountKey]);
  useEffect(() => { if (!visitor && open) fetchSnapshot(); }, [open, visitor, accountKey]);
  useEffect(() => {
    if (open) document.documentElement.dataset.smartyCoach = "open";
    else delete document.documentElement.dataset.smartyCoach;
    return () => { delete document.documentElement.dataset.smartyCoach; };
  }, [open]);

  const changeOpen = (next: boolean) => { onOpenChange(next); if (!next) window.dispatchEvent(new Event("smarty:coach-closed")); };
  const go = (to: string) => { changeOpen(false); void navigate({ to: to as never }); };

  const followAction = () => {
    if (!snapshot) return;
    const action = snapshot.action;
    changeOpen(false);
    if (action.to === "/logbook") void navigate({ to: action.to, search: action.search ?? { view: "list", filter: "all" }, hash: action.hash });
    else if (action.to === "/smarty-workouts/$workoutId") void navigate({ to: action.to, params: action.params });
    else void navigate({ to: action.to });
  };

  const locked = visitor || snapshot?.access === "locked";
  const member = !locked && !!snapshot;
  const name = snapshot?.firstName;
  const focus = snapshot?.todayFocus;
  const score = snapshot?.readinessDisplay.score ?? null;

  const answerFor = (i: number) => {
    if (i !== 0) return QUESTIONS[i].a;
    if (member && snapshot) return snapshot.recommendation;
    return "Start with today's Workout of the Day — it's planned for you. As a Premium member you'll get my personal recommendation based on your own training.";
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus({ preventScroll: true }); }}
        className="fixed inset-2 left-2 top-2 flex h-auto w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-lg border-coach-line bg-coach-bg p-0 text-coach-text outline-none sm:max-w-none md:inset-4 md:left-1/2 md:top-4 md:w-[min(64rem,calc(100vw-2rem))] md:-translate-x-1/2 [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-md [&>button]:border [&>button]:border-coach-line [&>button]:bg-coach-card [&>button]:p-2 [&>button]:text-coach-text [&>button]:opacity-100 [&>button_svg]:h-5 [&>button_svg]:w-5"
      >
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          {/* Header */}
          <header className="flex items-center gap-4 border-b border-coach-line px-4 py-5 pr-14 sm:gap-6 sm:px-8 sm:py-7">
            <img src={coachPhoto} alt="Coach Haris Falas" className="h-20 w-20 shrink-0 rounded-md border border-coach-line object-cover object-top sm:h-28 sm:w-28" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-coach-gold">Smarty Coach</p>
              <DialogTitle className="mt-1 text-2xl font-extrabold text-coach-text sm:text-4xl">Hey, I'm Haris.</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-coach-muted sm:text-base">
                {member && name ? <BrandText text={`Good to see you, ${name}. Let's make today count.`} name={name} /> : "Let's make today count."}
              </DialogDescription>
            </div>
          </header>

          <div className="space-y-10 px-4 py-6 sm:px-8 sm:py-8">
            {/* Feelings */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-coach-text sm:text-lg">How are you feeling today?</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
                {FEELINGS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={feeling === f.id} onClick={() => { setTurn((t) => (feeling === f.id ? t + 1 : 0)); setFeeling(f.id); }}
                    className={`flex min-h-14 items-center gap-2 rounded-md border bg-coach-card px-3 py-3 text-left text-sm font-semibold text-coach-text transition-colors last:col-span-2 sm:flex-col sm:justify-center sm:text-center sm:last:col-span-1 ${feeling === f.id ? "border-coach-gold" : "border-coach-line hover:border-coach-gold/60"}`}>
                    <f.icon className="h-5 w-5 shrink-0 text-coach-gold" />{f.label}
                  </button>
                ))}
              </div>
              {feeling ? (
                <div className="flex gap-3 rounded-md border border-coach-line bg-coach-card p-4" role="status">
                  <img src={coachPhoto} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover object-top" />
                  <p className="text-sm leading-relaxed text-coach-text">{feelingReply(feeling, { member, seed: accountKey, date: new Date(), readinessScore: snapshot?.readinessDisplay?.score ?? null, lastSessionName: snapshot?.lastSession?.name ?? null, recommendationName: null, turn })}</p>
                </div>
              ) : null}
            </section>

            <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
              {/* 01 Briefing */}
              <Section n="01" title="Your Daily Briefing">
                {locked ? (
                  <div className={`${card} space-y-4`}>
                    <p className="text-lg font-extrabold text-coach-text">A personal coach in your pocket.</p>
                    <p className="text-sm leading-relaxed text-coach-muted">Every SMARTYGYM workout is designed by me, Haris Falas. As a Premium member I read your check-ins and your training, tell you how ready you are, what you did last and exactly what to do next.</p>
                    {!visitor ? <p className="text-sm font-semibold text-coach-text">{snapshot?.wasPremium ? "Your Premium membership is inactive. Reactivate it to unlock your personal briefing." : "Join Premium to unlock your personal briefing."}</p> : null}
                    <button type="button" className={goldBtn} onClick={() => (visitor ? go("/auth") : followAction())}>
                      {visitor ? "Sign in or join" : snapshot?.wasPremium ? "Reactivate Premium" : "Join Premium"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : loading && !snapshot ? (
                  <div className={`${card} space-y-3`} aria-label="Preparing your briefing">
                    <p className="font-semibold">Preparing your briefing…</p>
                    <div className="h-16 animate-pulse rounded-md bg-coach-line/50" />
                    <div className="h-16 animate-pulse rounded-md bg-coach-line/50" />
                  </div>
                ) : failed && !snapshot ? (
                  <div className={`${card} text-center`}>
                    <p className="font-semibold">Your briefing is taking a little longer.</p>
                    <button type="button" onClick={fetchSnapshot} className="mx-auto mt-4 flex min-h-12 items-center gap-2 rounded-md border border-coach-line px-4 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Try again</button>
                  </div>
                ) : snapshot ? (
                  <div className={`${card} divide-y divide-coach-line p-0 sm:p-0`}>
                    <div className="flex items-center gap-4 p-4 sm:p-5">
                      {score !== null ? (
                        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 ${score >= 7 ? "border-coach-good" : "border-coach-line"}`}>
                          <span className="text-xl font-extrabold leading-none">{score}</span><span className="text-[10px] text-coach-muted">/10</span>
                        </div>
                      ) : <CalendarCheck className="h-10 w-10 shrink-0 text-coach-muted" />}
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-coach-muted">Your readiness</p>
                        <p className={`font-extrabold ${score !== null && score >= 7 ? "text-coach-good" : "text-coach-text"}`}>{snapshot.readinessDisplay.label}</p>
                        <p className="text-sm text-coach-muted">{snapshot.readinessDisplay.reason}</p>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-coach-muted">Your last session</p>
                      {snapshot.lastSession ? (
                        <>
                          <p className="mt-1 font-extrabold">{snapshot.lastSession.name}</p>
                          <p className="text-sm text-coach-muted">{[snapshot.lastSession.date, ...snapshot.lastSession.facts].join(" · ")}</p>
                        </>
                      ) : <p className="mt-1 text-sm text-coach-muted">No completed session yet — your first one starts today.</p>}
                    </div>
                    <div className="space-y-3 p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-coach-gold">My recommendation</p>
                      {snapshot.headline !== "Welcome back" ? <p className="text-lg font-extrabold leading-tight"><BrandText text={snapshot.headline} name={name} /></p> : null}
                      <p className="text-sm text-coach-muted">{[focus?.category, focus?.bodyFocus, focus?.duration ? `${focus.duration} min` : null, focus?.stars ? `Level ${focus.stars}` : null].filter(Boolean).join(" · ")}</p>
                      {focus?.workoutName ? <p className="text-sm font-semibold">{focus.workoutName}</p> : null}
                      <button type="button" className={goldBtn} onClick={followAction}>{snapshot.action.label || "Start my recommended workout"} <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                ) : null}
              </Section>

              {/* 02 Train */}
              <Section n="02" title="Train">
                <div className={`${card} space-y-3`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-coach-gold">Today's featured workout</p>
                  <p className="text-2xl font-extrabold">Workout of the Day</p>
                  <p className="text-sm text-coach-muted">Your daily training challenge.</p>
                  <button type="button" className={goldBtn} onClick={() => go("/wod")}>View today's WOD <ArrowRight className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Tile icon={Dumbbell} label="Browse Workouts" onClick={() => go("/smarty-workouts")} />
                  <Tile icon={Wrench} label="Build My Workout" onClick={() => go("/create-your-own-workout")} />
                  <Tile icon={Users} label="Community" onClick={() => go("/shared-workouts")} />
                </div>
              </Section>
            </div>

            {/* 03 Ask */}
            <Section n="03" title="Ask Coach Haris" subtitle="Real coaching guidance, whenever you need it.">
              <div className="space-y-2">
                {QUESTIONS.map((item, i) => (
                  <div key={item.q} className="rounded-md border border-coach-line bg-coach-card">
                    <button type="button" aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? null : i)} className="flex min-h-13 w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold">
                      <item.icon className="h-5 w-5 shrink-0 text-coach-gold" /><span className="flex-1">{item.q}</span>
                      <ChevronRight className={`h-5 w-5 shrink-0 text-coach-muted transition-transform ${openQ === i ? "rotate-90" : ""}`} />
                    </button>
                    {openQ === i ? <p className="border-t border-coach-line px-4 py-3 text-sm leading-relaxed text-coach-muted"><BrandText text={answerFor(i)} name={name} /></p> : null}
                  </div>
                ))}
              </div>
              <p className="pt-2 text-xs font-bold uppercase tracking-wide text-coach-muted">More topics</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {TOPICS.map((t, i) => (
                  <div key={t.title} className="rounded-md border border-coach-line bg-coach-card">
                    <button type="button" aria-expanded={openTopic === i} onClick={() => setOpenTopic(openTopic === i ? null : i)} className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold">
                      {t.title}<ChevronDown className={`h-4 w-4 shrink-0 text-coach-muted transition-transform ${openTopic === i ? "rotate-180" : ""}`} />
                    </button>
                    {openTopic === i ? <ul className="space-y-2 border-t border-coach-line px-3 py-3 text-sm text-coach-muted">{t.items.map((x) => <li key={x}>{x}</li>)}</ul> : null}
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* 04 Learn */}
              <Section n="04" title="Learn & Explore">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Tile icon={BookOpen} label="Coaching Articles" onClick={() => go("/blog")} />
                  <Tile icon={Zap} label="Gym Tools" onClick={() => go("/tools")} />
                  <Tile icon={Library} label="Exercise Library" onClick={() => go("/exercise-library")} />
                </div>
              </Section>

              {/* 05 Journey */}
              <Section n="05" title="Your Training Journey">
                {member && snapshot ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { icon: CalendarCheck, label: "Workouts this week", value: snapshot.insights ? String(snapshot.insights.workouts) : "—" },
                        { icon: NotebookPen, label: "Last trained", value: snapshot.lastSession?.date ?? "—" },
                        { icon: Trophy, label: "Personal record", value: snapshot.personalRecord ?? "—" },
                      ].map((m) => (
                        <div key={m.label} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-coach-line bg-coach-card p-3 text-center">
                          <m.icon className="h-5 w-5 text-coach-gold" />
                          <span className="line-clamp-2 text-sm font-extrabold">{m.value}</span>
                          <span className="text-[11px] text-coach-muted">{m.label}</span>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => go("/logbook")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-coach-gold text-sm font-extrabold uppercase tracking-wide text-coach-gold">Open my Logbook <ArrowRight className="h-4 w-4" /></button>
                  </>
                ) : (
                  <div className={card}>
                    <p className="text-sm text-coach-muted">Your workouts, progress and personal records live in your Logbook as a Premium member.</p>
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
