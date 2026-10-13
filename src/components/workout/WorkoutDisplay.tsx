import { coverVariant, fallbackTo } from "@/lib/cover-image";
import { useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen,
  Check,
  Clock,
  Copy,
  Dumbbell,
  Download,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ExerciseHTMLContent } from "./ExerciseHTMLContent";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";
import { ExerciseMediaProvider } from "./ExerciseMediaProvider";
import { WorkoutPlayerDialog } from "./WorkoutPlayerDialog";
import { extractSoftTissue, parseWorkoutSteps } from "@/lib/workout/parse-steps";
import { uniqueTokenIds } from "@/lib/workout/tokens";
import { difficultyLabel, MAX_STARS, normalizeStars } from "@/lib/workout/spec";
import { setWorkoutMeta } from "@/lib/coach.functions";
import { CreatorLink } from "@/components/community/CreatorLink";
import { captureWorkoutShareCard, workoutShareTarget, workoutShareUrl, type WorkoutShareTarget } from "@/lib/workout/social-share";
import { getShareableWorkoutCard } from "@/lib/share.functions";

export type WorkoutRow = {
  id: string;
  serial?: number | null;
  name: string;
  category: string;
  format: string | null;
  focus: string | null;
  difficulty_stars: number;
  difficulty_label: string | null;
  duration_min: number;
  duration_label: string | null;
  equipment: string[] | null;
  location: string | null;
  image_url: string | null;
  description_html: string | null;
  instructions_html: string | null;
  tips_html: string | null;
  main_workout: string | null;
  created_by: string | null;
  coach_rationale?: string[] | null;
  is_favorite?: boolean | null;
  rating?: number | null;
  status: string;
  is_shared?: boolean | null;
  community_source_id?: string | null;
  deleted_at?: string | null;
};

function Stars({ n }: { n: number }) {
  const filled = normalizeStars(n);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filled ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

export function WorkoutDisplay({
  workout,
  onComplete,
  onPlayerClosed,
  previewMode = false,
  children,
  creator,
  ownerName,
  ownerCreationMethod,
  shareTarget,
  resolveWorkoutId,
}: {
  creator?: { id: string; name: string | null } | null;
  ownerName?: string | null;
  ownerCreationMethod?: "Smarty Coach" | "Build It Yourself" | null;
  shareTarget?: WorkoutShareTarget | null;
  resolveWorkoutId?: () => Promise<string>;
  workout: WorkoutRow;
  onComplete: () => void;
  onPlayerClosed?: () => void;
  previewMode?: boolean;
  children?: React.ReactNode;
}) {
  const html = workout.main_workout ?? "";
  const isSmarty = String(workout.created_by ?? "").startsWith("smarty:");
  const target = previewMode ? null : shareTarget ?? workoutShareTarget(workout);
  const headerRef = useRef<HTMLElement>(null);
  const checkShare = useServerFn(getShareableWorkoutCard);
  const ids = useMemo(() => uniqueTokenIds(html), [html]);
  const steps = useMemo(() => parseWorkoutSteps(html), [html]);
  const softTissue = useMemo(() => extractSoftTissue(html), [html]);
  const saveMeta = useServerFn(setWorkoutMeta);

  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [reader, setReader] = useState(false);
  const [shareOptions, setShareOptions] = useState(false);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [preparingShare, setPreparingShare] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [player, setPlayer] = useState(false);
  const [favorite, setFavorite] = useState(Boolean(workout.is_favorite));

  // AI-generated HTML is sanitized before rendering, matching ExerciseHTMLContent.
  const sanitize = (value: string | null | undefined) => {
    const raw = value ?? "";
    if (typeof window === "undefined") return raw;
    return DOMPurify.sanitize(raw, { ADD_ATTR: ["data-exercise-id", "target"] });
  };
  const descriptionHtml = useMemo(() => sanitize(workout.description_html), [workout.description_html]);
  const instructionsHtml = useMemo(() => sanitize(workout.instructions_html), [workout.instructions_html]);
  const tipsHtml = useMemo(() => sanitize(workout.tips_html), [workout.tips_html]);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    try {
      const workoutId = resolveWorkoutId ? await resolveWorkoutId() : workout.id;
      await saveMeta({ data: { workoutId, is_favorite: next } });
    } catch {
      setFavorite(!next);
      toast.error("Could not save that.");
    }
  }

  function copyFallback(text: string) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  const shareUrl = target ? workoutShareUrl(target) : "";
  const shareBits = [
    workout.category,
    workout.format,
    workout.serial ? `#${workout.serial}` : null,
    workout.focus,
    workout.difficulty_label ?? difficultyLabel(workout.difficulty_stars),
    `${normalizeStars(workout.difficulty_stars)} stars`,
    workout.duration_label ?? `${workout.duration_min} min`,
    workout.location,
    (workout.equipment ?? []).join(", ") || "Bodyweight",
  ].filter(Boolean);
  const shareTitle = `${workout.name} — SmartyGym`;
  const shareText = `${workout.name} · ${shareBits.join(" · ")}`;

  async function copyShareLink() {
    const text = `${shareText}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Workout link copied.");
      return true;
    } catch {
      if (copyFallback(text)) {
        toast.success("Workout link copied.");
        return true;
      }
    }
    toast.error("Could not copy the workout link.");
    return false;
  }

  async function shareWorkoutLink() {
    if (!target) {
      toast.info(previewMode ? "Sharing is unavailable in administrator preview." : "Share this workout with the Smarty Community first, then share its link.");
      return;
    }
    if (preparingShare) return;
    setPreparingShare(true);
    try {
      const card = await checkShare({ data: target });
      if (!card) {
        toast.error("This workout is no longer publicly available to share.");
        return;
      }
      let file: File | null = null;
      if (headerRef.current) {
        try { file = await captureWorkoutShareCard(headerRef.current, workout.name); }
        catch { toast.info("The picture could not be prepared. You can still share the workout link."); }
      }
      setShareFile(file);
      if (typeof navigator.share === "function") {
        const payload: ShareData = { title: shareTitle, text: shareText, url: shareUrl };
        if (file && navigator.canShare?.({ files: [file] })) payload.files = [file];
        try { await navigator.share(payload); return; }
        catch (error) { if ((error as Error)?.name === "AbortError") return; }
      }
      setShareOptions(true);
    } catch {
      toast.error("Could not prepare sharing. Please check your connection and try again.");
    } finally {
      setPreparingShare(false);
    }
  }

  function downloadSharePicture() {
    if (!shareFile) return;
    const url = URL.createObjectURL(shareFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = shareFile.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  return (
    <ExerciseMediaProvider ids={ids}>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 lg:max-w-6xl lg:px-8 lg:py-16">
        <header ref={headerRef} className="rounded-3xl border-2 border-blue-400 bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>{workout.category}</span>
            {workout.format ? <span>· {workout.format}</span> : null}
            {workout.serial ? (
              <span className="text-muted-foreground">· #{workout.serial}</span>
            ) : null}
          </div>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{workout.name}</h1>
          {workout.focus ? <p className="mt-1 text-muted-foreground">{workout.focus}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Stars n={workout.difficulty_stars} />
            <span>{workout.difficulty_label ?? difficultyLabel(workout.difficulty_stars)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {workout.duration_label ?? `${workout.duration_min} min`}
            </span>
            {workout.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {workout.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {(workout.equipment ?? []).join(", ") || "bodyweight"}
            </span>
          </div>
          <div className="mt-4 rounded-2xl border-2 border-primary px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Created by</span>
              {creator ? (
                <CreatorLink userId={creator.id} name={creator.name} className="text-base font-extrabold text-primary underline" />
              ) : isSmarty ? (
                <span className="text-base font-extrabold text-foreground">HARIS FALAS</span>
              ) : ownerCreationMethod ? (
                <span data-share-creator={ownerName?.trim() || "User"} className="text-base font-extrabold text-foreground">You</span>
              ) : (
                <span className="text-base font-extrabold text-foreground">{ownerName?.trim() || "User"}</span>
              )}
            </div>
            {creator ? (
              <p data-html2canvas-ignore className="mt-1 text-[11px] text-muted-foreground">Tap the creator’s name to see all their shared workouts.</p>
            ) : ownerCreationMethod ? (
              <p data-html2canvas-ignore className="mt-1 text-[11px] text-muted-foreground">Created with {ownerCreationMethod}</p>
            ) : null}
          </div>

          {workout.image_url ? (
            <img
              src={coverVariant(workout.image_url, 1280) ?? undefined}
              onError={fallbackTo(workout.image_url)}
              decoding="async"
              alt={`${workout.name} cover`}
              className="mt-5 h-52 w-full rounded-2xl object-cover"
            />
          ) : null}

          {workout.description_html ? (
            <div
              className="workout-html mt-5 text-sm"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : null}

          <Button data-html2canvas-ignore size="lg" className="mt-6 w-full" onClick={() => setPlayer(true)}>
            Start Your Workout
          </Button>
        </header>

        <div className="sticky top-2 z-20 mt-5 grid grid-cols-3 gap-2 rounded-2xl border-2 border-blue-400 bg-card/95 p-2 backdrop-blur">
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl px-2 text-sm font-semibold"
            onClick={() => setReader(true)}
          >
            <BookOpen className="mr-1.5 h-4 w-4 shrink-0" /> Reader
          </Button>
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl px-2 text-sm font-semibold"
            onClick={toggleFavorite}
            disabled={previewMode}
            title={previewMode ? "Disabled in administrator preview" : undefined}
          >
            <Heart
              className={`mr-1.5 h-4 w-4 shrink-0 ${favorite ? "fill-destructive text-destructive" : ""}`}
            />
            {favorite ? "Saved" : "Save"}
          </Button>
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl px-2 text-sm font-semibold"
            onClick={shareWorkoutLink}
            disabled={preparingShare || previewMode}
            aria-label={preparingShare ? "Preparing share" : "Share"}
            title={!target ? "Share with the Smarty Community first" : "Share workout"}
          >
            <Share2 className="mr-1.5 h-4 w-4 shrink-0" /> Share
          </Button>
        </div>

        <article className="workout-html mt-5 rounded-3xl border-2 border-blue-400 bg-card p-5 sm:p-7">
          <ExerciseHTMLContent html={html} onOpenExercise={setOpenExercise} />
        </article>

        {workout.instructions_html ? (
          <section className="workout-html mt-5 rounded-2xl border-2 border-blue-400 bg-card p-5">
            <h2 className="mb-2 text-lg font-bold">How to perform this workout</h2>
            <div dangerouslySetInnerHTML={{ __html: instructionsHtml }} />
          </section>
        ) : null}

        {workout.tips_html ? (
          <section className="workout-html mt-5 rounded-2xl border-2 border-blue-400 bg-card p-5">
            <h2 className="mb-2 text-lg font-bold">Coach tips</h2>
            <div dangerouslySetInnerHTML={{ __html: tipsHtml }} />
          </section>
        ) : null}

        {children}
      </div>

      <ExerciseDetailDialog exerciseId={openExercise} onClose={() => setOpenExercise(null)} />

      <Dialog open={shareOptions} onOpenChange={setShareOptions}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-2 border-primary p-5 sm:p-6">
          <DialogTitle>Share workout</DialogTitle>
          <p className="text-sm text-muted-foreground">Choose where to share {workout.name}.</p>
          {shareFile && <Button variant="outline" className="h-12 w-full rounded-xl" onClick={downloadSharePicture}><Download className="mr-2 h-5 w-5" /> Save workout picture</Button>}
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-5 w-5 text-primary" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl">
              <a href={`viber://forward?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}>
                <MessageCircle className="mr-2 h-5 w-5 text-primary" /> Viber
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">
                <Facebook className="mr-2 h-5 w-5 text-primary" /> Facebook
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start rounded-xl"
              onClick={async () => {
                if (await copyShareLink()) window.location.href = "instagram://app";
              }}
            >
              <Instagram className="mr-2 h-5 w-5 text-primary" /> Instagram
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl">
              <a href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}>
                <Mail className="mr-2 h-5 w-5 text-primary" /> Email
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl">
              <a href={`sms:?body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}><MessageCircle className="mr-2 h-5 w-5 text-primary" /> Message</a>
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-xl" onClick={copyShareLink}>
              <Copy className="mr-2 h-5 w-5 text-primary" /> Copy link
            </Button>
          </div>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <Button
              className="h-12 w-full rounded-xl"
              onClick={async () => {
                try {
                  const payload: ShareData = { title: shareTitle, text: shareText, url: shareUrl };
                  if (shareFile && navigator.canShare?.({ files: [shareFile] })) payload.files = [shareFile];
                  await navigator.share(payload);
                  setShareOptions(false);
                } catch (error) {
                  if ((error as Error)?.name !== "AbortError") toast.error("Your browser blocked the device share menu.");
                }
              }}
            >
              <Share2 className="mr-2 h-5 w-5" /> More apps
            </Button>
          ) : null}
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> The shared link shows workout details; full access still requires sign-in.
          </p>
        </DialogContent>
      </Dialog>

      <WorkoutPlayerDialog
        open={player}
        onOpenChange={(o) => {
          setPlayer(o);
          if (!o) onPlayerClosed?.();
        }}
        steps={steps}
        softTissue={softTissue}
        workoutName={workout.name}
        workoutId={workout.id}
        category={workout.category}
        format={workout.format}
        html={html}
        previewMode={previewMode}
        onFinish={() => {
          setPlayer(false);
          onComplete();
          onPlayerClosed?.();
        }}
      />


      <Dialog open={reader} onOpenChange={setReader}>
        <DialogContent hideClose className="h-[100dvh] w-full max-w-none overflow-x-hidden overflow-y-auto border-0 bg-background p-0 text-foreground sm:h-[92vh] sm:max-w-2xl sm:rounded-3xl">
          <DialogTitle className="sr-only">{workout.name} reader mode</DialogTitle>
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
            <p className="min-w-0 truncate text-sm font-semibold sm:text-base">{workout.name}</p>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease text size"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center text-xs text-muted-foreground">{fontSize}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase text size"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setFontSize((s) => Math.min(30, s + 2))}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="ml-1 h-8 rounded-full px-3 font-bold"
                onClick={() => setReader(false)}
              >
                <X className="mr-1 h-4 w-4" /> Close
              </Button>
            </div>
          </div>
          <div
            className="workout-html reader w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6"
            style={{ fontSize }}
          >
            <ExerciseHTMLContent html={html} onOpenExercise={setOpenExercise} />
            <Button className="mt-8 w-full rounded-2xl font-bold" size="lg" onClick={() => setReader(false)}>
              Exit reader mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ExerciseMediaProvider>
  );
}
