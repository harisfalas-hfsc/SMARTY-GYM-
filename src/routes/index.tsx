import { createFileRoute } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { MobileHomeActions } from "@/components/MobileHomeActions";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { DesktopAboutLanding } from "@/components/about/DesktopAboutLanding";
import { DesktopHomeStory } from "@/components/home/DesktopHomeStory";
import { getSmartyWorkoutCounts } from "@/lib/smarty-workouts.functions";



export const Route = createFileRoute("/")({
  loader: () => getSmartyWorkoutCounts(),
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/", "online gym with a personal coach, personalized workout generator, online gym, personal coach app, workout of the day, smarty coach, training plan generator, home workout plan, gym workout plan, exercise library, Freeletics alternative, Peloton alternative, Haris Falas"),
      },
      {
        title: "Your gym reimagined.",
      },
      {
        name: "description",
        content:
          "SmartyGym is an online gym with a personal coach built on the sports science of Haris Falas (CSCS). Create your workout in seconds and train strength, conditioning or mobility around your goals, your equipment and your schedule.",
      },
      {
        property: "og:title",
        content: "Your gym reimagined.",
      },
      {
        property: "og:description",
        content:
          "Personalized workouts built around your body, goals and equipment, programmed on the sports science of Haris Falas. Two workouts every day with Smarty Coach.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://smartygym.com/" },
      {
        property: "og:image",
        content: "https://smartygym.com/og-social.jpg",
      },
      {
        name: "twitter:image",
        content: "https://smartygym.com/og-social.jpg",
      },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "https://smartygym.com/#webpage",
          url: "https://smartygym.com/",
          name: "Your gym reimagined.",
          description:
            "An online gym with a personal coach: create your workout in seconds and train around your goals, your equipment and your schedule.",
          inLanguage: "en",
          isPartOf: { "@id": "https://smartygym.com/#website" },
          about: { "@id": "https://smartygym.com/#software" },
          primaryImageOfPage: "https://smartygym.com/og-social.jpg",
        }),
      },
    ],
  }),

  component: Home,
});

function Home() {
  const { freeAccessMode } = useFreeAccessMode();
  const workoutCount = Route.useLoaderData().total;
  return (
    <>
    <div className="mx-auto flex max-w-6xl flex-col px-4 pb-4 pt-0 sm:pb-6">
      {/* MOBILE — eyebrow + tight headline + tagline, matching the original design */}
      <section className="py-6 sm:hidden">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Science-backed · Expert-designed
        </p>
        <h1 className="mt-3 text-center text-[38px] font-extrabold uppercase leading-[1.02] tracking-tight">
          YOUR GYM
          <br />
          <span className="text-primary">RE-IMAGINED.</span>
        </h1>
        <p className="mt-4 text-center text-[13px] font-semibold uppercase leading-[1.9] tracking-[0.16em] text-muted-foreground">
          Expert workouts · Exercise library
          <br />
          Blog insights · Smarty tools
          <br />
          <span className="text-primary">All in your pocket.</span>
        </p>

        <MobileHomeActions showPricing={!freeAccessMode} workoutCount={workoutCount} />
      </section>
    </div>

    {/* DESKTOP — the About landing layout is the homepage */}
    <DesktopAboutLanding workoutCount={workoutCount} />
    <DesktopHomeStory />
    </>
  );
}

