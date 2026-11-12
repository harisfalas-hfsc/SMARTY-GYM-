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
import { cn } from "@/lib/utils";

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
  compact = false,
}: {
  workout: WorkoutCardData;
  kind: WorkoutCardKind;
  fallback: string;
  eager?: boolean;
  done?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteBusy?: boolean;
  /** Tighter type and spacing on phones only (2-column grids). Tablet/desktop unchanged. */
  compact?: boolean;
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
        <Badge
          className={cn(
            "absolute border-0 text-wod-badge-foreground",
            compact
              ? "left-1.5 top-1.5 px-1.5 py-0 text-[9px] sm:left-3 sm:top-3 sm:px-2.5 sm:py-0.5 sm:text-xs"
              : "left-3 top-3",
            equipment.cls,
          )}
        >
          <equipment.Icon className={compact ? "h-2.5 w-2.5 sm:h-4 sm:w-4" : "h-4 w-4"} />
          <span className={cn("font-medium", compact ? "ml-0.5 sm:ml-1" : "ml-1")}>{equipment.label}</span>
        </Badge>
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={favorite ? "Remove from favourites" : "Mark as favourite"}
            aria-pressed={Boolean(favorite)}
            disabled={favoriteBusy}
            onClick={fav}
            className={cn(
              "absolute grid place-items-center rounded-full border border-workout-overlay-border bg-workout-overlay text-workout-overlay-foreground shadow-sm backdrop-blur-sm",
              compact
                ? "right-1.5 top-1.5 h-6 w-6 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                : "right-3 top-3 h-8 w-8",
            )}
          >
            <Heart className={cn(compact ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4", favorite ? "fill-destructive text-destructive" : "")} />
          </button>
        )}
        {done && (
          <div className={cn("absolute", compact ? "bottom-1.5 right-1.5 sm:bottom-3 sm:right-3" : "bottom-3 right-3")}>
            <Badge className={cn("border-0 bg-wod-border text-wod-badge-foreground", compact && "px-1.5 py-0 text-[9px] sm:px-2.5 sm:py-0.5 sm:text-xs")}>
              <Check className={cn("mr-1", compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3")} />
              Done
            </Badge>
          </div>
        )}
      </div>

      <CardContent className={cn("flex flex-1 flex-col", compact ? "p-2 sm:p-4" : "p-3 sm:p-4")}>
        <h3
          className={cn(
            "line-clamp-2 font-bold leading-tight text-foreground transition-colors group-hover:text-primary",
            compact
              ? "mb-1 min-h-[2.5rem] text-[13px] sm:mb-1.5 sm:min-h-[3.5rem] sm:text-lg sm:text-xl"
              : "mb-1.5 min-h-[3.5rem] text-lg sm:text-xl",
          )}
        >
          {w.name}
        </h3>
        {desc && (
          <p
            className={cn(
              "line-clamp-2 text-muted-foreground",
              compact
                ? "mb-1 min-h-[2rem] text-[10px] leading-snug sm:mb-2 sm:min-h-[2.5rem] sm:text-sm"
                : "mb-2 min-h-[2.5rem] text-sm",
            )}
          >
            {desc.substring(0, 120)}...
          </p>
        )}

        <div
          className={cn(
            "flex flex-wrap items-center",
            compact
              ? "mb-1 gap-x-1 gap-y-0.5 text-[9px] sm:mb-2 sm:gap-x-2 sm:gap-y-1 sm:text-xs"
              : "mb-2 gap-x-2 gap-y-1 text-xs",
          )}
        >
          <div className="flex items-center gap-1">
            <Layers className={compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3"} />
            <span className="font-medium text-muted-foreground">{categoryLabel(w.category).toUpperCase()}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Target className={cn(compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3", "text-primary")} />
            <span className="font-medium text-wod-format">{w.format || "General"}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <TrendingUp className={cn(compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3", tone)} />
            <span className={cn("font-medium capitalize", tone)}>{recovery ? "All Levels" : level}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Clock className={cn(compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3", "text-wod-duration")} />
            <span className="font-medium text-wod-duration">{w.duration_min} min</span>
          </div>
        </div>

        <Button
          className={cn(
            "mt-auto w-full",
            compact && "h-7 px-1 text-[10px] sm:h-8 sm:px-3 sm:text-xs",
          )}
          size="sm"
        >
          View Workout
        </Button>
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
