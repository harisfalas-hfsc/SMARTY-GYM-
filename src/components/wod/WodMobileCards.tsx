import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Crown, Dumbbell, Home, Layers, Shuffle, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
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
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function isNew(createdAt: string | null | undefined) {
  if (!createdAt) return false;
  return (Date.now() - new Date(createdAt).getTime()) / 86_400_000 <= 2;
}

/** Old Smarty Gym WOD card (WODCategory.tsx renderWODCard), used on phones. */
function OldWodCard({ card, fallback }: { card: WodCard; fallback: string }) {
  const navigate = useNavigate();
  const { freeAccessMode } = useFreeAccessMode();
  const w = card.workout;
  const recovery = card.slot === "RECOVERY" || w.category === "RECOVERY";
  const equipment = recovery
    ? { Icon: Shuffle, label: "Mixed/Minimal", cls: "bg-wod-recovery" }
    : card.slot === "BODYWEIGHT"
      ? { Icon: Home, label: "No Equipment", cls: "bg-wod-bodyweight" }
      : { Icon: Dumbbell, label: "With Equipment", cls: "bg-wod-equipment" };
  const level = difficultyLabel(w.difficulty_stars);
  const tone = recovery ? "text-level-intermediate" : (LEVEL_TONE[level] ?? "text-level-beginner");
  const desc = stripHtml(w.description_html);
  const open = () => void navigate({ to: "/smarty-workouts/$workoutId", params: { workoutId: w.id } });

  return (
    <Card
      className="group h-full w-full cursor-pointer overflow-hidden border-2 border-wod-border/60 transition-all duration-300 hover:border-wod-border hover:shadow-xl"
      onClick={open}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={coverVariant(w.image_url, 640) ?? fallback}
          onError={fallbackTo(w.image_url ?? fallback)}
          alt={`${w.name} - online workout by Haris Falas at SmartyGym`}
          loading="eager"
          decoding="async"
          width={640}
          height={360}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className={`absolute left-3 top-3 border-0 text-wod-badge-foreground ${equipment.cls}`}>
          <equipment.Icon className="h-4 w-4" />
          <span className="ml-1">{equipment.label}</span>
        </Badge>
        {isNew(w.created_at) && (
          <Badge className="absolute right-3 top-3 border-0 text-wod-badge-foreground [background:var(--gradient-new)]">NEW</Badge>
        )}
        {!freeAccessMode && (
          <div className="absolute bottom-3 right-3">
            <Badge className="border-0 text-wod-badge-foreground shadow-lg [background:var(--gradient-premium)]">
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="mb-1.5 line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {w.name}
        </h3>
        {desc && <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{desc.substring(0, 120)}...</p>}

        <div className="mb-2 space-y-1.5 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
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
          {!freeAccessMode && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="border-0 py-0.5 text-xs text-wod-badge-foreground [background:var(--gradient-premium)]">
                <Crown className="mr-1 h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>

        <Button className="w-full" size="sm">View Workout</Button>
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
        <OldWodCard card={cards[0]!} fallback={fallback} />
      </div>
    );
  }

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "center", loop: true, startIndex: 0 }} className="w-full">
        <CarouselContent className="-ml-2">
          {cards.map((c) => (
            <CarouselItem key={c.slot} className="basis-[85%] pl-2">
              <OldWodCard card={c} fallback={fallback} />
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
