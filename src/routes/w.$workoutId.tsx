import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Dumbbell, Lock, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWorkoutShareCard } from "@/lib/share.functions";
import { difficultyLabel, MAX_STARS, normalizeStars } from "@/lib/workout/spec";
import { coverVariant, fallbackTo } from "@/lib/cover-image";
import { SITE_URL } from "@/lib/seo/site";

export const Route = createFileRoute("/w/$workoutId")({
  loader: ({ params }) => getWorkoutShareCard({ data: { workoutId: params.workoutId } }),
  head: ({ loaderData }) => {
    const w = loaderData ?? null;
    const title = w ? `${w.name} — SmartyGym` : "Shared workout — SmartyGym";
    const bits = w
      ? [
          w.category,
          w.difficulty_label ?? difficultyLabel(w.difficulty_stars),
          w.duration_label ?? (w.duration_min ? `${w.duration_min} min` : null),
          w.location,
        ].filter(Boolean)
      : [];
    const description = w
      ? `${bits.join(" · ")} — open it on SmartyGym.`
      : "A community-shared workout on SmartyGym.";
    const image = w?.image_url?.startsWith("https://") ? w.image_url : w?.image_url?.startsWith("/api/public/workout-cover/") ? `${SITE_URL}${w.image_url}` : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: SharePreviewPage,
});

function SharePreviewPage() {
  const w = Route.useLoaderData();
  

  if (!w)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center lg:max-w-6xl">
        <p className="text-muted-foreground">This workout is no longer available.</p>
        <Button asChild className="mt-4 h-12 rounded-2xl">
          <Link to="/">Go to SmartyGym</Link>
        </Button>
      </div>
    );

  const stars = normalizeStars(w.difficulty_stars);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14 lg:max-w-3xl lg:px-8">
      <div className="rounded-3xl border-2 border-blue-400 bg-card p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Shared workout {w.category ? `· ${w.category}` : ""}
        </p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{w.name}</h1>
        {w.format && <p className="mt-1 text-xs font-bold uppercase text-primary">{w.format}</p>}
        {w.focus ? <p className="mt-1 text-muted-foreground">{w.focus}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: MAX_STARS }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < stars ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
              />
            ))}
          </span>
          <span>{w.difficulty_label ?? difficultyLabel(w.difficulty_stars)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {w.duration_label ?? (w.duration_min ? `${w.duration_min} min` : "—")}
          </span>
          {w.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {w.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            {(w.equipment ?? []).join(", ") || "bodyweight"}
          </span>
        </div>

        {w.image_url && <img src={coverVariant(w.image_url, 1280) ?? w.image_url} onError={fallbackTo(w.image_url)} alt={`${w.name} cover`} className="mt-5 h-52 w-full rounded-2xl object-cover" />}

        <div className="mt-6 rounded-2xl border-2 border-blue-400 bg-background/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Lock className="h-4 w-4 text-primary" /> The full workout is for members
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to open every exercise, the reader and the guided player.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button asChild className="h-12 rounded-2xl font-bold">
              <Link to="/community/workout/$workoutId" params={{ workoutId: w.id }}>Open shared workout</Link>
            </Button>
            <Button asChild variant="secondary" className="h-12 rounded-2xl">
              <Link to="/how-it-works">How SmartyGym works</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
