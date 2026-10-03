import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Clock, Dumbbell, Heart, Home, Layers, Shuffle, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import type { WodCard } from "@/lib/wod.functions";
import { difficultyLabel } from "@/lib/workout/spec";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { coverVariant, fallbackTo } from "@/lib/cover-image";

const LEVEL_TONE: Record<string, string> = {
  Beginner: "text-level-beginner",
  Intermediate: "text-level-intermediate",
  Advanced: "text-level-advanced",
};

function stripHtml(html: string | null | undefined) {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}


export type WorkoutCardData = {
  id: string;
  name: string;
  category: string;
  format: string | null;
  difficulty_stars: number;
  duration_min: number;
  image_url: string | null;
  equipment?: string[];
  description_html?: string | null;
  created_at?: string | null;
};

export type WorkoutCardKind = "BODYWEIGHT" | "EQUIPMENT" | "RECOVERY";

export function kindForWorkout(w: WorkoutCardData): WorkoutCardKind {
  if (w.category === "RECOVERY") return "RECOVERY";
  const eq = w.equipment ?? [];
  return eq.length === 0 || eq.every((i) => i.toLowerCase() === "bodyweight") ? "BODYWEIGHT" : "EQUIPMENT";
}

/**
 * The one SmartyGym workout card (old SmartyGym WOD card design).
 * Used by Workout of the Day and every Smarty Workouts category page.
 */
export function WorkoutCard({
  workout: w,
  kind,
  fallback,
  eager = true,
  done,
  favorite,
  onToggleFavorite,
  favoriteBusy,
}: {
  workout: WorkoutCardData;
  kind: WorkoutCardKind;
  fallback: string;
  eager?: boolean;
  done?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteBusy?: boolean;
}) {
  const navigate = useNavigate();
  const recovery = kind === "RECOVERY";
  const equipment = recovery
    ? { Icon: Shuffle, label: "Mixed/Minimal", cls: "bg-wod-recovery" }
    : kind === "BODYWEIGHT"
      ? { Icon: Home, label: "No Equipment", cls: "bg-wod-bodyweight" }
      : { Icon: Dumbbell, label: "With Equipment", cls: "bg-wod-equipment" };
  const level = difficultyLabel(w.difficulty_stars);
  const tone = recovery ? "text-level-intermediate" : (LEVEL_TONE[level] ?? "text-level-beginner");
  const desc = stripHtml(w.description_html);
  const open = () => void navigate({ to: "/smarty-workouts/$workoutId", params: { workoutId: w.id } });
  const fav = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <Card
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden border-2 border-wod-border/60 transition-all duration-300 hover:border-wod-border hover:shadow-xl"
      onClick={open}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={coverVariant(w.image_url, 640) ?? fallback}
          onError={fallbackTo(w.image_url ?? fallback)}
          alt={`${w.name} - online workout by Haris Falas at SmartyGym`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={640}
          height={360}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className={`absolute left-3 top-3 border-0 text-wod-badge-foreground ${equipment.cls}`}>
          <equipment.Icon className="h-4 w-4" />
          <span className="ml-1">{equipment.label}</span>
        </Badge>
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={favorite ? "Remove from favourites" : "Mark as favourite"}
            aria-pressed={Boolean(favorite)}
            disabled={favoriteBusy}
            onClick={fav}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-workout-overlay-border bg-workout-overlay text-workout-overlay-foreground shadow-sm backdrop-blur-sm"
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-destructive text-destructive" : ""}`} />
          </button>
        )}
        {done && (
          <div className="absolute bottom-3 right-3">
            <Badge className="border-0 bg-wod-border text-wod-badge-foreground">
              <Check className="mr-1 h-3 w-3" />
              Done
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="mb-1.5 line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {w.name}
        </h3>
        {desc && <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{desc.substring(0, 120)}...</p>}

        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            <span className="font-medium text-muted-foreground">{categoryLabel(w.category).toUpperCase()}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-primary" />
            <span className="font-medium text-wod-format">{w.format || "General"}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <TrendingUp className={`h-3 w-3 ${tone}`} />
            <span className={`font-medium capitalize ${tone}`}>{recovery ? "All Levels" : level}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-wod-duration" />
            <span className="font-medium text-wod-duration">{w.duration_min} min</span>
          </div>
        </div>

        <Button className="mt-auto w-full" size="sm">View Workout</Button>
      </CardContent>
    </Card>
  );
}

export function WodMobileCards({ cards, fallback }: { cards: WodCard[]; fallback: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (cards.length === 1) {
    return (
      <div className="w-full">
        <WorkoutCard workout={cards[0]!.workout} kind={cards[0]!.slot} fallback={fallback} />
      </div>
    );
  }

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "center", loop: true, startIndex: 0 }} className="w-full">
        <CarouselContent className="-ml-2">
          {cards.map((c) => (
            <CarouselItem key={c.slot} className="basis-[85%] pl-2">
              <WorkoutCard workout={c.workout} kind={c.slot} fallback={fallback} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 h-8 w-8 border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" />
        <CarouselNext className="right-2 h-8 w-8 border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" />
      </Carousel>
      <div className="mt-4 flex justify-center gap-2">
        {cards.map((c, index) => (
          <button
            key={c.slot}
            type="button"
            aria-label={`Show workout ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 w-2 rounded-full transition-colors ${current === index ? "bg-primary" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
