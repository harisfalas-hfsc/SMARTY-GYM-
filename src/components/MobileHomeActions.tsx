import { useRef, useState, type UIEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, ChevronLeft, ChevronRight, Crown, Dumbbell, type LucideIcon } from "lucide-react";
import coachImage from "@/assets/coach-stopwatch-card.jpg";
import premiumImage from "@/assets/premium-membership-card.jpg";
import wodImage from "@/assets/hero-wod-card.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileAction = {
  title: string;
  description: string;
  to: "/coach" | "/wod" | "/pricing";
  image: string;
  icon: LucideIcon;
};

export function MobileHomeActions({ showPricing }: { showPricing: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const actions: MobileAction[] = [
    {
      title: "Ask your coach",
      description: "Get a personalized workout built for you",
      to: "/coach",
      image: coachImage,
      icon: Dumbbell,
    },
    {
      title: "Workout of the Day",
      description: "Follow today's complete training session",
      to: "/wod",
      image: wodImage,
      icon: CalendarCheck,
    },
    ...(showPricing
      ? [{
          title: "Premium membership",
          description: "See membership options and full access",
          to: "/pricing" as const,
          image: premiumImage,
          icon: Crown,
        }]
      : []),
  ];

  function goTo(index: number) {
    const next = (index + actions.length) % actions.length;
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth * 0.75, behavior: "smooth" });
    setActiveIndex(next);
  }

  function updateActive(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length === 0) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(center - cardCenter);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  }

  return (
    <div className="mt-5 sm:hidden">
      <div className="mb-4 flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => goTo(activeIndex - 1)}
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
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next option"
          className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div
        ref={trackRef}
        onScroll={updateActive}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[12.5%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="flex basis-[75%] shrink-0 snap-center flex-col overflow-hidden rounded-xl border-2 border-green-500/60 bg-card transition-colors active:border-green-500"
            >
              <div className="relative aspect-[16/8] w-full shrink-0 overflow-hidden">
                <img
                  src={action.image}
                  alt=""
                  width={1280}
                  height={640}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center"
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
                  Explore <ChevronRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={action.to}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => goTo(index)}
            aria-label={`Go to ${action.title}`}
            className={cn(
              "h-2.5 rounded-full p-0 transition-all",
              activeIndex === index ? "w-2.5 scale-125 bg-primary hover:bg-primary" : "w-2.5 bg-primary/30 hover:bg-primary/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
