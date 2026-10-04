import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { loadRemote } from "@/lib/remote-data";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutDisplay } from "@/components/workout/WorkoutDisplay";
import { CommunityGateDialog, useCommunityAccess } from "@/components/community/useCommunityAccess";
import { CommunityEngagementPanel } from "@/components/community/CommunityEngagementPanel";
import { getSharedWorkout, startSharedWorkout } from "@/lib/community.functions";
import type { SharedWorkoutFull } from "@/lib/community";
import { WorkoutStatusPanel } from "@/components/workout/WorkoutStatusPanel";
import { ParqBlockedScreen } from "@/components/workout/ParqBlockedScreen";
import { hasParqAck } from "@/lib/parq-ack";
import { getSharedWorkoutSeo } from "@/lib/seo/workout-seo.functions";

export const Route = createFileRoute("/community/workout/$workoutId")({
  /**
   * Public head data only (title, description, key phrases written by the weekly
   * SEO job). The visible page still loads through the member-only server
   * function below, so nothing on screen changes.
   */
  loader: ({ params }) => getSharedWorkoutSeo({ data: { workoutId: params.workoutId } }),
  head: ({ loaderData, params }) => {
    const seo = loaderData;
    const url = `https://smartygym.com/community/workout/${params.workoutId}`;
    const title = seo?.title ?? "Shared workout — Smarty Community";
    const description =
      seo?.description ?? "A workout shared with the Smarty Community by a member.";
    const image = seo?.image && seo.image.startsWith("https://") ? seo.image : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(seo?.keywords?.length ? [{ name: "keywords", content: seo.keywords.join(", ") }] : []),
        {
          name: "robots",
          content: seo?.indexable
            ? "index, follow, max-image-preview:large, max-snippet:-1"
            : "noindex, follow",
        },
        { property: "og:site_name", content: "SmartyGym" },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(seo?.indexable && seo.found
        ? {
            scripts: [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ExercisePlan",
                  name: title,
                  description,
                  url,
                  ...(seo.category ? { activityFrequency: seo.category } : {}),
                  ...(seo.duration ? { duration: `PT${seo.duration}M` } : {}),
                  ...(seo.equipment.length ? { additionalVariable: seo.equipment.join(", ") } : {}),
                  isPartOf: { "@id": "https://smartygym.com/#website" },
                  publisher: { "@id": "https://smartygym.com/#organization" },
                }),
              },
            ],
          }
        : {}),
    };
  },
  component: SharedWorkoutPage,
});

function SharedWorkoutPage() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const access = useCommunityAccess();
  const load = useServerFn(getSharedWorkout);
  const doWorkout = useServerFn(startSharedWorkout);

  const [workout, setWorkout] = useState<SharedWorkoutFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copy, setCopy] = useState<{ id: string; status: string; scheduledAt: string } | null>(null);
  const [parqCleared, setParqCleared] = useState(false);

  /** Lazily creates (or reuses) the member's own copy so status can be tracked. */
  async function ensureCopy(): Promise<string> {
    if (copy?.id) return copy.id;
    const r = await doWorkout({ data: { workoutId } });
    setCopy((c) => ({ id: r.workoutId, status: c?.status ?? "created", scheduledAt: c?.scheduledAt ?? "" }));
    return r.workoutId;
  }

  useEffect(() => {
    if (!access.checked || !access.premium) return;
    let active = true;
    void (async () => {
      try {
        const res = await loadRemote(`community:workout:${workoutId}`, () => load({ data: { workoutId } }));
        if (!active) return;
        // The creator's own workout always opens as their own workout — with
        // Rename, Share/Unshare and Delete — exactly like from the logbook.
        if (access.userId && res.workout.user_id === access.userId) {
          void navigate({ to: "/workout/$workoutId", params: { workoutId }, replace: true });
          return;
        }
        setWorkout(res.workout);
        if (res.myCopy) setCopy({ id: res.myCopy.id, status: res.myCopy.status, scheduledAt: "" });
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, access.checked, access.premium, access.userId]);

  function start() {
    access.guard(() => {
      if (busy) return;
      setBusy(true);
      void doWorkout({ data: { workoutId } })
        .then((r) => navigate({ to: "/workout/$workoutId", params: { workoutId: r.workoutId } }))
        .catch((e: Error) => toast.error(e.message))
        .finally(() => setBusy(false));
    });
  }

  if (error || (access.checked && !access.premium))
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold uppercase tracking-tight">
          {error && access.premium ? "Workout unavailable" : "Members only"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error && access.premium ? error : "Shared workouts open with an active SmartyGym membership."}
        </p>
        <div className="mt-4 grid gap-2">
          {!(error && access.premium) && (
            <Button asChild className="h-12 rounded-2xl font-bold">
              <Link to="/auth">{access.signedIn ? "Renew membership" : "See membership"}</Link>
            </Button>
          )}
          <Button asChild variant="secondary" className="h-12 rounded-2xl">
            <Link to="/community">Back to community</Link>
          </Button>
        </div>
        <CommunityGateDialog open={access.gateOpen} onOpenChange={access.setGateOpen} signedIn={access.signedIn} />
      </div>
    );

  if (!workout)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  // Same PAR-Q health warning as every other workout page.
  if (access.readinessFlags.length > 0 && !parqCleared && !hasParqAck())
    return <ParqBlockedScreen flags={access.readinessFlags} onConfirmed={() => setParqCleared(true)} />;

  return (
    <WorkoutDisplay workout={{ ...workout, is_favorite: false, rating: null }} onComplete={start}>
      <WorkoutStatusPanel
        workoutId={copy?.id ?? null}
        status={copy?.status === "completed" ? "completed" : copy?.scheduledAt ? "scheduled" : "created"}
        scheduledAt={copy?.scheduledAt ?? ""}
        resolveWorkoutId={ensureCopy}
        onChange={(next) =>
          setCopy((c) => ({
            id: c?.id ?? "",
            status: next.status,
            scheduledAt: next.scheduledAt,
          }))
        }
      />

      <CommunityEngagementPanel sourceId={workoutId} isOwner={false}>
        <p className="mt-3 text-sm text-muted-foreground">
          This workout is shown exactly as its creator made it and cannot be edited. Start it to add
          your own copy to your logbook — your completion is credited to the creator.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button className="h-12 rounded-2xl font-bold" onClick={start} disabled={busy}>
            Do workout
          </Button>
          <Button asChild variant="secondary" className="h-12 rounded-2xl">
            <Link to="/community">Open community</Link>
          </Button>
        </div>
      </CommunityEngagementPanel>
    </WorkoutDisplay>
  );
}
