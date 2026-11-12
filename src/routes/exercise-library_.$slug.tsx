import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight, Dumbbell, Library } from "lucide-react";
import { getExerciseLanding } from "@/lib/seo/exercise-public.functions";
import type { ExerciseLink, WorkoutLink } from "@/lib/seo/exercise-public.server";
import { SITE_URL } from "@/lib/seo/site";
import { ExerciseGif } from "@/components/ExerciseGif";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function capitalizeWords(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Standalone exercise guide: its own page, with links to related exercises and workouts. */
export const Route = createFileRoute("/exercise-library_/$slug")({
  loader: async ({ params }) => {
    const landing = await getExerciseLanding({ data: { slug: params.slug } });
    if (!landing) throw notFound();
    return landing;
  },
  head: ({ loaderData, params }) => {
    const url = `${SITE_URL}/exercise-library/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Exercise not found | SmartyGym" }, { name: "robots", content: "noindex" }] };
    }
    const ex = loaderData.exercise;
    const name = capitalizeWords(ex.name);
    const title = `${name} – How To, Muscles Worked | SmartyGym`;
    const muscles = [ex.target_muscle, ...(ex.secondary_muscles ?? [])].filter(Boolean).join(", ");
    const description =
      ex.description?.trim() ||
      `${name}: how to perform it step by step${muscles ? `, muscles worked (${muscles})` : ""}${ex.equipment ? `, equipment: ${ex.equipment}` : ""}. From the SmartyGym exercise library.`;
    const related = [...loaderData.sameMuscle, ...loaderData.sameEquipment];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:site_name", content: "SmartyGym" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "HowTo",
                "@id": `${url}#howto`,
                name: `How to do ${name}`,
                description,
                inLanguage: "en",
                isPartOf: { "@id": `${SITE_URL}/#website` },
                ...(ex.gif_path
                  ? { image: `${SITE_URL}/api/public/exercise-media/${ex.slug}`, video: { "@id": `${url}#demonstration` } }
                  : {}),
                ...(ex.equipment ? { tool: [{ "@type": "HowToTool", name: ex.equipment }] } : {}),
                ...(ex.instructions?.length
                  ? {
                      step: ex.instructions.map((text, i) => ({
                        "@type": "HowToStep",
                        position: i + 1,
                        text,
                      })),
                    }
                  : {}),
              },
              ...(ex.gif_path
                ? [
                    {
                      // Demonstration animation, described for video/rich-result indexers.
                      "@type": "VideoObject",
                      "@id": `${url}#demonstration`,
                      name: `${name} demonstration`,
                      description,
                      thumbnailUrl: [`${SITE_URL}/api/public/exercise-media/${ex.slug}`],
                      contentUrl: `${SITE_URL}/api/public/exercise-media/${ex.slug}`,
                      encodingFormat: /\.gif$/i.test(ex.gif_path) ? "image/gif" : undefined,
                      uploadDate: ex.created_at ?? "2025-01-01T00:00:00Z",
                      isFamilyFriendly: true,
                      inLanguage: "en",
                      embedUrl: url,
                      publisher: { "@id": `${SITE_URL}/#organization` },
                    },
                  ]
                : []),
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                  { "@type": "ListItem", position: 2, name: "Exercise Library", item: `${SITE_URL}/exercise-library` },
                  { "@type": "ListItem", position: 3, name, item: url },
                ],
              },
              ...(related.length
                ? [
                    {
                      "@type": "ItemList",
                      name: `Exercises related to ${name}`,
                      itemListElement: related.map((r, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        name: capitalizeWords(r.name),
                        url: `${SITE_URL}/exercise-library/${r.slug}`,
                      })),
                    },
                  ]
                : []),
            ],
          }),
        },
      ],
    };
  },
  component: ExercisePage,
});

function ExerciseCard({ ex }: { ex: ExerciseLink }) {
  return (
    <Link
      to="/exercise-library/$slug"
      params={{ slug: ex.slug }}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors"
    >
      <ExerciseGif path={ex.gif_path} alt={`${ex.name} demonstration`} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold capitalize leading-snug">{ex.name}</span>
        <span className="mt-1 flex flex-wrap gap-1">
          {[ex.target_muscle, ex.equipment].filter(Boolean).map((tag) => (
            <Badge key={tag as string} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </span>
      </span>
    </Link>
  );
}

function WorkoutCard({ w }: { w: WorkoutLink }) {
  return (
    <a
      href={w.path}
      className="group overflow-hidden rounded-2xl border bg-card transition-colors"
    >
      {w.image_url ? (
        <img
          src={w.image_url}
          alt={w.name}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-secondary text-muted-foreground">
          <Dumbbell className="h-8 w-8" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-bold leading-snug">{w.name}</p>
        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {w.category.toLowerCase()} · {w.duration_min} min
        </p>
      </div>
    </a>
  );
}

function ExercisePage() {
  const { exercise: ex, sameMuscle, sameEquipment, previous, next, workouts } = Route.useLoaderData();
  const name = capitalizeWords(ex.name);
  const facts: [string, string | null][] = [
    ["Body part", ex.body_part],
    ["Target muscle", ex.target_muscle],
    ["Equipment", ex.equipment],
    ["Level", ex.difficulty],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/exercise-library" className="hover:text-primary">Exercise Library</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="capitalize text-foreground">{ex.name}</span>
      </nav>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-coach-line bg-white lg:sticky lg:top-24">
          {ex.gif_path ? (
            <ExerciseGif
              path={ex.gif_path}
              alt={`${name} demonstration`}
              className="block h-auto max-h-[60vh] w-full rounded-none bg-white object-contain"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-secondary text-muted-foreground">
              <Dumbbell className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Exercise guide</p>
            <h1 className="mt-1 text-3xl font-extrabold capitalize leading-tight sm:text-4xl">{ex.name}</h1>
          </header>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {facts.map(([label, value]) =>
              value ? (
                <div key={label} className="rounded-xl border border-coach-line bg-primary/5 p-2.5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">{label}</p>
                  <p className="font-medium capitalize">{value}</p>
                </div>
              ) : null,
            )}
          </div>

          {ex.secondary_muscles?.length ? (
            <div className="rounded-xl border border-coach-line bg-primary/5 p-3 text-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">Secondary muscles</p>
              <p className="capitalize">{ex.secondary_muscles.join(", ")}</p>
            </div>
          ) : null}

          {ex.description ? (
            <section className="rounded-xl border border-coach-line p-3 text-sm leading-relaxed">
              <h2 className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">About this exercise</h2>
              <p>{ex.description}</p>
            </section>
          ) : null}

          {ex.instructions?.length ? (
            <section className="rounded-xl border border-coach-line p-3">
              <h2 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">How to do {name}</h2>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                {ex.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}

          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/exercise-library">
              <Library className="mr-2 h-4 w-4" /> Browse the full exercise library
            </Link>
          </Button>
        </div>
      </article>

      {sameMuscle.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold">
            More <span className="capitalize">{ex.target_muscle}</span> exercises
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sameMuscle.map((r) => (
              <ExerciseCard key={r.slug} ex={r} />
            ))}
          </div>
        </section>
      ) : null}

      {sameEquipment.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Other <span className="capitalize">{ex.body_part}</span> exercises with{" "}
            <span className="capitalize">{ex.equipment}</span>
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sameEquipment.map((r) => (
              <ExerciseCard key={r.slug} ex={r} />
            ))}
          </div>
        </section>
      ) : null}

      {workouts.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Smarty Workouts to train with</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workouts.map((w) => (
              <WorkoutCard key={w.path} w={w} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/smarty-workouts" className="text-sm font-semibold text-primary">
              See all Smarty Workouts →
            </Link>
          </div>
        </section>
      ) : null}

      {previous || next ? (
        <nav aria-label="More exercises" className="mt-12 grid gap-2 sm:grid-cols-2">
          {previous ? (
            <Link
              to="/exercise-library/$slug"
              params={{ slug: previous.slug }}
              className="flex items-center gap-2 rounded-2xl border p-3 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Previous exercise</span>
                <span className="block truncate font-semibold capitalize">{previous.name}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/exercise-library/$slug"
              params={{ slug: next.slug }}
              className="flex items-center justify-end gap-2 rounded-2xl border p-3 text-right text-sm transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Next exercise</span>
                <span className="block truncate font-semibold capitalize">{next.name}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
