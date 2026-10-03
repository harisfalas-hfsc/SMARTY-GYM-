import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/smarty-workout-row";

export type CalendarDay = { date: string; category: string; difficulty: string | null };

const BORDER: Record<string, string> = {
  Beginner: "border-level-beginner",
  Intermediate: "border-level-intermediate",
  Advanced: "border-level-advanced",
};
const BADGE: Record<string, string> = {
  Beginner: "bg-level-beginner/20 text-level-beginner border-level-beginner/30",
  Intermediate: "bg-level-intermediate/20 text-level-intermediate border-level-intermediate/30",
  Advanced: "bg-level-advanced/20 text-level-advanced border-level-advanced/30",
};

function fullDate(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

/** Old SmartyGym WODPeriodizationCalendar: Yesterday / Today / Tomorrow. */
export function WodPeriodizationCalendar({ yesterday, today, tomorrow }: { yesterday: CalendarDay; today: CalendarDay; tomorrow: CalendarDay }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(1, false);
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const days = [
    { label: "Yesterday", info: yesterday, isToday: false },
    { label: "Today", info: today, isToday: true },
    { label: "Tomorrow", info: tomorrow, isToday: false },
  ];

  const cell = (label: string, info: CalendarDay, isToday: boolean) => {
    const recovery = info.category === "RECOVERY" || !info.difficulty;
    const border = recovery ? "border-level-recovery" : (BORDER[info.difficulty!] ?? "border-border");
    return (
      <div className={`flex flex-col items-center rounded-md p-2 transition-all ${border} ${isToday ? "border-2 bg-primary/10" : "border bg-muted/30"}`}>
        <div className="flex items-center gap-0.5">
          {label === "Yesterday" && <ChevronLeft className="h-2.5 w-2.5 text-muted-foreground" />}
          <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
          {label === "Tomorrow" && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
        </div>
        <div className={`text-[9px] font-semibold sm:text-xs ${isToday ? "text-primary" : "text-foreground"}`}>{fullDate(info.date)}</div>
        <div className={`mt-1 text-center text-[10px] font-bold ${isToday ? "text-foreground" : "text-muted-foreground"}`}>{categoryLabel(info.category).toUpperCase()}</div>
        {recovery ? (
          <Badge variant="outline" className="mt-1 border-level-recovery/30 bg-level-recovery/10 px-1.5 py-0 text-[9px] text-level-recovery">All Levels</Badge>
        ) : (
          <Badge variant="outline" className={`mt-1 px-1.5 py-0 text-[9px] ${BADGE[info.difficulty!] ?? ""}`}>{info.difficulty}</Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-4 border-border/50 bg-gradient-to-r from-muted/20 via-background to-muted/20">
      <CardContent className="p-2 sm:p-3">
        <div className="hidden grid-cols-3 gap-1.5 sm:gap-2 md:grid">
          {days.map((d) => <div key={d.label}>{cell(d.label, d.info, d.isToday)}</div>)}
        </div>

        <div className="-mx-2 sm:-mx-3 md:hidden">
          <Carousel className="w-full" opts={{ align: "center", loop: false, startIndex: 1 }} setApi={setApi}>
            <CarouselContent className="-ml-2">
              {days.map((d) => (
                <CarouselItem key={d.label} className="basis-[75%] pl-2">{cell(d.label, d.info, d.isToday)}</CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1 h-8 w-8 rounded-full border border-border/50 bg-background/80 shadow-sm" />
            <CarouselNext className="right-1 h-8 w-8 rounded-full border border-border/50 bg-background/80 shadow-sm" />
          </Carousel>
          <div className="mt-3 flex justify-center gap-2">
            {days.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to ${d.label}`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border-2 bg-transparent transition-all duration-300",
                  current === i ? "scale-125 border-primary" : "border-primary/40 hover:border-primary/60",
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 hidden flex-wrap items-center justify-center gap-1.5 text-[9px] md:flex">
          {[["bg-level-beginner", "Beginner"], ["bg-level-intermediate", "Intermediate"], ["bg-level-advanced", "Advanced"], ["bg-level-recovery", "Recovery"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${c}`} />
              <span className="text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
