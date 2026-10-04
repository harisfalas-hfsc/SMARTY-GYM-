import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { deleteManualWorkout } from "@/lib/manual-workout.functions";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRemoteData } from "@/lib/remote-data";
import { useOnlineStatus } from "@/lib/connectivity";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { WorkoutStatusPanel } from "@/components/workout/WorkoutStatusPanel";

import { useServerFn } from "@tanstack/react-start";
import { nameWorkout, setWorkoutStatus } from "@/lib/coach.functions";
import { shareWorkout } from "@/lib/community.functions";
import { Pencil, Share2 } from "lucide-react";
import { getMyAccessState } from "@/lib/access.functions";
import { toast } from "sonner";
import { WorkoutDisplay, type WorkoutRow } from "@/components/workout/WorkoutDisplay";
import { PerformancePanel } from "@/components/workout/PerformancePanel";
import { SessionDebriefDialog } from "@/components/workout/SessionDebriefDialog";
import { getSessionFeedback, type SessionFeedback } from "@/lib/feedback.functions";

import { ParqBlockedScreen } from "@/components/workout/ParqBlockedScreen";
import { CommunityEngagementPanel } from "@/components/community/CommunityEngagementPanel";
import { hasParqAck } from "@/lib/parq-ack";
import { getLocalWorkout, updateLocalWorkout } from "@/lib/local-workouts";
import { AppConfirmDialog, AppInputDialog } from "@/components/ui/app-dialog";

export const Route = createFileRoute("/_authenticated/workout/$workoutId")({
  head: () => ({
    meta: [
      { title: "Your workout — Smarty Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { workoutId } = Route.useParams();
  const [w, setW] = useState<WorkoutRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  
  const [parqFlags, setParqFlags] = useState<string[]>([]);
  const [parqOpen, setParqOpen] = useState(false);
  const [parqBlocked, setParqBlocked] = useState(false);
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const saveStatus = useServerFn(setWorkoutStatus);
  const { user } = useAuth();
  const online = useOnlineStatus();
  const saveShare = useServerFn(shareWorkout);
  const readFeedback = useServerFn(getSessionFeedback);
  const removeWorkout = useServerFn(deleteManualWorkout);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  async function deleteWorkout() {
    setDeleting(true);
    try {
      await removeWorkout({ data: { workoutId } });
      toast.success("Workout deleted.");
      navigate({ to: "/logbook", search: { filter: "all" as const, view: "list" as const } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the workout.");
      setDeleting(false);
    }
  }

  const runRename = useServerFn(nameWorkout);
  const [renaming, setRenaming] = useState(false);
  async function renameWorkout(trimmed: string) {
    setRenaming(true);
    try {
      await runRename({ data: { workoutId, name: trimmed } });
      setW((prev) => (prev ? { ...prev, name: trimmed } : prev));
      setRenameOpen(false);
      toast.success("Workout renamed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not rename the workout.");
    } finally {
      setRenaming(false);
    }
  }

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return { row: getLocalWorkout(workoutId), access: null };
    }
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const access = await getMyAccessState({}).catch(() => null);
    return { row: (data as unknown as WorkoutRow) ?? null, access };
  }, [workoutId]);

  const cached = useRemoteData<{
    row: WorkoutRow | null;
    access: Awaited<ReturnType<typeof getMyAccessState>> | null;
  }>(`workout:${workoutId}`, load);

  useEffect(() => {
    if (!cached.data) {
      if (!cached.loading) setLoading(false);
      return;
    }
    const { row, access } = cached.data;
    setW(row);
    // Expired members keep their saved workouts in the account, but opening
    // them needs an active membership again (WOD also locks when unknown).
    if ((row as { is_wod?: boolean } | null)?.is_wod) setLocked(!access?.premium);
    else if (access && access.premium === false) setLocked(true);
    if (row && access?.readinessFlagged && access.readinessFlags.length > 0) {
      setParqFlags(access.readinessFlags);
      if (!hasParqAck()) {
        setParqBlocked(true);
        setParqOpen(true);
      }
    }
    setShared(Boolean((row as { is_shared?: boolean } | null)?.is_shared));
    if (row?.status === "completed") setDone(true);
    const sched = (row as { scheduled_at?: string | null } | null)?.scheduled_at;
    if (sched) setScheduledAt(new Date(sched).toISOString().slice(0, 16));
    setLoading(false);
  }, [cached.data, cached.loading]);


  // Who created the shared original — shown (clickable) at the top of the page.
  const [creator, setCreator] = useState<{ id: string; name: string | null } | null>(null);
  const creatorSourceId = w
    ? ((w as { community_source_id?: string | null }).community_source_id ?? (shared ? workoutId : null))
    : null;
  useEffect(() => {
    if (!creatorSourceId || !isSupabaseConfigured()) {
      setCreator(null);
      return;
    }
    let active = true;
    void supabase
      .from("community_workouts_public")
      .select("creator_id,creator_name")
      .eq("id", creatorSourceId)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { creator_id: string | null; creator_name: string | null } | null;
        if (active) setCreator(row?.creator_id ? { id: row.creator_id, name: row.creator_name } : null);
      });
    return () => {
      active = false;
    };
  }, [creatorSourceId]);

  const refreshFeedback = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await readFeedback({ data: { workoutId } });
      setFeedback((res as { feedback: SessionFeedback | null }).feedback);
    } catch {
      /* offline — the debrief can still be answered and queued */
    }
  }, [workoutId, readFeedback]);

  useEffect(() => {
    void refreshFeedback();
  }, [refreshFeedback]);

  async function complete() {
    setDone(true);
    if (!isSupabaseConfigured()) {
      updateLocalWorkout(workoutId, { status: "completed", completed_at: new Date().toISOString() });
      toast.success("Marked as completed.");
      return;
    }
    void refreshFeedback();
    // Same rule as the player and the logbook: completing opens the recap right away.
    if (!hasAnswers) setDebriefOpen(true);
    try {
      await saveStatus({ data: { workoutId, status: "completed" } });
      toast.success("Marked as completed.");
    } catch {
      toast.error("Could not mark this workout as completed. Please try again.");
    }
  }

  async function toggleShare() {
    if (!online) {
      toast.error("Sharing needs an internet connection.");
      return;
    }
    const next = !shared;
    setSharing(true);
    try {
      await saveShare({ data: { workoutId, shared: next } });
      setShared(next);
      toast.success(
        next
          ? "Shared with the Smarty Community."
          : "Removed from Shared Workouts.",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSharing(false);
    }
  }


  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (locked)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold uppercase tracking-tight">Members only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(w as { is_wod?: boolean } | null)?.is_wod
            ? "The Workout of the Day is part of the SmartyGym membership. Join to open today's two workouts and get a new pair every morning."
            : "This workout is safely kept in your account. Renew your SmartyGym membership to open it again."}
        </p>
        <Button asChild className="mt-4 h-12 rounded-2xl">
          <Link to="/auth">See plans</Link>
        </Button>
      </div>
    );

  if (!w)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Workout not found.</p>
        <Button asChild className="mt-4">
          <Link to="/create-your-own-workout">Back to Smarty Coach</Link>
        </Button>
      </div>
    );

  if ((w as { deleted_at?: string | null }).deleted_at)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold uppercase tracking-tight">Workout deleted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workout has been deleted. Any training already done with it stays in your progress and
          training load.
        </p>
        <Button asChild className="mt-4 h-12 rounded-2xl">
          <Link to="/logbook" search={{ filter: "all" as const, view: "list" as const }}>Open logbook</Link>
        </Button>
      </div>
    );

  if (parqBlocked)
    return <ParqBlockedScreen flags={parqFlags} onConfirmed={() => setParqBlocked(false)} />;

  const ownCreation =
    !String(w.created_by ?? "").startsWith("smarty:") &&
    w.created_by !== "community" &&
    !(w as { community_source_id?: string | null }).community_source_id &&
    !(w as { is_wod?: boolean | null }).is_wod;

  // The shared original this workout belongs to: itself when the owner has
  // shared it, or the source when this is a member's saved copy.
  const communitySourceId = ownCreation
    ? shared
      ? workoutId
      : null
    : ((w as { community_source_id?: string | null }).community_source_id ?? null);

  const hasAnswers = Boolean(
    feedback && (feedback.rpe !== null || feedback.feeling || feedback.enjoyed || feedback.wouldRepeat),
  );

  return (
    <WorkoutDisplay
      workout={w}
      creator={creator}
      onComplete={complete}
      onPlayerClosed={() => {
        void refreshFeedback();
      }}
    >
      <WorkoutStatusPanel
        workoutId={workoutId}
        status={done ? "completed" : scheduledAt ? "scheduled" : "created"}
        scheduledAt={scheduledAt}
        onChange={(next) => {
          setDone(next.status === "completed");
          setScheduledAt(next.scheduledAt);
        }}
      />

      <PerformancePanel
        workoutId={workoutId}
        html={w.main_workout ?? ""}
        category={w.category ?? null}
        format={w.format ?? null}
      />




      {ownCreation && (
      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Share2 className="h-4 w-4 text-primary" /> Smarty Community
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {shared
            ? "This workout is shared. Members can discover it, do it, like it and comment on it. You can unshare it at any time — it will be removed from Shared Workouts."
            : "Share this workout with the community so other members can train it exactly as it is. You can unshare it at any time."}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button
            variant={shared ? "secondary" : "default"}
            className="h-12 rounded-2xl font-bold"
            onClick={toggleShare}
            disabled={sharing}
          >
            {shared ? "Unshare" : "Share with community"}
          </Button>
          <Button asChild variant="secondary" className="h-12 rounded-2xl">
            <Link to="/community">Open community</Link>
          </Button>
        </div>
      </section>
      )}

      {ownCreation ? (
        <Button
          variant="outline"
          className="mt-6 h-12 w-full rounded-2xl font-bold"
          disabled={renaming}
          onClick={() => setRenameOpen(true)}
        >
          {renaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
          Rename this workout
        </Button>
      ) : null}

      {ownCreation ? (
        <Button
          variant="outline"
          className="mt-3 h-12 w-full rounded-2xl border-destructive font-bold text-destructive"
          disabled={deleting}
          onClick={() => setDeleteOpen(true)}
        >
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete this workout
        </Button>
      ) : null}

      <AppInputDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename workout"
        description={shared
          ? "The new name will update in Shared Workouts and for every member who saved it."
          : "Choose the name shown throughout your logbook."}
        initialValue={w.name ?? ""}
        minLength={2}
        maxLength={60}
        confirmLabel="Save new name"
        busy={renaming}
        onConfirm={renameWorkout}
      />

      <AppConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this workout?"
        description={shared
          ? "It will be removed from Shared Workouts and every member's logbook. Likes, ratings, comments and favorites will be removed. Completed training remains permanently in each member's progress and training load."
          : "It will be removed from your logbook. Completed training remains permanently in your progress and training load."}
        confirmLabel="Delete workout"
        cancelLabel="Keep workout"
        tone="danger"
        busy={deleting}
        onConfirm={deleteWorkout}
      />

      {communitySourceId ? (
        <CommunityEngagementPanel sourceId={communitySourceId} isOwner={ownCreation} />
      ) : null}

      {!done ? (
        <Button size="lg" className="mt-6 h-14 w-full rounded-2xl text-base font-bold" onClick={complete}>
          I finished this workout
        </Button>
      ) : (
        <section className="mt-6 space-y-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
          <div>
            <h3 className="text-lg font-bold">Your session debrief</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasAnswers
                ? "Saved from your session — private, only you and Smarty Coach see it. Edit any answer and it updates everywhere."
                : "Private — only you and Smarty Coach see this. If you already answered in the player, your answers appear here automatically."}
            </p>
          </div>

          {hasAnswers ? (
            <div className="grid gap-2 text-sm">
              <SummaryRow label="Effort (RPE)" value={feedback?.rpe ? `${feedback.rpe} / 10` : "—"} />
              <SummaryRow label="How you felt" value={feedback?.feeling ?? "—"} />
              <SummaryRow label="Enjoyed it" value={feedback?.enjoyed ?? "—"} />
              <SummaryRow label="Would do again" value={feedback?.wouldRepeat ?? "—"} />
              {feedback?.note ? <SummaryRow label="Your note" value={feedback.note} /> : null}
            </div>
          ) : null}

          <Button
            size="lg"
            variant={hasAnswers ? "secondary" : "default"}
            className="h-12 w-full rounded-2xl font-bold"
            onClick={() => setDebriefOpen(true)}
          >
            {hasAnswers ? "Edit my answers" : "Answer 4 quick questions"}
          </Button>

          <SessionDebriefDialog
            open={debriefOpen}
            onOpenChange={setDebriefOpen}
            workoutId={workoutId}
            attempt={feedback?.attempt ?? 1}
            initial={feedback}
            onSaved={(fb) => setFeedback(fb)}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild size="lg" className="h-12 w-full rounded-2xl font-bold">
              <Link to="/create-your-own-workout">Next workout</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-12 w-full rounded-2xl font-bold">
              <Link to="/logbook" search={{ filter: "all" as const, view: "list" as const }}>Open logbook</Link>
            </Button>
          </div>
        </section>
      )}
    </WorkoutDisplay>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-blue-400/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
