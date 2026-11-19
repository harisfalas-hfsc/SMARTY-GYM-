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
          "SmartyGym: coach-designed workouts by Haris Falas (CSCS), Workout of the Day, daily Coach guidance and custom strength or muscle-building sessions. Build and log your own workouts. One Premium membership, €9.99/month.",
      },
      {
        property: "og:title",
        content: "SmartyGym | Online Gym & Smart Workouts by Haris Falas",
      },
      {
        property: "og:description",
        content:
          "Your Gym Re-imagined. Anywhere, Anytime. Coach-designed Smarty Workouts, Workout of the Day, daily guidance, custom strength and muscle-building workouts, Logbook, tools and articles. Premium: €9.99/month.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SmartyGym | Online Gym & Smart Workouts by Haris Falas" },
      {
        name: "twitter:description",
        content:
          "Your Gym Re-imagined. Anywhere, Anytime. Coach-designed Smarty Workouts, Workout of the Day, daily guidance, custom strength and muscle-building workouts, Logbook, tools and articles. Premium: €9.99/month.",
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
            "An online gym founded by Haris Falas (CSCS): coach-designed Smarty Workouts, Workout of the Day, daily Coach guidance, custom strength and hypertrophy sessions, training Logbook, tools and articles. One Premium membership at €9.99 per month.",
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

