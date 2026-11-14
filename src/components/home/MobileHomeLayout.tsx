import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, Newspaper, Play, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { MobilePhotoCard } from "./MobilePhotoCard";
import type { SmartyWorkoutCard } from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { difficultyLabel } from "@/lib/workout/spec";
import { fallbackTo } from "@/lib/cover-image";
import wodImage from "@/assets/hero-wod-card.jpg";
import workoutImage from "@/assets/smarty-workouts-card.jpg";
import createImage from "@/assets/create-workout-card.jpg";
import sharedImage from "@/assets/shared-workouts-card.jpg";
import harisImage from "@/assets/haris-falas-coach.jpg";

export function MobileHomeLayout({ workoutCount, featured }: { workoutCount: number; featured: SmartyWorkoutCard[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);
  const actions = [
    { title: "Workout of the Day", eyebrow: "Today's featured", description: "Follow today's complete training session", image: wodImage, to: "/wod" as const },
    { title: "Smarty Workouts", eyebrow: "Expert collection", description: `${workoutCount.toLocaleString()} expert-designed workouts`, image: workoutImage, to: "/smarty-workouts" as const },
    { title: "Create Your Own Workout", eyebrow: "Your training, your way", description: "Choose your exercises or build with Smarty Coach", image: createImage, to: "/create-your-own-workout" as const },
    { title: "Shared Workouts", eyebrow: "From the community", description: "Train with workouts shared by members", image: sharedImage, to: "/shared-workouts" as const },
  ];
  const quick = [
    { title: "Smarty Ritual", to: "/smarty-ritual" as const, Icon: Sparkles },
    { title: "Smarty Tools", to: "/tools" as const, Icon: Wrench },
    { title: "Exercise Library", to: "/exercise-library" as const, Icon: BookOpen },
    { title: "Blog & Insights", to: "/blog" as const, Icon: Newspaper },
  ];
  useEffect(() => {
    if (!api) return;
    const sync = () => setActive(api.selectedScrollSnap());
    sync(); api.on("select", sync); api.on("reInit", sync);
    return () => { api.off("select", sync); api.off("reInit", sync); };
  }, [api]);
  return <div className="md:hidden">
    <div className="mb-6 mt-5 flex justify-center">
      <Button asChild size="lg" className="h-12 rounded-full bg-brand-blue px-8 text-base font-bold text-hero-foreground hover:bg-brand-blue/90">
        <Link to="/wod"><Play className="h-4 w-4 fill-current" />Start Training</Link>
      </Button>
    </div>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold">Explore</h2>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="icon" aria-label="Previous" onClick={() => api?.scrollPrev()} className="h-8 w-8 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
        <Button type="button" variant="outline" size="icon" aria-label="Next" onClick={() => api?.scrollNext()} className="h-8 w-8 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
    <Carousel setApi={setApi} opts={{ align: "start", loop: true }} aria-label="Start training">
      <CarouselContent className="-ml-2">
        {actions.map(action => <CarouselItem key={action.to} className="basis-[88%] pl-2">
          <Link to={action.to} className="block"><MobilePhotoCard {...action} /></Link>
        </CarouselItem>)}
      </CarouselContent>
    </Carousel>
    <div className="mobile-carousel-dots my-3 flex justify-center gap-1">
      {actions.map((action, i) => <Button key={action.to} size="icon" variant="ghost" aria-label={`Go to ${action.title}`} aria-current={i === active ? "true" : undefined} onClick={() => api?.scrollTo(i)} className="h-8 w-8 rounded-full p-0">
        <span className={i === active ? "h-2 w-2 rounded-full bg-brand-blue" : "h-2 w-2 rounded-full bg-muted-foreground/30"} />
      </Button>)}
    </div>
    <nav aria-label="Explore" className="grid grid-cols-4 gap-2">
      {quick.map(({ title, to, Icon }) => <Link key={to} to={to} className="app-card flex min-h-24 flex-col items-center justify-center gap-2 p-2 text-center">
        <span className="brand-ink grid h-8 w-8 place-items-center"><Icon className="h-5 w-5" /></span>
        <span className="flex min-h-8 items-center text-[11px] font-bold leading-4">{title}</span>
      </Link>)}
    </nav>
    <Button variant="ghost" onClick={() => window.dispatchEvent(new Event("smarty:open-coach"))} className="app-card mt-5 flex h-auto min-h-28 w-full justify-start gap-3 overflow-hidden p-0 text-left whitespace-normal" aria-label="Talk to Coach Haris">
      <img src={harisImage} alt="Haris Falas" width={112} height={128} className="h-32 w-24 shrink-0 object-cover object-top" />
      <span className="flex min-w-0 flex-1 flex-col gap-1 py-3">
        <span className="text-[10px] font-bold uppercase">Smarty <span className="brand-ink">Coach</span></span>
        <span className="text-base font-extrabold leading-5">Talk to Coach Haris.</span>
        <span className="text-xs font-normal leading-5 text-muted-foreground">Your daily briefing and personal recommendation.</span>
      </span>
      <ChevronRight className="mr-3 h-5 w-5 shrink-0" />
    </Button>
    {featured.length > 0 && <section aria-label="Featured Workouts" className="mt-7">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Featured Workouts</h2>
        <Link to="/smarty-workouts" className="brand-ink flex items-center text-xs font-semibold">View All<ChevronRight className="h-4 w-4" /></Link>
      </div>
      <div className="space-y-2.5">{featured.slice(0, 3).map(workout => <Link key={workout.id} to="/smarty-workouts/$workoutId" params={{ workoutId: workout.id }} className="app-card flex min-h-20 items-center gap-3 p-2">
        <img src={workout.image_url ?? workoutImage} onError={fallbackTo(workoutImage)} alt={workout.name} width={80} height={64} loading="lazy" className="h-16 w-20 shrink-0 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <p className="brand-ink text-[9px] font-bold uppercase">{categoryLabel(workout.category)}</p>
          <h3 className="line-clamp-2 text-[13px] font-bold leading-4">{workout.name}</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">{workout.duration_min} min · {difficultyLabel(workout.difficulty_stars)}</p>
        </div><ChevronRight className="h-5 w-5 shrink-0" />
      </Link>)}</div>
    </section>}
  </div>;
}