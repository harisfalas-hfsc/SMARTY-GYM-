import { createFileRoute } from "@tanstack/react-router";
import { MobileHomeActions } from "@/components/MobileHomeActions";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { DesktopAboutLanding } from "@/components/about/DesktopAboutLanding";
import { DesktopHomeStory } from "@/components/home/DesktopHomeStory";
import { getFeaturedSmartyWorkouts, getSmartyWorkoutCounts } from "@/lib/smarty-workouts.functions";



export const Route = createFileRoute("/")({
  loader: async () => {
    const [counts, featured] = await Promise.all([getSmartyWorkoutCounts(), getFeaturedSmartyWorkouts()]);
    return { counts, featured };
  },
  head: () => ({
    meta: [
      {
        title: "SmartyGym | Online Gym & Smart Workouts by Haris Falas",
      },
      {
        name: "description",
        content:
          "SmartyGym is an online gym with a personal coach built on the sports science of Haris Falas (CSCS). Create your workout in seconds and train strength, conditioning or mobility around your goals, your equipment and your schedule.",
      },
      {
        property: "og:title",
        content: "SmartyGym | Online Gym & Smart Workouts by Haris Falas",
      },
      {
        property: "og:description",
        content:
          "Your Gym Re-imagined. Anywhere, Anytime. Workout of the Day, daily coach guidance, Smarty Workouts, custom workout creation, training tools, and science-backed articles.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SmartyGym | Online Gym & Smart Workouts by Haris Falas" },
      {
        name: "twitter:description",
        content:
          "Your Gym Re-imagined. Anywhere, Anytime. Workout of the Day, daily coach guidance, Smarty Workouts, custom workout creation, training tools, and science-backed articles.",
      },
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
          name: "SmartyGym | Online Gym & Smart Workouts by Haris Falas",
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
  const { counts, featured } = Route.useLoaderData();
  const workoutCount = counts.total;
  return (
    <>
    <div className="mx-auto flex max-w-6xl flex-col px-4 pb-4 pt-0 sm:pb-6 lg:hidden">
      {/* Mobile introduction; desktop composition remains separate. */}
      <section className="py-6 lg:hidden">
        <h1 className="sr-only">SmartyGym – Online Gym &amp; Personalized Workouts by Haris Falas</h1>
        <MobileHomeActions showPricing={!freeAccessMode} workoutCount={workoutCount} featured={featured} />
      </section>
    </div>

    {/* DESKTOP — the About landing layout is the homepage */}
    <DesktopAboutLanding workoutCount={workoutCount} />
    <DesktopHomeStory />
    </>
  );
}

