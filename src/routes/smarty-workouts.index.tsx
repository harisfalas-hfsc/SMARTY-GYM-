import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { getSmartyWorkoutCounts, SMARTY_WORKOUT_CATEGORIES } from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { CATEGORY_DETAILS, categorySlug } from "@/lib/smarty-workout-categories";
import pageHeroImage from "@/assets/smarty-workouts-card.jpg";

export const Route = createFileRoute("/smarty-workouts/")({
  loader: () => getSmartyWorkoutCounts(),
  head: () => ({
    meta: [
      { name: "keywords", content: withExtendedKeywords("/smarty-workouts", "ready workouts, smarty workouts") },
      { title: "Smarty Workouts — Ready Workouts by Haris Falas | SMARTYGYM" },
      {
        name: "description",
        content:
          "Ready-made workouts by Coach Haris Falas in eight categories: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability and Pilates.",
      },
      { property: "og:title", content: "Smarty Workouts — Ready Workouts | SMARTYGYM" },
      { property: "og:description", content: "Ready workouts by Haris Falas in eight training categories." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/smarty-workouts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/smarty-workouts" }],
  }),
  component: SmartyWorkoutsPage,
});

function SmartyWorkoutsPage() {
  const counts = Route.useLoaderData();
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setActive(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader
        image={pageHeroImage}
        eyebrow="SMARTYGYM"
        title="Smarty Workouts"
        subtitle={
          <>
            <span className="font-extrabold text-primary">{counts.total.toLocaleString()}</span> expert-designed workouts across eight categories. Pick a category and start training.
          </>
        }
      />

      {/* Mobile: same card style as the homepage carousel */}
      <div className="lg:hidden">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => api?.scrollPrev()} aria-label="Previous category" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-lg font-extrabold uppercase text-primary">Categories</p>
          <Button type="button" variant="ghost" size="icon" onClick={() => api?.scrollNext()} aria-label="Next category" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Carousel className="w-full" opts={{ align: "center", loop: true }} setApi={setApi}>
          <CarouselContent className="-ml-3">
            {SMARTY_WORKOUT_CATEGORIES.map((category, index) => {
              const detail = CATEGORY_DETAILS[category];
              const Icon = detail.Icon;
              return (
                <CarouselItem key={category} className="basis-[75%] pl-3 sm:basis-[60%]">
                  <Link
                    to="/smarty-workouts/category/$category"
                    params={{ category: categorySlug(category) }}
                    className="flex flex-col overflow-hidden rounded-xl border-2 border-primary/40 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/8] w-full shrink-0 overflow-hidden">
                      <img src={detail.image} alt={categoryLabel(category)} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover object-[center_top]" />
                      <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
                        {counts.byCategory[category] ?? 0}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-2 text-center">
                      <div className="mb-0.5 flex items-center justify-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-3 w-3 text-primary" />
                        </span>
                        <h2 className="whitespace-nowrap text-xs font-bold leading-tight text-foreground">{categoryLabel(category)}</h2>
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{detail.description}</p>
                      <span className="mt-0.5 flex items-center justify-center gap-1 text-[9px] font-medium text-primary">
                        Explore<ChevronRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-4 flex justify-center gap-2">
          {SMARTY_WORKOUT_CATEGORIES.map((category, index) => (
            <Button
              key={category}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Go to ${categoryLabel(category)}`}
              onClick={() => api?.scrollTo(index)}
              className={cn("h-2.5 w-2.5 rounded-full p-0 transition-all", active === index ? "scale-125 bg-primary hover:bg-primary" : "bg-primary/30 hover:bg-primary/50")}
            />
          ))}
        </div>
      </div>

      {/* Desktop: category cards, each opens its own page */}
      <div className="hidden grid-cols-2 gap-6 lg:grid xl:grid-cols-4">
        {SMARTY_WORKOUT_CATEGORIES.map((category) => {
          const detail = CATEGORY_DETAILS[category];
          const Icon = detail.Icon;
          return (
            <Link
              key={category}
              to="/smarty-workouts/category/$category"
              params={{ category: categorySlug(category) }}
              className="group overflow-hidden rounded-lg border-2 border-border bg-card text-center transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                <img src={detail.image} alt={categoryLabel(category)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-extrabold text-foreground shadow-sm backdrop-blur-sm">
                  {counts.byCategory[category] ?? 0}
                </span>
              </div>
              <div className="flex min-h-[190px] flex-col items-center px-5 py-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Icon className="h-6 w-6 text-primary" /></span>
                <h2 className="mt-3 text-lg font-bold text-foreground">{categoryLabel(category)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
