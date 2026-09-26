import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Dumbbell, PenLine } from "lucide-react";
import heroTraining from "@/assets/hero-training.jpg";
import { MobileHomeActions } from "@/components/MobileHomeActions";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          "online gym with a personal coach, personalized workout generator, online gym, personal coach app, workout of the day, smarty coach, training plan generator, home workout plan, gym workout plan",
      },
      {
        title: "Your gym reimagined.",
      },
      {
        name: "description",
        content:
          "SmartyGym is an online gym with a personal coach built on the sports science of Haris Falas (CSCS). Ask your coach for a session and train strength, conditioning or mobility around your goals, your equipment and your schedule.",
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
            "An online gym with a personal coach: ask your coach for a session and train around your goals, your equipment and your schedule.",
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
  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 pb-4 pt-0 sm:pb-6">
      {/* MOBILE — eyebrow + tight headline + tagline, matching the original design */}
      <section className="py-6 text-center sm:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Science-backed · Expert-designed
        </p>
        <h1 className="mt-3 text-[38px] font-extrabold uppercase leading-[1.02] tracking-tight">
          YOUR GYM
          <br />
          <span className="text-primary">RE-IMAGINED.</span>
        </h1>
        <p className="mt-4 text-[13px] font-semibold uppercase leading-[1.9] tracking-[0.16em] text-muted-foreground">
          Expert workouts · Exercise library
          <br />
          Blog insights · Smarty tools
          <br />
          <span className="text-primary">All in your pocket.</span>
        </p>

        <MobileHomeActions showPricing={!freeAccessMode} />
      </section>


      {/* FULL-BLEED HERO — desktop/tablet */}
      <section className="relative left-1/2 mb-4 hidden w-screen -translate-x-1/2 overflow-hidden sm:mb-6 sm:block">
        <img
          src={heroTraining}
          alt="Athlete training with dumbbells during a personalized workout session"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0_0)] via-[oklch(0.18_0_0)]/25 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-12 lg:px-6 lg:py-20">

          <div className="max-w-xl lg:max-w-3xl">
            <h1 className="text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-[44px] lg:text-[60px]">
              YOUR GYM
              <br />
              <span className="text-primary">RE-IMAGINED</span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/80 lg:mt-6 lg:text-lg">
              SmartyGym is your online gym and personal coach. Tell your coach how
              you feel, what you want to achieve and what you have to train with — and
              get a complete, properly programmed session built for you, whenever and
              wherever you train.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Link
                to="/coach"
                className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-base font-bold text-primary-foreground hover:opacity-95 lg:px-8"
              >
                <Dumbbell className="h-4 w-4 shrink-0" />
                Ask your coach
              </Link>
              <Link
                to="/wod"
                className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border-2 border-primary px-6 text-base font-bold text-primary hover:bg-primary/10 lg:px-8"
              >
                <CalendarCheck className="h-4 w-4 shrink-0" />
                Workout of the Day
              </Link>
            </div>
            <Link
              to="/founder-note"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4"
            >
              <PenLine className="h-4 w-4" />
              A note from the founder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

