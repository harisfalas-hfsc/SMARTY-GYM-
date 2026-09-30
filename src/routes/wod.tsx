import { createFileRoute, Link } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, Crown, Gauge, Loader2, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { getTodayWod, type WodDay } from "@/lib/wod.functions";
import { SLOT_LABEL } from "@/lib/wod/rules";
import { difficultyLabel } from "@/lib/workout/spec";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { coverVariant, fallbackTo } from "@/lib/cover-image";
import pageHeroImage from "@/assets/hero-wod-card.jpg";

export const Route = createFileRoute("/wod")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/wod", "workout of the day, wod, daily workout, bodyweight workout of the day, equipment workout of the day, 84 day training cycle, recovery day workout"),
      },
      { title: "Workout of the Day — Smarty Gym" },
      {
        name: "description",
        content:
          "Every day at midnight Cyprus time Smarty Gym picks the Workout of the Day from the 84-day periodization: one bodyweight and one equipment workout by Haris Falas.",
      },
      { property: "og:title", content: "Workout of the Day — Smarty Gym" },
      {
        property: "og:description",
        content: "Today's bodyweight and equipment Workouts of the Day, picked from Smarty Workouts by the 84-day periodization.",
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
                "Every day at midnight Cyprus time Smarty Gym picks the Workout of the Day from the 84-day periodization: one bodyweight and one equipment workout by Haris Falas.",
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function planLine(day: WodDay) {
  return [categoryLabel(day.category), day.difficulty, day.focus].filter(Boolean).join(" · ");
}

function WodPage() {
  const [data, setData] = useState<{ today: WodDay; tomorrow: WodDay } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void getTodayWod()
      .then((r) => ("error" in r ? setFailed(true) : setData(r)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-6xl lg:px-8 lg:py-16">
      <PageHeader
        image={pageHeroImage}
        eyebrow="SMARTY GYM"
        title="Workout of the Day"
        subtitle="Every day at 00:00 Cyprus time, one bodyweight and one equipment workout are picked from Smarty Workouts, following the 84-day periodization."
      />

      {failed ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">Workout of the Day is unavailable right now. Please try again shortly.</p>
      ) : !data ? (
        <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Today · {formatDate(data.today.date)}</p>
              <p className="mt-1 text-lg font-extrabold">{planLine(data.today)}</p>
              <p className="text-xs text-muted-foreground">Day {data.today.cycleDay} of the 84-day periodization</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tomorrow</p>
              <p className="mt-1 text-sm font-semibold">{planLine(data.tomorrow)}</p>
            </div>
          </div>

          {data.today.cards.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-primary/35 px-5 py-10 text-center text-sm text-muted-foreground">Today's workouts are being prepared.</div>
          ) : (
            <div className={`grid gap-4 ${data.today.cards.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-xl"}`}>
              {data.today.cards.map(({ slot, workout: w }) => (
                <div key={slot} className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <img
                    src={coverVariant(w.image_url, 640) ?? pageHeroImage}
                    onError={fallbackTo(w.image_url ?? pageHeroImage)}
                    alt={w.name}
                    loading="eager"
                    decoding="async"
                    width={640}
                    height={427}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <Link to="/smarty-workouts/$workoutId" params={{ workoutId: w.id }} className="relative block h-full p-4 transition hover:bg-primary/10">
                    <p className="w-fit rounded-md border border-workout-overlay-border bg-workout-overlay px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-sm">
                      {SLOT_LABEL[slot]} Workout of the Day
                    </p>
                    <p className="mt-2 w-fit max-w-full rounded-md border border-workout-overlay-border bg-workout-overlay px-2 py-1 text-base font-bold leading-tight text-workout-overlay-foreground shadow-sm backdrop-blur-sm">{w.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md border border-workout-overlay-border bg-workout-overlay px-2 py-1 text-workout-overlay-foreground shadow-sm backdrop-blur-sm"><Clock className="h-3.5 w-3.5 text-primary" />{w.duration_min} min</span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-workout-overlay-border bg-workout-overlay px-2 py-1 text-workout-overlay-foreground shadow-sm backdrop-blur-sm"><Gauge className="h-3.5 w-3.5 text-primary" />{difficultyLabel(w.difficulty_stars)}</span>
                      {w.format ? <span className="inline-flex items-center gap-1 rounded-md border border-workout-overlay-border bg-workout-overlay px-2 py-1 text-workout-overlay-foreground shadow-sm backdrop-blur-sm"><Repeat2 className="h-3.5 w-3.5 text-primary" />{w.format}</span> : null}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-card p-4">
              <p className="flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-primary" />Everyone can see the Workout of the Day. Premium members can open and train it.</p>
              <Button asChild size="sm"><Link to="/pricing">Go Premium</Link></Button>
            </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-foreground"><CalendarDays className="h-4 w-4 text-primary" />How the Workout of the Day works</h2>
            <p>Smarty Gym follows an 84-day periodization made of three 28-day blocks. Each day has a planned category and level, so hard and easy days alternate and every quality is trained. At midnight Cyprus time the system picks today's workouts from Smarty Workouts: one bodyweight workout you can do anywhere and one equipment workout. Recovery days have one Recovery workout. A workout is not repeated until every other matching workout has been used.</p>
          </div>
        </>
      )}
    </div>
  );
}
