import { useEffect, useState, type ReactNode } from "react";
import { CreatorLink } from "@/components/community/CreatorLink";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Flag, Send, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/components/community/MemberCard";
import { CommunityGateDialog, useCommunityAccess } from "@/components/community/useCommunityAccess";
import {
  addComment,
  deleteComment,
  getSharedWorkout,
  rateWorkout,
  reactToWorkout,
  reportContent,
} from "@/lib/community.functions";
import { fetchComments } from "@/lib/community-queries";
import { invalidateRemote, loadRemote } from "@/lib/remote-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { COMMENT_MAX, RATING_STARS, type CommunityComment, type SharedWorkoutFull } from "@/lib/community";
import { formatDate } from "@/lib/date-format";

/**
 * Community side of a shared workout — creator, rating, likes, report and
 * comments. The same panel shows wherever the workout is opened (Shared
 * Workouts, the creator's logbook, or a member's saved copy) so every page
 * behaves the same. `sourceId` is always the shared original.
 */
export function CommunityEngagementPanel({
  sourceId,
  isOwner,
  children,
}: {
  sourceId: string;
  isOwner: boolean;
  /** Extra content placed under the creator/rating block (e.g. Do workout). */
  children?: ReactNode;
}) {
  const access = useCommunityAccess();
  const load = useServerFn(getSharedWorkout);
  const react = useServerFn(reactToWorkout);
  const rate = useServerFn(rateWorkout);
  const postComment = useServerFn(addComment);
  const removeComment = useServerFn(deleteComment);
  const report = useServerFn(reportContent);

  const [workout, setWorkout] = useState<SharedWorkoutFull | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [creator, setCreator] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [myReaction, setMyReaction] = useState<1 | -1 | 0>(0);
  const [myRating, setMyRating] = useState(0);
  const [counts, setCounts] = useState({ likes: 0, dislikes: 0 });
  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshCounts() {
    invalidateRemote("community:");
    const { data } = await supabase
      .from("community_workouts_public")
      .select("likes,dislikes,rating_avg,rating_count")
      .eq("id", sourceId)
      .maybeSingle()
      .returns<{ likes: number; dislikes: number; rating_avg: number; rating_count: number }>();
    if (data) {
      setCounts({ likes: data.likes, dislikes: data.dislikes });
      setRatingStats({ avg: Number(data.rating_avg ?? 0), count: Number(data.rating_count ?? 0) });
    }
  }

  useEffect(() => {
    let active = true;
    setUnavailable(null);
    void (async () => {
      try {
        const res = await loadRemote(`community:workout:${sourceId}`, () => load({ data: { workoutId: sourceId } }));
        if (!active) return;
        setWorkout(res.workout);
        setMyReaction(res.myReaction);
        setMyRating(res.myRating ?? 0);
        setCreator(res.creator ?? null);
      } catch (e) {
        if (active) setUnavailable((e as Error).message);
        return;
      }
      const [list] = await Promise.all([
        loadRemote(`community:workout-comments:${sourceId}`, () => fetchComments(sourceId)).catch(
          () => [] as CommunityComment[],
        ),
        refreshCounts(),
      ]);
      if (active) setComments(list);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  function toggleReaction(value: 1 | -1) {
    access.guard(() => {
      const previous = myReaction;
      const next = myReaction === value ? 0 : value;
      setMyReaction(next);
      void react({ data: { workoutId: sourceId, value: next } })
        .then(refreshCounts)
        .catch((e: Error) => {
          toast.error(e.message);
          setMyReaction(previous);
        });
    });
  }

  function setRating(value: number) {
    access.guard(() => {
      const previous = myRating;
      const next = myRating === value ? 0 : value;
      setMyRating(next);
      void rate({ data: { workoutId: sourceId, value: next } })
        .then(refreshCounts)
        .catch((e: Error) => {
          toast.error(e.message);
          setMyRating(previous);
        });
    });
  }

  function submitComment() {
    access.guard(() => {
      const body = draft.trim();
      if (!body || busy) return;
      setBusy(true);
      void postComment({ data: { workoutId: sourceId, body } })
        .then(async () => {
          setDraft("");
          invalidateRemote("community:");
          setComments(await fetchComments(sourceId));
        })
        .catch((e: Error) => toast.error(e.message))
        .finally(() => setBusy(false));
    });
  }

  function removeMine(id: string) {
    void removeComment({ data: { commentId: id } })
      .then(() => {
        invalidateRemote("community:");
        setComments((c) => c.filter((x) => x.id !== id));
      })
      .catch((e: Error) => toast.error(e.message));
  }

  function reportTarget(type: "workout" | "comment", id: string) {
    access.guard(() => {
      void report({ data: { targetType: type, targetId: id } })
        .then(() => toast.success("Reported — an administrator will review it."))
        .catch((e: Error) => toast.error(e.message));
    });
  }

  if (unavailable)
    return (
      <section className="mt-6 rounded-3xl border-2 border-blue-400 bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Community workout</p>
        <p className="mt-2 text-sm text-muted-foreground">{unavailable}</p>
      </section>
    );

  if (!workout) return null;

  return (
    <>
      <section className="mt-6 rounded-3xl border-2 border-blue-400 bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Community workout</p>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-200 p-3 dark:border-blue-500/40">
          <MemberAvatar name={creator?.display_name ?? null} avatar={creator?.avatar_url ?? null} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {isOwner ? "Shared by you" : <>Shared by <CreatorLink userId={workout.user_id} name={creator?.display_name} /></>}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-blue-200 p-3 dark:border-blue-500/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Rate this workout</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: RATING_STARS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition",
                      n <= (myRating || Math.round(ratingStats.avg))
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                    strokeWidth={myRating && n <= myRating ? 2 : 1.5}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {ratingStats.count > 0
                ? `${ratingStats.avg.toFixed(1)} / 5 · ${ratingStats.count} rating${ratingStats.count === 1 ? "" : "s"}`
                : "Be the first to rate"}
            </span>
          </div>
          {myRating > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Your rating: {myRating}/5 — tap the same star to remove it.
            </p>
          )}
        </div>

        {children}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleReaction(1)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
              myReaction === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
            )}
          >
            <ThumbsUp className="h-4 w-4" /> {counts.likes}
          </button>
          <button
            type="button"
            onClick={() => toggleReaction(-1)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
              myReaction === -1 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
            )}
          >
            <ThumbsDown className="h-4 w-4" /> {counts.dislikes}
          </button>
          {!isOwner && (
            <button
              type="button"
              onClick={() => reportTarget("workout", sourceId)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border-2 border-blue-400 px-4 text-sm font-semibold text-muted-foreground"
            >
              <Flag className="h-4 w-4" /> Report
            </button>
          )}
        </div>
      </section>

      <section id="comments" className="mt-6 rounded-3xl border-2 border-blue-400 bg-card p-5">
        <h3 className="text-lg font-bold">Comments ({comments.length})</h3>
        <div className="mt-3 flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX))}
            placeholder="Great workout. That finisher was brutal…"
            className="min-h-[3rem] rounded-2xl"
            maxLength={COMMENT_MAX}
          />
          <Button className="h-12 shrink-0 rounded-2xl" onClick={submitComment} disabled={busy}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {draft.length}/{COMMENT_MAX}
        </p>

        <ul className="mt-5 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-2xl border-2 border-blue-400 p-3">
              <MemberAvatar name={c.author_name} avatar={c.author_avatar} size={8} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  <CreatorLink userId={c.user_id} name={c.author_name} />{" "}
                  <span className="text-xs font-normal text-muted-foreground">{formatDate(c.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
              </div>
              {c.user_id === access.userId ? (
                <button
                  type="button"
                  aria-label="Delete comment"
                  onClick={() => removeMine(c.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Report comment"
                  onClick={() => reportTarget("comment", c.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {comments.length === 0 && (
            <li className="text-sm text-muted-foreground">No comments yet — start the conversation.</li>
          )}
        </ul>
      </section>

      <CommunityGateDialog open={access.gateOpen} onOpenChange={access.setGateOpen} signedIn={access.signedIn} />
    </>
  );
}
