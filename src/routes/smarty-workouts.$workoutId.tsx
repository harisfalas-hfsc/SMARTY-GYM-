import { coverVariant, fallbackTo } from "@/lib/cover-image";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Clock, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";
import { startSmartyWorkout } from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { CATEGORY_DETAILS, type SmartyCategory } from "@/lib/smarty-workout-categories";
import { difficultyLabel } from "@/lib/workout/spec";
import { getSmartyWorkoutSearchData } from "@/lib/seo/smarty-workout-public.functions";
import { SITE_URL } from "@/lib/seo/site";

type WorkoutSeo = NonNullable<Awaited<ReturnType<typeof getSmartyWorkoutSearchData>>>;

export const Route = createFileRoute("/smarty-workouts/$workoutId")({
  loader: async ({ params }) => {
    const data = await getSmartyWorkoutSearchData({ data: { id: params.workoutId } });
    // Old UUID addresses permanently move to the readable slug address.
    if (data?.slug && data.slug !== params.workoutId) {
      throw redirect({ to: "/smarty-workouts/$workoutId", params: { workoutId: data.slug }, statusCode: 301 });
    }
    return data;
  },
  head: ({ loaderData, params }) => {
    const url = `${SITE_URL}/smarty-workouts/${loaderData?.slug ?? params.workoutId}`;
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
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(loaderData ? { scripts: [{ type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ExercisePlan",
            "@id": `${url}#workout`,
            name: loaderData.name,
            description,
            url,
            ...(image ? { image } : {}),
            exerciseType: categoryLabel(loaderData.category),
            activityDuration: `PT${loaderData.duration_min}M`,
            intensity: difficultyLabel(loaderData.difficulty_stars ?? 1),
            ...(loaderData.format ? { workload: loaderData.format } : {}),
            author: { "@id": `${SITE_URL}/haris-falas#person` },
            provider: { "@id": `${SITE_URL}/#organization` },
            // Google paywall markup: the card facts are free, the workout itself is Premium.
            isAccessibleForFree: false,
            hasPart: {
              "@type": "WebPageElement",
              isAccessibleForFree: false,
              cssSelector: "[aria-label='Workout sections']",
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Smarty Workouts", item: `${SITE_URL}/smarty-workouts` },
              { "@type": "ListItem", position: 3, name: loaderData.name, item: url },
            ],
          },
        ],
      }) }] } : {}),
    };
  },
  component: SmartyWorkoutPage,
});

function SmartyWorkoutPage() {
  const { workoutId } = Route.useParams();
  const seo = Route.useLoaderData();
  const { user, loading: authLoading } = useAuth();
  const startWorkout = useServerFn(startSmartyWorkout);
  const navigate = useNavigate();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "locked" } | { kind: "error"; msg: string }
  >({ kind: "loading" });
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    // Premium members get the workout in their own logbook, so it behaves
    // exactly like every other workout (player, logging, schedule, finish).
    void startWorkout({ data: { id: seo?.id ?? workoutId } })
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
      <Notice back={back} seo={seo} title="Premium access required" text="Smarty Workouts are for Premium members. Log in or join SmartyGym to open this workout.">
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/auth" search={{ next: `/smarty-workouts/${workoutId}`, mode: "signup" }}>Join now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth" search={{ next: `/smarty-workouts/${workoutId}`, mode: "signin" }}>Log in</Link>
          </Button>
        </div>
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
      <Notice back={back} seo={seo} title="Premium access required" text="This workout is part of the Premium membership. Upgrade to open and follow it.">
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

function Notice({ back, seo, title, text, children }: { back: React.ReactNode; seo?: WorkoutSeo | null; title: string; text: string; children?: React.ReactNode }) {
  const category = seo?.category as SmartyCategory | undefined;
  const fallback = category && CATEGORY_DETAILS[category] ? CATEGORY_DETAILS[category].image : undefined;
  const equipment = seo?.equipment ?? [];
  const bodyweight = seo ? equipment.length === 0 || equipment.every((i) => i.toLowerCase() === "bodyweight") : false;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 lg:max-w-6xl lg:px-8 lg:py-16">
      {back}
      {seo && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-card">
          {(seo.image ?? fallback) && (
            <div className="relative aspect-[3/2] bg-muted lg:aspect-[16/7]">
              <img src={coverVariant(seo.image_url, 1280) ?? fallback} onError={fallbackTo(seo.image_url ?? fallback)} alt={seo.name} decoding="async" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <p className="text-xs font-bold uppercase text-primary">{categoryLabel(seo.category)}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-foreground">{seo.name}</h1>
            {seo.focus && <p className="mt-2 text-sm text-muted-foreground">{seo.focus}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />{seo.duration_min} min</span>
              <span>{difficultyLabel(seo.difficulty_stars ?? 1)}</span>
              {seo.format && <span>{seo.format}</span>}
              <span>{bodyweight ? "Bodyweight" : equipment.join(", ")}</span>
            </div>
          </div>
        </div>
      )}
      {seo && (
        <div className="mt-4 space-y-2" aria-label="Workout sections">
          {["Activation", "Main Workout", "Finisher", "Cool Down"].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-2xl border-2 border-border bg-card px-5 py-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">{s}</h3>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><Lock className="h-4 w-4 text-primary" />Premium</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 rounded-3xl border-2 border-blue-400 bg-card p-6 text-center">
        {seo ? <h2 className="text-xl font-extrabold">{title}</h2> : <h1 className="text-xl font-extrabold">{title}</h1>}
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        {children && <div className="mt-4 flex justify-center">{children}</div>}
      </div>
    </div>
  );
}
