import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Check, ChevronLeft, ChevronRight, Cylinder, Flag, Minus, Pause, Play, Plus, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";
import { toast } from "sonner";
import { playTimerBeep, unlockTimerBeep } from "@/lib/timer-beep";
import { supabase } from "@/integrations/supabase/client";
import { useKeepScreenAwake } from "@/hooks/useKeepScreenAwake";
import { buildSlides, parseStepTiming, type WorkoutStep } from "@/lib/workout/parse-steps";
import {
  deriveStepTracking,
  deriveWorkoutResultModel,
  parsePlanned,
} from "@/lib/workout/tracking-model";
import { saveWorkoutResult, startWorkoutAttempt } from "@/lib/performance.functions";
import { prescriptionHash } from "@/lib/workout/prescription-fingerprint";
import { PerformanceEditorDialog } from "./PerformanceEditorDialog";
import { WorkoutResultDialog, type WorkoutResultInput } from "./WorkoutResultDialog";
import { SessionDebriefDialog } from "./SessionDebriefDialog";
import { getSessionFeedback } from "@/lib/feedback.functions";
import { setWorkoutStatus } from "@/lib/coach.functions";
import { useExerciseMedia } from "./ExerciseMediaProvider";
import { useAuth } from "@/hooks/useAuth";
import { afterPlayerSet, playerLogStepIndex, playerSetTarget, prescribedRestSeconds } from "@/lib/workout/player-flow";


function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function WorkoutPlayerDialog({
  open,
  onOpenChange,
  steps,
  softTissue = [],
  workoutName,
  workoutId,
  category = null,
  format = null,
  html = null,
  previewMode = false,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: WorkoutStep[];
  softTissue?: string[];
  workoutName: string;
  workoutId: string;
  category?: string | null;
  format?: string | null;
  html?: string | null;
  previewMode?: boolean;
  onFinish: () => void;
}) {
  const slides = useMemo(() => buildSlides(steps, softTissue), [steps, softTissue]);
  const resultModel = useMemo(
    () => deriveWorkoutResultModel({ category, format, html, steps }),
    [category, format, html, steps],
  );
  const storeResult = useServerFn(saveWorkoutResult);
  const beginAttempt = useServerFn(startWorkoutAttempt);
  const readFeedback = useServerFn(getSessionFeedback);
  const markStatus = useServerFn(setWorkoutStatus);
  const { user } = useAuth();
  const [attemptReady, setAttemptReady] = useState(false);
  const loggedAnythingRef = useRef(false);
  const planHash = useMemo(
    () => prescriptionHash({ format, category, steps }),
    [format, category, steps],
  );

  const { details, ensure } = useExerciseMedia();
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [advanceAfterRest, setAdvanceAfterRest] = useState(false);
  const completingRef = useRef(false);
  const [remaining, setRemaining] = useState(0);
  const [logged, setLogged] = useState<Record<number, number>>({});
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [heldSeconds, setHeldSeconds] = useState("");
  const [distance, setDistance] = useState("");
  const [savingSet, setSavingSet] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Awaited<ReturnType<typeof getSessionFeedback>>["feedback"]>(null);
  const [attempt, setAttempt] = useState(1);
  const [lastSet, setLastSet] = useState<Record<number, { reps: string; weight: string; seconds: string; distance: string }>>({});
  const soundOnRef = useRef(false);
  const remainingRef = useRef(0);
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => {
    try {
      setSoundOn(window.localStorage.getItem("smarty-player-sound") === "on");
    } catch {
      /* storage unavailable */
    }
  }, []);
  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try {
      window.localStorage.setItem("smarty-player-sound", next ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
    if (next) {
      // Phones only allow sound after a tap; this tap unlocks it and plays a sample.
      unlockTimerBeep();
      playTimerBeep();
    }
  }
  const startedAtRef = useRef<number | null>(null);

  useKeepScreenAwake(open);

  useEffect(() => {
    if (open && startedAtRef.current === null) startedAtRef.current = Date.now();
    if (!open) startedAtRef.current = null;
  }, [open]);

  // Each run of a workout is its own attempt, so repeats never overwrite history.
  useEffect(() => {
    if (!open || previewMode) return;
    let active = true;
    setAttemptReady(false);
    if (!user) return;
    void beginAttempt({ data: { workoutId } })
      .then((res) => {
        if (active) {
          setAttempt(res.attempt);
          setAttemptReady(true);
        }
      })
      .catch(() => { if (active) toast.error("Could not start your session. Close the player and try again."); });
    return () => {
      active = false;
    };
  }, [open, workoutId, user?.id, previewMode, beginAttempt]);

  // The phone back button steps back one slide instead of quitting the session.
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    window.history.pushState({ smartyPlayer: true }, "");
    const onPop = () => {
      if (api && api.canScrollPrev()) {
        api.scrollPrev();
        window.history.pushState({ smartyPlayer: true }, "");
        return;
      }
      onOpenChange(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, api, onOpenChange]);



  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const slide = slides[index];
  const timing = useMemo(
    () => (slide?.kind === "exercise" ? parseStepTiming(slide.step) : { mode: "manual" as const }),
    [slide],
  );

  const equipment =
    slide?.kind === "exercise" ? (details[slide.step.exerciseId]?.equipment ?? null) : null;

  // What is worth recording on THIS step — never a blanket assumption.
  const tracking = useMemo(
    () =>
      slide?.kind === "exercise"
        ? deriveStepTracking({ step: slide.step, category, format, equipment })
        : null,
    [slide, category, format, equipment],
  );
  const planned = useMemo(
    () => (slide?.kind === "exercise" ? parsePlanned(slide.step.prescription) : null),
    [slide],
  );

  const unitWord = tracking?.roundsTotal
    ? timing.mode === "tabata" || /interval/i.test(slide?.kind === "exercise" ? slide.step.prescription : "")
      ? "interval"
      : "round"
    : "set";

  // Preload media for the current window of slides.
  useEffect(() => {
    if (!open) return;
    const window_ = slides
      .slice(Math.max(0, index - 1), index + 4)
      .filter((s) => s.kind === "exercise")
      .map((s) => (s.kind === "exercise" ? s.step.exerciseId : ""))
      .filter(Boolean);
    if (window_.length) ensure(window_);
  }, [index, open, slides, ensure]);

  // Reset the timer whenever the slide changes.
  useEffect(() => {
    setRunning(false);
    setResting(false);
    setReps("");
    setWeight("");
    setHeldSeconds("");
    setDistance("");
    if (timing.mode === "timed") setRemaining(timing.seconds);
    else if (timing.mode === "tabata") setRemaining(timing.work);
    else setRemaining(0);
  }, [index, timing]);

  async function logSet(count = 1) {
    if (!slide || slide.kind !== "exercise" || !tracking) return;
    const repsValue = tracking.askReps && reps.trim() ? Number(reps) : tracking.autoReps;
    const weightValue = tracking.load && weight.trim() ? Number(weight) : null;
    const distanceValue =
      tracking.distance && distance.trim() ? Number(distance) : tracking.autoDistanceM;
    const typedSeconds = heldSeconds.trim() ? Number(heldSeconds) : null;
    const measuredSeconds =
      tracking.primary === "duration" && timing.mode === "timed" && remaining < timing.seconds
        ? timing.seconds - remaining
        : null;
    const secondsValue = typedSeconds ?? measuredSeconds ?? tracking.autoSeconds;

    const typedSomething =
      (tracking.askReps && reps.trim() !== "") ||
      (tracking.load && weight.trim() !== "") ||
      (tracking.askSeconds && (typedSeconds !== null || measuredSeconds !== null)) ||
      (tracking.distance && distance.trim() !== "");
    const fixedOnly = !tracking.askReps && !tracking.askSeconds && !tracking.load && !tracking.distance;
    if (!typedSomething && !fixedOnly) {
      toast.error("Nothing to log yet — add a value first.");
      return;
    }
    const n = Math.max(1, count);
    if ((logged[index] ?? 0) >= playerSetTarget(slide.step.prescription, tracking)) return false;
    if (previewMode) {
      const setNumber = (logged[index] ?? 0) + n;
      setLogged((prev) => ({ ...prev, [index]: setNumber }));
      setLastSet((prev) => ({ ...prev, [index]: { reps, weight, seconds: heldSeconds, distance } }));
      return true;
    }
    setSavingSet(true);
    if (!user) {
      setSavingSet(false);
      return;
    }
    const firstNumber = (logged[index] ?? 0) + 1;
    const setNumber = firstNumber + n - 1;
    const completedAt = new Date().toISOString();
    const rows = Array.from({ length: n }, (_, k) => ({
      id: crypto.randomUUID(),
      workout_id: workoutId,
      attempt,
      step_index: playerLogStepIndex(slide),
      exercise_id: slide.step.exerciseId || null,
      exercise_name: slide.step.name,
      section: slide.step.section ?? null,
      set_number: firstNumber + k,
      reps: repsValue,
      weight_kg: weightValue,
      seconds: secondsValue,
      distance_m: distanceValue,
      metric: tracking.metric,
      // Planned values are parsed from the prescription so planned vs actual is
      // possible. Nothing is filled in on the athlete's behalf.
      planned_reps: planned?.reps ?? null,
      planned_weight_kg: planned?.weightKg ?? null,
      planned_seconds: planned?.seconds ?? null,
      partial:
        planned?.reps != null && repsValue != null ? repsValue < planned.reps : false,
      completed_at: completedAt,
      rpe: null,
      rounds: null,
      interval_index: tracking.roundsTotal ? firstNumber + k : null,
      user_id: user.id,
    }));
    const { error } = await supabase.from("set_logs").upsert(rows as never, {
      onConflict: "id",
    });
    setSavingSet(false);
    if (error) {
      toast.error(`Could not save ${unitWord} ${firstNumber}. Please try again.`);
      return false;
    }
    toast.success(
      n > 1 ? `${unitWord.charAt(0).toUpperCase()}${unitWord.slice(1)}s ${firstNumber}–${setNumber} logged.` : `${unitWord.charAt(0).toUpperCase()}${unitWord.slice(1)} ${setNumber} logged.`,
    );
    setLogged((prev) => ({ ...prev, [index]: setNumber }));
    setLastSet((prev) => ({
      ...prev,
      [index]: { reps, weight, seconds: heldSeconds, distance },
    }));
    loggedAnythingRef.current = true;
    return true;
  }

  /**
   * Leaving early never loses work: if anything was logged, the attempt is
   * still marked completed. Performance data is optional either way.
   */
  async function closePlayer() {
    onOpenChange(false);
    if (previewMode) return;
    if (!loggedAnythingRef.current) return;
    loggedAnythingRef.current = false;
    try {
      await markStatus({ data: { workoutId, status: "completed" } });
    } catch {
      toast.error("Could not save your workout completion. Please try again.");
    }
    onFinish();
  }

  function finishWorkout() {
    if (previewMode) {
      onOpenChange(false);
      return;
    }
    setRecapOpen(true);
  }

  function afterRecap() {
    setRecapOpen(false);
    if (resultModel.metric !== "none") {
      setResultOpen(true);
      return;
    }
    void openDebrief();
  }

  /**
   * One debrief per attempt. If the questions were already answered for this
   * attempt (for example on the workout page), they are never asked again.
   */
  async function openDebrief() {
    try {
      const res = await readFeedback({ data: { workoutId, attempt } });
      const fb = (res as { feedback: typeof existingFeedback }).feedback;
      if (fb && (fb.rpe !== null || fb.feeling || fb.enjoyed || fb.wouldRepeat)) {
        onFinish();
        return;
      }
      setExistingFeedback(fb);
    } catch {
      setExistingFeedback(null);
    }
    setDebriefOpen(true);
  }

  async function submitResult(result: WorkoutResultInput) {
    setResultOpen(false);
    const hasAnything =
      result.durationSeconds !== null ||
      result.rounds !== null ||
      result.intervalsDone !== null ||
      result.finished !== null;
    if (hasAnything) {
      if (user) {
        const performedAt = new Date(startedAtRef.current ?? Date.now()).toISOString();
        try {
          await storeResult({
            data: {
              workoutId, attempt, prescriptionHash: planHash, performedAt, format, category,
              metric: resultModel.metric, durationSeconds: result.durationSeconds, rounds: result.rounds,
              extraReps: result.extraReps, intervalsDone: result.intervalsDone,
              intervalsTotal: resultModel.intervalsTotal, finished: result.finished,
            },
          });
        } catch {
          toast.error("Could not save your result. Please try again.");
        }
      }
    }
    void openDebrief();
  }



  // Work never advances before the member has confirmed the actual numbers.
  useEffect(() => {
    if (!running || timing.mode === "manual" || resting) return;
    const id = window.setInterval(() => {
      if (soundOnRef.current && remainingRef.current <= 3 && remainingRef.current > 0) playTimerBeep();
      setRemaining((prev) => Math.max(0, prev - 1));
      if (remainingRef.current <= 1) setRunning(false);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, timing, resting]);

  function advanceExercise() {
    if (index === slides.length - 1) finishWorkout();
    else api?.scrollNext();
  }

  function endRest() {
    setResting(false);
    if (advanceAfterRest) advanceExercise();
    else {
        setRemaining(timing.mode === "tabata" ? timing.work : timing.mode === "timed" ? timing.seconds : 0);
    }
  }

  useEffect(() => {
    if (!resting || !running) return;
    const id = window.setInterval(() => {
      setRestRemaining((prev) => Math.max(0, prev - 1));
      if (soundOnRef.current && restRemaining <= 3 && restRemaining > 0) playTimerBeep();
      if (restRemaining <= 1) {
        setRunning(false);
        endRest();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [resting, running, restRemaining, advanceAfterRest, index, api]);

  async function completeSet() {
    if (completingRef.current || savingSet) return;
    completingRef.current = true;
    try {
      const isExercise = slide?.kind === "exercise";
      const target = isExercise ? playerSetTarget(slide.step.prescription, tracking) : 1;
      const alreadyDone = (logged[index] ?? 0) >= target;
      const needsLog = isExercise && tracking && (tracking.primary !== "completion" || tracking.autoReps !== null);
      if (alreadyDone) { advanceExercise(); return; }
      if (needsLog && !(await logSet())) return;
      const outcome = afterPlayerSet({
        logged: (logged[index] ?? 0) + 1,
        target: needsLog ? target : 1,
        restSeconds: isExercise ? timing.mode === "tabata" ? timing.rest : prescribedRestSeconds(slide.step.prescription) : 0,
      });
      setRunning(false);
      if (outcome.restSeconds > 0) {
        setAdvanceAfterRest(outcome.nextExercise);
        setRestRemaining(outcome.restSeconds);
        setResting(true);
        setRunning(true);
        if (soundOnRef.current) { unlockTimerBeep(); playTimerBeep(); }
      } else if (outcome.nextExercise) advanceExercise();
      else {
          setRemaining(timing.mode === "tabata" ? timing.work : timing.mode === "timed" ? timing.seconds : 0);
      }
    } catch {
      setSavingSet(false);
      toast.error("Could not save your set. Please try again.");
    } finally { completingRef.current = false; }
  }

  const total = slides.length;
  soundOnRef.current = soundOn;
  remainingRef.current = remaining;
  const nextSlide = slides[index + 1];
  const nextLabel = nextSlide?.kind === "exercise" ? nextSlide.step.name : index === total - 1 ? "Session recap" : "Next phase";

  if (!open) return null;

  const progress = total ? ((index + 1) / total) * 100 : 0;
  const currentSection =
    slide?.kind === "exercise"
      ? slide.step.section
      : slide?.kind === "soft-tissue"
        ? "Soft Tissue Preparation"
        : slide?.kind === "break"
          ? slide.next
          : "Workout";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={false}
        hideClose
        aria-describedby={undefined}
        className="workout-floor"
      >
        <DialogTitle className="sr-only">{workoutName} player</DialogTitle>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-black sm:text-lg">{workoutName}</p>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {[category, format].filter(Boolean).map((detail) => (
                <span key={detail} className="truncate">{detail}</span>
              ))}
            </div>
            <p className="mt-1 truncate text-xs font-bold uppercase text-primary">
              {currentSection}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={soundOn ? "Turn timer sound off" : "Turn timer sound on"}
            aria-pressed={soundOn}
            onClick={toggleSound}
            className="h-11 w-11 shrink-0 rounded-full border border-coach-line bg-card text-foreground shadow-lg transition active:scale-95 hover:bg-muted"
          >
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Close player"
            onClick={() => void closePlayer()}
            className="h-11 w-11 shrink-0 rounded-full border border-coach-line bg-card text-foreground shadow-lg transition active:scale-95 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-1 w-full bg-muted" aria-label={`Workout progress ${Math.round(progress)}%`}>
          <div className="h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="player-demonstration" data-player-zone="demonstration">
          <Carousel setApi={setApi} className="h-full overflow-hidden">
            <CarouselContent className="ml-0 h-full min-h-0">
              {slides.map((s, i) => (
                <CarouselItem key={i} className="h-full pl-0">
                  {s.kind === "soft-tissue" ? (
                    <SoftTissueSlide
                      lines={s.lines}
                      canGoPrevious={i > 0}
                      canGoNext={i < total - 1}
                      onPrevious={() => api?.scrollPrev()}
                      onNext={() => api?.scrollNext()}
                    />
                  ) : s.kind === "break" ? (
                    <TransitionSlide
                      next={s.next}
                      canGoPrevious={i > 0}
                      canGoNext={i < total - 1}
                      onPrevious={() => api?.scrollPrev()}
                      onNext={() => api?.scrollNext()}
                    />
                  ) : (
                    <PlayerSlideView
                      step={s.step}
                      gifUrl={details[s.step.exerciseId]?.gif_url ?? null}
                      gifPath={details[s.step.exerciseId]?.gif_path ?? null}
                      canGoPrevious={index > 0}
                      canGoNext={index < total - 1}
                      onPrevious={() => api?.scrollPrev()}
                      onNext={() => api?.scrollNext()}
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

        </div>



        <div className="player-action-slot" data-player-zone="action">
          <div className="player-clock">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {resting ? "Rest" : slide?.kind === "exercise" ? `${unitWord} ${Math.min((logged[index] ?? 0) + 1, playerSetTarget(slide.step.prescription, tracking))} of ${playerSetTarget(slide.step.prescription, tracking)}` : "Preparation"}
            </p>
            <p className="font-mono text-4xl font-black tabular-nums">
              {resting ? fmt(restRemaining) : timing.mode !== "manual" ? fmt(remaining) : planned?.reps ? `${planned.reps} REPS` : "READY"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {resting ? advanceAfterRest ? `Up next: ${nextLabel}` : `Up next: ${slide?.kind === "exercise" ? slide.step.name : "Continue"}` : tracking?.load ? "Reps · Weight (kg)" : tracking?.primary === "completion" ? "Complete at your own pace" : "Record your actual work"}
            </p>
          </div>
          <div className="player-fields">
            {!resting && slide?.kind === "exercise" && tracking ? <>
              {tracking.askReps ? <StepperField label="Reps completed" value={reps} onChange={setReps} step={1} /> : null}
              {tracking.askSeconds ? <StepperField label={tracking.secondsLabel ?? "Seconds"} value={heldSeconds} onChange={setHeldSeconds} step={5} /> : null}
              {tracking.load ? <StepperField label="Weight (kg)" value={weight} onChange={setWeight} step={2.5} /> : null}
              {tracking.distance ? <StepperField label="Distance covered (m)" value={distance} onChange={setDistance} step={50} /> : null}
            </> : null}
          </div>
          <div className="flex h-8 items-center justify-center text-xs text-muted-foreground">
            {!resting && lastSet[index] ? "Last set values kept · adjust if needed" : resting ? "Recover before continuing" : ""}
          </div>
        </div>

        <div className="player-anchor" data-player-zone="anchor">
          <div className="grid h-11 grid-cols-[1fr_auto_auto] items-center gap-2">
            {resting || timing.mode !== "manual" ? <>
              <Button variant="secondary" className="h-11" onClick={() => {
                if (!running && soundOnRef.current) { unlockTimerBeep(); playTimerBeep(); }
                setRunning((r) => !r);
              }}>
                {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {running ? "Pause timer" : "Start timer"}
              </Button>
              <Button variant="secondary" size="icon" aria-label="Reset timer" className="h-11 w-11" onClick={() => {
                setRunning(false);
                if (resting) setRestRemaining(slide?.kind === "exercise" ? timing.mode === "tabata" ? timing.rest : prescribedRestSeconds(slide.step.prescription) : 0);
                else setRemaining(timing.mode === "tabata" ? timing.work : timing.mode === "timed" ? timing.seconds : 0);
              }}><RotateCcw className="h-4 w-4" /></Button>
            </> : <div />}
            <Button variant="ghost" size="icon" aria-label="Finish workout" title="Finish workout" className="h-11 w-11" onClick={finishWorkout}><Flag className="h-5 w-5" /></Button>
          </div>
          <Button className="h-14 w-full text-base font-bold" disabled={savingSet || (!previewMode && !attemptReady)} onClick={() => resting ? (setRunning(false), endRest()) : void completeSet()}>
            <Check className="mr-2 h-5 w-5" />
            {savingSet ? "Saving set…" : resting ? "End rest" : slide?.kind !== "exercise" || tracking?.primary === "completion" && tracking.autoReps === null ? "Continue" : (logged[index] ?? 0) >= playerSetTarget(slide.step.prescription, tracking) ? "Next exercise" : `Complete ${unitWord}`}
          </Button>
        </div>

        <SessionDebriefDialog
          open={debriefOpen}
          onOpenChange={(o) => {
            setDebriefOpen(o);
            if (!o) onFinish();
          }}
          workoutId={workoutId}
          attempt={attempt}
          initial={existingFeedback}
        />

        <PerformanceEditorDialog
          open={recapOpen}
          onOpenChange={(o) => {
            if (!o) afterRecap();
            else setRecapOpen(true);
          }}
          workoutId={workoutId}
          attempt={attempt}
          steps={steps}
          category={category}
          format={format}
          title="Session recap"
          onSaved={afterRecap}
        />

        <WorkoutResultDialog
          open={resultOpen}
          onOpenChange={setResultOpen}
          model={resultModel}
          elapsedSeconds={
            startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : null
          }
          onSubmit={submitResult}
        />
      </DialogContent>
    </Dialog>
  );
}


type SlideNavigationProps = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function SlideNavigation({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: SlideNavigationProps) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="Previous exercise"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="absolute left-2 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-coach-line bg-card text-foreground shadow-lg hover:bg-muted disabled:opacity-35"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="Next exercise"
        disabled={!canGoNext}
        onClick={onNext}
        className="absolute right-2 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-coach-line bg-card text-foreground shadow-lg hover:bg-muted disabled:opacity-35"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </>
  );
}

const MEDIA_FRAME_CLASS =
  "relative mx-3 flex h-[var(--player-media-height)] items-center justify-center overflow-hidden rounded-lg bg-card sm:mx-6";

function SlideShell({ media, info }: { media: React.ReactNode; info: React.ReactNode }) {
  return (
    <div className="grid h-full min-h-0 w-full grid-rows-[var(--player-media-height)_7rem] content-start overflow-hidden text-center">
      <div className={MEDIA_FRAME_CLASS}>{media}</div>
      <div className="flex h-28 w-full min-w-0 flex-col justify-center gap-0.5 overflow-hidden border-b border-border px-4 py-2 sm:px-6">{info}</div>
    </div>
  );
}

function SoftTissueSlide({
  lines,
  ...navigation
}: { lines: string[] } & SlideNavigationProps) {
  return (
    <SlideShell
      media={
        <>
          <Cylinder className="h-16 w-16 text-primary" />
          <SlideNavigation {...navigation} />
        </>
      }
      info={
        <>
          <h2 className="line-clamp-2 text-xl font-black">Soft Tissue Preparation</h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {lines.join(" · ") || "Foam roller, lacrosse or trigger ball. Take your time before you move."}
          </p>
        </>
      }
    />
  );
}

function TransitionSlide({ next, ...navigation }: { next: string } & SlideNavigationProps) {
  return (
    <SlideShell
      media={
        <>
          <div className="px-12 text-foreground">
            <p className="text-xs font-bold uppercase text-primary">Next phase</p>
            <h2 className="mt-2 line-clamp-2 text-2xl font-black">{next}</h2>
          </div>
          <SlideNavigation {...navigation} />
        </>
      }
      info={
        <>
          <p className="text-sm font-bold uppercase text-primary">Transition</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            Take a breath, reset, and continue when ready.
          </p>
        </>
      }
    />
  );
}

function PlayerSlideView({
  step,
  gifUrl,
  gifPath,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: {
  step: WorkoutStep;
  gifUrl: string | null;
  gifPath: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <SlideShell
      media={
        <>
          <Button
            variant="ghost"
            type="button"
            onClick={() => step.exerciseId && setInfoOpen(true)}
            aria-label={`See full instructions for ${step.name}`}
            className="relative block h-full w-full rounded-none p-0"
          >
            <ExerciseImage
              path={gifPath}
              url={gifUrl}
              alt={`${step.name} demonstration`}
              className="block h-full w-full rounded-none bg-card object-contain"
              fallbackClassName="flex h-full w-full items-center justify-center bg-card"
            />
            {step.exerciseId ? (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-bold text-primary shadow">
                Tap for full instructions
              </span>
            ) : null}
          </Button>
          <ExerciseDetailDialog exerciseId={infoOpen ? step.exerciseId : null} onClose={() => setInfoOpen(false)} />
          <SlideNavigation
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </>
      }
      info={
        <>
          {step.subSection ? (
            <p className="truncate text-xs font-bold uppercase text-primary">{step.subSection}</p>
          ) : null}
          <h2 className="line-clamp-2 text-xl font-black capitalize sm:text-2xl">{step.name}</h2>
          {step.prescription ? (
            <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">{step.prescription}</p>
          ) : null}
        </>
      }
    />
  );
}


function StepperField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  step: number;
}) {
  const bump = (delta: number) => {
    const current = value.trim() === "" ? 0 : Number(value);
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    onChange(String(next));
  };
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <p className="truncate text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-8 shrink-0 sm:h-11 sm:w-9"
          onClick={() => bump(-step)}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          aria-label={label}
          type="number"
          min="0"
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 min-w-0 flex-1 border-input bg-card px-1 text-center text-foreground sm:h-11"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-8 shrink-0 sm:h-11 sm:w-9"
          onClick={() => bump(step)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
