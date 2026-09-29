import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Dumbbell,
  Flame,
  Flower2,
  HeartPulse,
  Loader2,
  Move3d,
  Search,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import {
  SMARTY_WORKOUT_CATEGORIES,
  listSmartyWorkouts,
  type SmartyWorkoutCard,
} from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { difficultyLabel } from "@/lib/workout/spec";
import pageHeroImage from "@/assets/smarty-workouts-card.jpg";
import strengthImage from "@/assets/smarty-workout-categories/strength.jpg";
import muscleImage from "@/assets/smarty-workout-categories/muscle-building.jpg";
import calorieImage from "@/assets/smarty-workout-categories/calorie-burning.jpg";
import cardioImage from "@/assets/smarty-workout-categories/cardio.jpg";
import metabolicImage from "@/assets/smarty-workout-categories/metabolic.jpg";
import challengeImage from "@/assets/smarty-workout-categories/challenge.jpg";
import mobilityImage from "@/assets/smarty-workout-categories/mobility-stability.jpg";
import pilatesImage from "@/assets/smarty-workout-categories/pilates.jpg";

export const Route = createFileRoute("/smarty-workouts/")({
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

type Category = (typeof SMARTY_WORKOUT_CATEGORIES)[number];

const CATEGORY_DETAILS: Record<Category, { image: string; description: string; Icon: LucideIcon }> = {
  STRENGTH: {
    image: strengthImage,
    description: "Build foundational strength, power and muscular endurance with focused resistance training.",
    Icon: Dumbbell,
  },
  "MUSCLE BUILDING": {
    image: muscleImage,
    description: "Develop muscle with purposeful exercises, effective volume and progressive training sessions.",
    Icon: Activity,
  },
  "CALORIE BURNING": {
    image: calorieImage,
    description: "High-energy sessions designed to maximize calorie burn with efficient full-body movement.",
    Icon: Flame,
  },
  CARDIO: {
    image: cardioImage,
    description: "Build cardiovascular endurance, a stronger heart and better everyday stamina.",
    Icon: HeartPulse,
  },
  METABOLIC: {
    image: metabolicImage,
    description: "Dynamic conditioning workouts that challenge your whole body and elevate your work capacity.",
    Icon: Zap,
  },
  CHALLENGE: {
    image: challengeImage,
    description: "Benchmark-style workouts that test your fitness and push you beyond your comfort zone.",
    Icon: Sparkles,
  },
  "MOBILITY & STABILITY": {
    image: mobilityImage,
    description: "Improve joint health, control and movement quality through targeted mobility and stability work.",
    Icon: Move3d,
  },
  PILATES: {
    image: pilatesImage,
    description: "Build core strength, alignment and body awareness through controlled, precise movement.",
    Icon: Flower2,
  },
};

const ALL = "all";

function SmartyWorkoutsPage() {
  const [rows, setRows] = useState<SmartyWorkoutCard[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mobileCategory, setMobileCategory] = useState<Category>(SMARTY_WORKOUT_CATEGORIES[0]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState(ALL);
  const [duration, setDuration] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [format, setFormat] = useState(ALL);

  useEffect(() => {
    void listSmartyWorkouts()
      .then((r) => setRows(r.workouts))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () => setMobileCategory(SMARTY_WORKOUT_CATEGORIES[carouselApi.selectedScrollSnap()] ?? SMARTY_WORKOUT_CATEGORIES[0]);
    update();
    carouselApi.on("select", update);
    carouselApi.on("reInit", update);
    return () => {
      carouselApi.off("select", update);
      carouselApi.off("reInit", update);
    };
  }, [carouselApi]);

  const selectedRows = useMemo(() => {
    if (!rows || !selectedCategory) return [];
    const query = search.trim().toLowerCase();
    return rows.filter((workout) => {
      if (workout.category !== selectedCategory) return false;
      if (query && !`${workout.name} ${workout.format ?? ""} ${workout.equipment.join(" ")}`.toLowerCase().includes(query)) return false;
      const isBodyweight = workout.equipment.length === 0 || workout.equipment.every((item) => item.toLowerCase() === "bodyweight");
      if (equipment === "bodyweight" && !isBodyweight) return false;
      if (equipment === "equipment" && isBodyweight) return false;
      if (duration !== ALL) {
        const [min, max] = duration.split("-").map(Number);
        if (workout.duration_min < min || workout.duration_min > max) return false;
      }
      if (difficulty !== ALL && String(workout.difficulty_stars) !== difficulty) return false;
      if (format !== ALL && (workout.format ?? "").toLowerCase() !== format) return false;
      return true;
    });
  }, [difficulty, duration, equipment, format, rows, search, selectedCategory]);

  const formats = useMemo(() => {
    if (!rows || !selectedCategory) return [];
    return [...new Set(rows.filter((row) => row.category === selectedCategory).map((row) => row.format).filter((value): value is string => Boolean(value)))];
  }, [rows, selectedCategory]);

  const chooseCategory = (category: Category) => {
    setSelectedCategory(category);
    setSearch("");
    setEquipment(ALL);
    setDuration(ALL);
    setDifficulty(ALL);
    setFormat(ALL);
    window.setTimeout(() => document.getElementById("smarty-workout-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const activeMobile = CATEGORY_DETAILS[mobileCategory];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader
        image={pageHeroImage}
        eyebrow="SMARTYGYM"
        title="Smarty Workouts"
        subtitle="Ready workouts designed by Haris Falas. Pick a category and start training."
      />

      {rows === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="lg:hidden">
            <div className="mb-4 min-h-[84px] border-y border-border py-4 text-center">
              <h2 className="text-lg font-extrabold text-primary">{categoryLabel(mobileCategory)}</h2>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{activeMobile.description}</p>
            </div>

            <Carousel className="w-full" opts={{ align: "center", loop: true }} setApi={setCarouselApi}>
              <CarouselContent className="-ml-3">
                {SMARTY_WORKOUT_CATEGORIES.map((category) => {
                  const detail = CATEGORY_DETAILS[category];
                  const Icon = detail.Icon;
                  const count = rows.filter((row) => row.category === category).length;
                  return (
                    <CarouselItem key={category} className="basis-[75%] pl-3 sm:basis-[60%]">
                      <button
                        type="button"
                        onClick={() => chooseCategory(category)}
                        className="flex h-[300px] w-full flex-col overflow-hidden rounded-xl border-2 border-primary/60 bg-card text-center transition hover:border-primary hover:shadow-xl"
                        aria-label={`Browse ${categoryLabel(category)} workouts`}
                      >
                        <div className="relative h-[58%] shrink-0 overflow-hidden bg-muted">
                          <img src={detail.image} alt="" className="h-full w-full object-cover object-top" />
                          <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-bold text-foreground shadow-sm">{count}</span>
                        </div>
                        <div className="flex flex-1 flex-col items-center justify-center px-3 py-3">
                          <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </span>
                          <h3 className="text-sm font-bold leading-tight text-foreground">{categoryLabel(category)}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">Browse ready workouts</p>
                        </div>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2 h-8 w-8 bg-background/90" />
              <CarouselNext className="right-2 h-8 w-8 bg-background/90" />
            </Carousel>

            <div className="mt-4 flex justify-center gap-2">
              {SMARTY_WORKOUT_CATEGORIES.map((category, index) => (
                <Button
                  key={category}
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Go to ${categoryLabel(category)}`}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={cn("h-2.5 w-2.5 rounded-full p-0", mobileCategory === category ? "scale-125 bg-primary hover:bg-primary" : "bg-primary/30 hover:bg-primary/50")}
                />
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-6 lg:grid xl:grid-cols-4">
            {SMARTY_WORKOUT_CATEGORIES.map((category) => {
              const detail = CATEGORY_DETAILS[category];
              const Icon = detail.Icon;
              const count = rows.filter((row) => row.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => chooseCategory(category)}
                  className="group overflow-hidden rounded-lg border-2 border-border bg-card text-center transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img src={detail.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">{count}</span>
                  </div>
                  <div className="flex min-h-[190px] flex-col items-center px-5 py-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Icon className="h-6 w-6 text-primary" /></span>
                    <h2 className="mt-3 text-lg font-bold text-foreground">{categoryLabel(category)}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCategory && (
            <section id="smarty-workout-results" className="scroll-mt-24 pt-10">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">Smarty Workouts</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-foreground">{categoryLabel(selectedCategory)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{CATEGORY_DETAILS[selectedCategory].description}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} aria-label="Close workout category"><X className="h-5 w-5" /></Button>
              </div>

              <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workouts" className="pl-9" />
                </div>
                <Select value={equipment} onValueChange={setEquipment}>
                  <SelectTrigger aria-label="Equipment"><SelectValue placeholder="Equipment" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All equipment</SelectItem><SelectItem value="bodyweight">No equipment</SelectItem><SelectItem value="equipment">With equipment</SelectItem></SelectContent>
                </Select>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger aria-label="Duration"><SelectValue placeholder="Duration" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All durations</SelectItem><SelectItem value="5-20">Up to 20 min</SelectItem><SelectItem value="21-30">21–30 min</SelectItem><SelectItem value="31-45">31–45 min</SelectItem><SelectItem value="46-180">46+ min</SelectItem></SelectContent>
                </Select>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger aria-label="Difficulty"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All levels</SelectItem><SelectItem value="1">Beginner</SelectItem><SelectItem value="2">Intermediate</SelectItem><SelectItem value="3">Advanced</SelectItem></SelectContent>
                </Select>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger aria-label="Format"><SelectValue placeholder="Format" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All formats</SelectItem>{formats.map((item) => <SelectItem key={item} value={item.toLowerCase()}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Showing {selectedRows.length} workout{selectedRows.length === 1 ? "" : "s"}</span>
                {(search || equipment !== ALL || duration !== ALL || difficulty !== ALL || format !== ALL) && (
                  <Button variant="outline" size="sm" onClick={() => { setSearch(""); setEquipment(ALL); setDuration(ALL); setDifficulty(ALL); setFormat(ALL); }}><X className="mr-1 h-3.5 w-3.5" />Clear filters</Button>
                )}
              </div>

              {selectedRows.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-primary/35 px-5 py-10 text-center">
                  <p className="font-semibold text-foreground">{rows.some((row) => row.category === selectedCategory) ? "No workouts match these filters." : "Ready workouts are coming soon."}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rows.some((row) => row.category === selectedCategory) ? "Try a different duration, level or equipment option." : "New sessions will appear here when they are published."}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {selectedRows.map((workout) => {
                    const noEquipment = workout.equipment.length === 0 || workout.equipment.every((item) => item.toLowerCase() === "bodyweight");
                    return (
                      <Link key={workout.id} to="/smarty-workouts/$workoutId" params={{ workoutId: workout.id }} className="group overflow-hidden rounded-lg border-2 border-border bg-card transition hover:border-primary hover:shadow-lg">
                        <div className="relative aspect-[3/2] bg-muted">
                          <img src={workout.image_url ?? CATEGORY_DETAILS[selectedCategory].image} alt={workout.name} loading="lazy" className="h-full w-full object-cover" />
                          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm">{noEquipment ? "No equipment" : "With equipment"}</span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold leading-snug text-foreground">{workout.name}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{workout.duration_min} min</span>
                            <span>{difficultyLabel(workout.difficulty_stars)}</span>
                            {workout.format && <span>{workout.format}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}