import { coverVariant, fallbackTo } from "@/lib/cover-image";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";
import { listSmartyWorkouts, startSmartyWorkout, type SmartyWorkoutCard } from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { CATEGORY_DETAILS, type SmartyCategory } from "@/lib/smarty-workout-categories";
import { difficultyLabel } from "@/lib/workout/spec";
import { getSmartyWorkoutSearchData } from "@/lib/seo/smarty-workout-public.functions";
import { SITE_URL } from "@/lib/seo/site";

export const Route = createFileRoute("/smarty-workouts/$workoutId")({
  loader: ({ params }) => getSmartyWorkoutSearchData({ data: { id: params.workoutId } }),
  head: ({ loaderData, params }) => {
    const url = `${SITE_URL}/smarty-workouts/${params.workoutId}`;
    const title = loaderData?.title ?? "Smarty Workout | SmartyGym";
    const description = loaderData?.description ?? "A ready workout by Haris Falas on SmartyGym.";
    const image = loaderData?.image;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: loaderData ? "index, follow, max-image-preview:large" : "noindex, follow" },
        { property: "og:site_name", content: "SmartyGym" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(loaderData ? { scripts: [{ type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org", "@type": "ExercisePlan", name: title,
        description, url, image, provider: { "@type": "Organization", name: "SmartyGym", url: SITE_URL },
      }) }] } : {}),
    };
  },
  component: SmartyWorkoutPage,
});

function SmartyWorkoutPage() {
  const { workoutId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const startWorkout = useServerFn(startSmartyWorkout);
  const navigate = useNavigate();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "locked" } | { kind: "error"; msg: string }
  >({ kind: "loading" });
  const [checkout, setCheckout] = useState(false);
  const [card, setCard] = useState<SmartyWorkoutCard | null>(null);

  // The preview card is only shown to visitors / non-members, so members
  // skip this request and go straight to their workout.
  const needsCard = (!authLoading && !user) || state.kind === "locked";
  useEffect(() => {
    if (!needsCard) return;
    void listSmartyWorkouts({ data: { id: workoutId } })
      .then((r) => setCard(r.workouts[0] ?? null))
      .catch(() => setCard(null));
  }, [workoutId, needsCard]);

  useEffect(() => {
    if (authLoading || !user) return;
    // Premium members get the workout in their own logbook, so it behaves
    // exactly like every other workout (player, logging, schedule, finish).
    void startWorkout({ data: { id: workoutId } })
      .then((r) => {
        if ("workoutId" in r) void navigate({ to: "/workout/$workoutId", params: { workoutId: r.workoutId }, replace: true });
        else if ("locked" in r) setState({ kind: "locked" });
        else setState({ kind: "error", msg: r.error });
      })
      .catch(() => setState({ kind: "error", msg: "Could not load this workout." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, user, authLoading]);

  const back = (
    <Link to="/smarty-workouts" className="text-xs font-bold uppercase tracking-wider text-primary">
      ← Smarty Workouts
    </Link>
  );

  if (!authLoading && !user) {
    return (
      <Notice back={back} card={card} title="Premium access required" text="Smarty Workouts are for Premium members. Log in to open this workout.">
        <Button asChild>
          <Link to="/auth" search={{ next: `/smarty-workouts/${workoutId}`, mode: "signin" }}>Log in</Link>
        </Button>
      </Notice>
    );
  }
  if (state.kind === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state.kind === "locked") {
    return (
      <Notice back={back} card={card} title="Premium access required" text="This workout is part of the Premium membership. Upgrade to open and follow it.">
        <Button onClick={() => setCheckout(true)}>View Premium</Button>
        <MembershipCheckoutDialog open={checkout} onOpenChange={setCheckout} />
      </Notice>
    );
  }
  if (state.kind === "error") return <Notice back={back} title="Workout unavailable" text={state.msg} />;

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Notice({ back, card, title, text, children }: { back: React.ReactNode; card?: SmartyWorkoutCard | null; title: string; text: string; children?: React.ReactNode }) {
  const category = card?.category as SmartyCategory | undefined;
  const fallback = category && CATEGORY_DETAILS[category] ? CATEGORY_DETAILS[category].image : undefined;
  const bodyweight = card ? card.equipment.length === 0 || card.equipment.every((i) => i.toLowerCase() === "bodyweight") : false;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 lg:max-w-6xl lg:px-8 lg:py-16">
      {back}
      {card && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-card">
          {(card.image_url ?? fallback) && (
            <div className="relative aspect-[3/2] bg-muted lg:aspect-[16/7]">
              <img src={coverVariant(card.image_url, 1280) ?? fallback} onError={fallbackTo(card.image_url ?? fallback)} alt={card.name} decoding="async" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <p className="text-xs font-bold uppercase text-primary">{categoryLabel(card.category)}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-foreground">{card.name}</h1>
            {card.focus && <p className="mt-2 text-sm text-muted-foreground">{card.focus}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />{card.duration_min} min</span>
              <span>{difficultyLabel(card.difficulty_stars)}</span>
              {card.format && <span>{card.format}</span>}
              <span>{bodyweight ? "Bodyweight" : card.equipment.join(", ")}</span>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-3xl border-2 border-blue-400 bg-card p-6 text-center">
        {card ? <h2 className="text-xl font-extrabold">{title}</h2> : <h1 className="text-xl font-extrabold">{title}</h1>}
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        {children && <div className="mt-4 flex justify-center">{children}</div>}
      </div>
    </div>
  );
}
