import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { getPublicExercise } from "@/lib/seo/exercise-public.functions";
import { ExerciseLibraryPage, type Exercise } from "./exercise-library";
import { SITE_URL } from "@/lib/seo/site";

function capitalizeWords(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Route = createFileRoute("/exercise-library/$slug")({
  loader: async ({ params }) => {
    const exercise = await getPublicExercise({ data: { slug: params.slug } });
    if (!exercise) throw notFound();
    return exercise;
  },
  head: ({ loaderData, params }) => {
    const url = `${SITE_URL}/exercise-library/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Exercise not found | SmartyGym" }, { name: "robots", content: "noindex" }] };
    }
    const ex = loaderData;
    const name = capitalizeWords(ex.name);
    const title = `${name} – How To, Muscles Worked | SmartyGym`;
    const muscles = [ex.target_muscle, ...(ex.secondary_muscles ?? [])].filter(Boolean).join(", ");
    const description =
      ex.description?.trim() ||
      `${name}: how to perform it step by step${muscles ? `, muscles worked (${muscles})` : ""}${ex.equipment ? `, equipment: ${ex.equipment}` : ""}. From the SmartyGym exercise library.`;
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
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                  { "@type": "ListItem", position: 2, name: "Exercise Library", item: `${SITE_URL}/exercise-library` },
                  { "@type": "ListItem", position: 3, name, item: url },
                ],
              },
            ],
          }),
        },
      ],
    };
  },
  component: ExerciseSlugPage,
});

function ExerciseSlugPage() {
  const exercise = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <>
      {/* Semantic heading for crawlers; the visible design is the existing dialog. */}
      <h1 className="sr-only">{capitalizeWords(exercise.name)}</h1>
      <ExerciseLibraryPage
        initialExercise={exercise as Exercise}
        onCloseSelected={() => void navigate({ to: "/exercise-library" })}
      />
    </>
  );
}
