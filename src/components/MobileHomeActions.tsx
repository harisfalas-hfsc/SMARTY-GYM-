import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, ChevronLeft, ChevronRight, Crown, Dumbbell, Info, NotebookPen, Newspaper, Users, Wrench, type LucideIcon } from "lucide-react";
import premiumImage from "@/assets/premium-membership-card.jpg";
import wodImage from "@/assets/hero-wod-card.jpg";
import sharedWorkoutsImage from "@/assets/shared-workouts-card.jpg";
import founderPhoto from "@/assets/haris-falas-coach.jpg";
import createWorkoutImage from "@/assets/create-workout-card.jpg";
import toolsImage from "@/assets/explore-tools.jpg";
import exerciseLibraryImage from "@/assets/explore-exercise-library.jpg";
import blogImage from "@/assets/explore-blog.jpg";
import communityImage from "@/assets/community-card.jpg";
import aboutImage from "@/assets/about-smartygym-card.jpg";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type CarouselAction = {
  title: string;
  description: string;
  to: "/create-your-workout" | "/wod" | "/pricing" | "/shared-workouts";
  image: string;
  icon: LucideIcon;
  objectPosition?: string;
};

type ExploreAction = {
  title: string;
  description: string;
  to: "/tools" | "/exercise-library" | "/blog" | "/pricing";
  image: string;
  icon: LucideIcon;
};

export function MobileHomeActions({ showPricing }: { showPricing: boolean }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [exploreApi, setExploreApi] = useState<CarouselApi>();
  const [exploreIndex, setExploreIndex] = useState(0);

  const carouselActions: CarouselAction[] = [
    {
      title: "Create Your Workout",
      description: "Get a personalized workout built for you",
      to: "/create-your-workout",
      image: createWorkoutImage,
      icon: Dumbbell,
      objectPosition: "center center",
    },
    {
      title: "Workout of the Day",
      description: "Follow today's complete training session",
      to: "/wod",
      image: wodImage,
      icon: CalendarCheck,
    },
    {
      title: "Shared Workouts",
      description: "Explore workouts shared by members",
      to: "/shared-workouts",
      image: sharedWorkoutsImage,
      icon: Users,
    },
  ];

  const exploreActions: ExploreAction[] = [
    {
      title: "Smarty Tools",
      description: "Calculators for fitness metrics",
      to: "/tools",
      image: toolsImage,
      icon: Wrench,
    },
    {
      title: "Exercise Library",
      description: "Video demos for every exercise",
      to: "/exercise-library",
      image: exerciseLibraryImage,
      icon: BookOpen,
    },
    {
      title: "Blog & Insights",
      description: "Expert articles and fitness tips",
      to: "/blog",
      image: blogImage,
      icon: Newspaper,
    },
    ...(showPricing
      ? [
          {
            title: "Premium membership",
            description: "See membership options and full access",
            to: "/pricing" as const,
            image: premiumImage,
            icon: Crown,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelected = () => setActiveIndex(carouselApi.selectedScrollSnap());
    updateSelected();
    carouselApi.on("select", updateSelected);
    carouselApi.on("reInit", updateSelected);
    return () => {
      carouselApi.off("select", updateSelected);
      carouselApi.off("reInit", updateSelected);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!exploreApi) return;
    const updateSelected = () => setExploreIndex(exploreApi.selectedScrollSnap());
    updateSelected();
    exploreApi.on("select", updateSelected);
    exploreApi.on("reInit", updateSelected);
    return () => {
      exploreApi.off("select", updateSelected);
      exploreApi.off("reInit", updateSelected);
    };
  }, [exploreApi]);

  return (
    <div className="mt-5 sm:hidden">
      <div className="mb-4 flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollPrev()}
          aria-label="Previous option"
          className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-lg font-extrabold uppercase text-primary">Start training</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollNext()}
          aria-label="Next option"
          className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Carousel className="w-full" opts={{ align: "center", loop: true }} setApi={setCarouselApi}>
        <CarouselContent className="-ml-3">
          {carouselActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <CarouselItem key={action.to} className="basis-[75%] pl-3 sm:basis-[60%]">
                <Link
                  to={action.to}
                  className="flex flex-col overflow-hidden rounded-xl border-2 border-green-500/60 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-green-500 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/8] w-full shrink-0 overflow-hidden">
                    <img
                      src={action.image}
                      alt={action.title}
                      width={1280}
                      height={640}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: action.objectPosition ?? "center top" }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-2 text-center">
                    <div className="mb-0.5 flex items-center justify-center gap-1.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-3 w-3 text-primary" />
                      </span>
                      <h2 className="whitespace-nowrap text-xs font-bold leading-tight text-foreground">{action.title}</h2>
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{action.description}</p>
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
        {carouselActions.map((action, index) => (
          <Button
            key={action.to}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => carouselApi?.scrollTo(index)}
            aria-label={`Go to ${action.title}`}
            className={cn(
              "h-2.5 rounded-full p-0 transition-all",
              activeIndex === index ? "w-2.5 scale-125 bg-primary hover:bg-primary" : "w-2.5 bg-primary/30 hover:bg-primary/50",
            )}
          />
        ))}
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => exploreApi?.scrollPrev()}
            aria-label="Previous Explore option"
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-lg font-extrabold uppercase text-primary">Explore</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => exploreApi?.scrollNext()}
            aria-label="Next Explore option"
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Carousel className="w-full" opts={{ align: "center", loop: true }} setApi={setExploreApi}>
          <CarouselContent className="-ml-3">
            {exploreActions.map((action) => {
              const Icon = action.icon;
              return (
                <CarouselItem key={action.to} className="basis-[75%] pl-3 sm:basis-[60%]">
                  <Link
                    to={action.to}
                    className="flex flex-col overflow-hidden rounded-xl border-2 border-primary/40 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/8] w-full shrink-0 overflow-hidden">
                      <img
                        src={action.image}
                        alt={action.title}
                        width={800}
                        height={512}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover object-[center_top]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-2 text-center">
                      <div className="mb-0.5 flex items-center justify-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-3 w-3 text-primary" />
                        </span>
                        <h3 className="whitespace-nowrap text-xs font-bold leading-tight text-foreground">{action.title}</h3>
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{action.description}</p>
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

        <div className="mt-3 flex justify-center gap-2">
          {exploreActions.map((action, index) => (
            <Button
              key={action.to}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => exploreApi?.scrollTo(index)}
              aria-label={`Go to ${action.title}`}
              className={cn(
                "h-2.5 rounded-full p-0 transition-all",
                exploreIndex === index ? "w-2.5 scale-125 bg-primary hover:bg-primary" : "w-2.5 bg-primary/30 hover:bg-primary/50",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {[
          {
            label: "ABOUT",
            title: "About Smarty Gym",
            description: "The mission behind Smarty Gym",
            to: "/about" as const,
            image: aboutImage,
            icon: Info,
            thumbClass: "h-[58px] w-[58px]",
            objectPosition: "center center",
          },
          {
            label: "COMMUNITY",
            title: "Smarty Community",
            description: "Share workouts, join rankings, and connect",
            to: "/community" as const,
            image: communityImage,
            icon: Users,
            thumbClass: "h-[58px] w-[58px]",
            objectPosition: "center center",
          },
          {
            label: "COACH",
            title: "A Note from the Founder",
            description: "Haris Falas — Sports Scientist & Founder",
            to: "/founder-note" as const,
            image: founderPhoto,
            icon: NotebookPen,
            thumbClass: "h-[52px] w-[58px]",
            objectPosition: "center top",
          },
        ].map((card) => {
          return (
            <Link
              key={card.to}
              to={card.to}
              className="flex h-[68px] items-center gap-3 overflow-hidden rounded-xl border-2 border-primary/60 bg-card p-1.5 transition-all duration-300 hover:border-primary hover:shadow-xl"
            >
              <div className={cn("relative shrink-0 overflow-hidden rounded-lg bg-primary/10", card.thumbClass)}>
                <img
                  src={card.image}
                  alt={card.title}
                  width={144}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: card.objectPosition }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="text-[9px] font-bold uppercase tracking-wide text-primary">{card.label}</span>
                <h3 className="text-[13px] font-extrabold leading-tight text-foreground">{card.title}</h3>
                <p className="line-clamp-1 text-[10px] leading-snug text-muted-foreground">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
