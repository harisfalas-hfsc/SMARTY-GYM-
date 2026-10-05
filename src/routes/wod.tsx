import { createFileRoute, Link } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { getTodayWod, type WodDay } from "@/lib/wod.functions";
import { getCycleDay } from "@/lib/wod-cycle";
import pageHeroImage from "@/assets/hero-wod-card.jpg";
import { WodMobileCards, WorkoutCard } from "@/components/wod/WodMobileCards";
import { WodPeriodizationCalendar } from "@/components/wod/WodPeriodizationCalendar";

export const Route = createFileRoute("/wod")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/wod", "workout of the day, wod, daily workout, bodyweight workout of the day, equipment workout of the day, periodized training, recovery day workout"),
      },
      { title: "Workout of the Day — Smarty Gym" },
      {
        name: "description",
        content:
          "Two fresh, expertly designed workouts every training day — one with equipment, one without — following a science-based periodization approach by Coach Haris Falas.",
      },
      { property: "og:title", content: "Workout of the Day — Smarty Gym" },
      {
        property: "og:description",
        content: "Today's two expert-designed workouts — one with equipment, one without.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/wod" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/wod" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              url: "https://smartygym.com/wod",
              name: "Workout of the Day — Smarty Gym",
              description:
                "Two fresh, expertly designed workouts every training day — one with equipment, one without — following a science-based periodization approach by Coach Haris Falas.",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              about: { "@id": "https://smartygym.com/#software" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Workout of the Day",
                  item: "https://smartygym.com/wod",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),

  component: WodPage,
});

function WodPage() {
  const [data, setData] = useState<{ today: WodDay; tomorrow: WodDay } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void getTodayWod()
      .then((r) => ("error" in r ? setFailed(true) : setData(r)))
      .catch(() => setFailed(true));
  }, []);

  const yesterday = data ? getCycleDay(shiftDay(data.today.date, -1)) : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader image={pageHeroImage} eyebrow="SMARTYGYM" title="Workout of the Day" />

      <Card className="mb-8 border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-primary">
        <div className="p-4 sm:p-6">
          <p className="mx-auto hidden max-w-3xl text-center text-base text-muted-foreground sm:block">
            Every training day <span className="font-semibold text-primary">SmartyGym</span> delivers TWO fresh, expertly designed workouts following a strategic periodization cycle — one with equipment and one without. On recovery days, we provide a single guided recovery session. Each day focuses on a different category and difficulty level. Our workouts follow a science-based periodization approach designed by{" "}
            <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Coach Haris Falas</Link>
            , ensuring that within each weekly cycle, you train all fitness parameters. Unlike random workouts you find on YouTube or Instagram, following{" "}
            <span className="font-semibold text-primary">SmartyGym</span>'s structured program means you can rest assured that your training is reliable, professionally organized, and designed to systematically improve all aspects of your fitness.
          </p>
          <p className="mx-auto block max-w-3xl text-center text-sm text-muted-foreground sm:hidden">
            Our WOD's follow a science-based periodization approach designed by Coach{" "}
            <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>
            , ensuring that within each weekly cycle, you train all fitness parameters. Following{" "}
            <span className="font-semibold text-primary">SmartyGym</span>'s structured program means you can rest assured that your training is reliable, professionally organized, and designed to systematically improve all aspects of your fitness.
          </p>
        </div>
      </Card>

      {failed ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">Workout of the Day is unavailable right now. Please try again shortly.</p>
      ) : !data || !yesterday ? (
        <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <WodPeriodizationCalendar
            yesterday={{ date: shiftDay(data.today.date, -1), category: yesterday.category, difficulty: yesterday.difficulty }}
            today={{ date: data.today.date, category: data.today.category, difficulty: data.today.difficulty }}
            tomorrow={{ date: data.tomorrow.date, category: data.tomorrow.category, difficulty: data.tomorrow.difficulty }}
          />

          {data.today.cards.length === 0 ? (
            <Card className="border-2 border-dashed border-primary/30">
              <div className="p-12 text-center">
                <Clock className="mx-auto mb-4 h-16 w-16 text-primary/50" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">Today's Workouts are Being Prepared</h2>
                <p className="text-muted-foreground">Check back <span className="font-semibold text-primary">soon</span> for your fresh Workouts of the Day!</p>
              </div>
            </Card>
          ) : data.today.cards.length === 1 ? (
            <div className="w-full">
              <WorkoutCard workout={data.today.cards[0]!.workout} kind={data.today.cards[0]!.slot} fallback={pageHeroImage} />
            </div>
          ) : (
            <>
              <div className="sm:hidden">
                <WodMobileCards cards={data.today.cards} fallback={pageHeroImage} />
              </div>
              <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:gap-6">
                {data.today.cards.map((c) => (
                  <WorkoutCard key={c.slot} workout={c.workout} kind={c.slot} fallback={pageHeroImage} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function shiftDay(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
