import { iconTone } from "@/lib/icon-tone";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import {
  Brain,
  SlidersHorizontal,
  FlaskConical,
  RefreshCw,
  ClipboardCheck,
  NotebookPen,
  TrendingUp,
  Activity,
  Trophy,
  BookOpen,
  Clock,
  Dumbbell,
} from "lucide-react";
import heroCity from "@/assets/about-desktop/hero-city-running.jpg";
import heroBarbell from "@/assets/about-desktop/hero-barbell-lift.jpg";
import heroRopes from "@/assets/about-desktop/hero-battle-ropes.jpg";
import heroTimer from "@/assets/about-desktop/hero-timer-tablet.jpg";
import imgWorkouts from "@/assets/about-desktop/hero-workouts-bright.jpg";
import imgTools from "@/assets/about-desktop/hero-tools.jpg";
import imgBlog from "@/assets/about-desktop/hero-blog.jpg";
import imgAbout from "@/assets/about-smartygym-card.jpg";
import imgSmartyWorkouts from "@/assets/smarty-workouts-card.jpg";
import imgCreate from "@/assets/create-workout-card.jpg";
import imgWod from "@/assets/hero-wod-card.jpg";
import imgSharedWorkouts from "@/assets/shared-workouts-card.jpg";
import imgCommunity from "@/assets/community-card.jpg";
import imgRitual from "@/assets/explore-ritual.png";
import imgHaris from "@/assets/haris-falas-coach.jpg";
import imgLibrary from "@/assets/explore-exercise-library.jpg";

const heroSlides = [heroCity, heroBarbell, heroRopes, heroTimer];

type Item = {
  id: string;
  title: string;
  meta: string;
  image?: string;
  icon?: LucideIcon;
  to?: string;
};

type Section = {
  id: string;
  image: string;
  tag: string;
  lead: string;
  accentWord: string;
  green: boolean;
  description: string;
  items: Item[];
  cta: { label: string; to: string };
};

const aboutSections: Section[] = [
  {
    id: "what",
    image: imgWorkouts,
    tag: "What",
    lead: "A complete online gym,",
    accentWord: "in your pocket",
    green: true,
    description:
      "SmartyGym is a real gym that lives on your phone — open anywhere, anytime. Every session is structured around proven training principles, not a lucky shuffle of exercises. Early morning, lunch break, late night, abroad or on the road: Smarty Coach builds a session that respects your body, schedule and space.",
    items: [
      { id: "why", title: "Why Invest in SmartyGym", meta: "What makes the platform different", image: imgAbout, to: "/why-invest-in-smartygym" },
      { id: "method", title: "The Smarty Method", meta: "The science behind every session", image: imgLibrary, to: "/the-smarty-method" },
      { id: "haris", title: "Sports Scientist Haris Falas", meta: "The coach behind SmartyGym", image: imgHaris, to: "/haris-falas" },
    ],
    cta: { label: "Why Invest in SmartyGym", to: "/why-invest-in-smartygym" },
  },
  {
    id: "how",
    image: heroTimer,
    tag: "How",
    lead: "Adapts to your",
    accentWord: "mood, energy & gear",
    green: false,
    description:
      "Start from your Training Profile, then tell Smarty Coach how you feel today, how much time you have and what equipment is around. It recalculates sets, reps, rest and exercise selection in seconds — whether you are in a gym, hotel, living room or outdoors.",
    items: [
      { id: "smart", title: "Smart", meta: "Knows you and your history.", icon: Brain },
      { id: "personal", title: "Personalized", meta: "Mood, time, gear, level.", icon: SlidersHorizontal },
      { id: "science", title: "Science-informed", meta: "Safe, proven programming.", icon: FlaskConical },
      { id: "adaptive", title: "Adaptive", meta: "Learns from your feedback.", icon: RefreshCw },
    ],
    cta: { label: "Discover The Smarty Method", to: "/the-smarty-method" },
  },
  {
    id: "train",
    image: heroRopes,
    tag: "Train",
    lead: "Four ways to train. One daily",
    accentWord: "ritual",
    green: true,
    description:
      "Choose a ready Smarty Workout, build one on demand, receive two planned workouts every day, or train what the community shares. Move, reset and recover with a fresh daily ritual.",
    items: [
      { id: "smarty-workouts", title: "Smarty Workouts", meta: "Ready workouts in nine categories", image: imgWorkouts, to: "/smarty-workouts" },
      { id: "wod", title: "Workout of the Day", meta: "Two planned workouts, every day", image: imgWod, to: "/wod" },
      { id: "create", title: "Create Your Own Workout", meta: "On demand, whenever you want", image: imgCreate, to: "/create-your-own-workout" },
      { id: "community", title: "Smarty Community", meta: "Train, like, comment and climb the rankings", image: imgCommunity, to: "/community" },
      { id: "ritual", title: "Smarty Ritual", meta: "Morning, Midday and Evening phases", image: imgRitual, to: "/smarty-ritual" },
    ],
    cta: { label: "Create Your Own Workout", to: "/create-your-own-workout" },
  },
  {
    id: "track",
    image: imgTools,
    tag: "After the workout",
    lead: "Tracked, measured &",
    accentWord: "remembered",
    green: false,
    description:
      "SmartyGym does not stop when the session ends. What you actually did, how it felt and how it compares with last time all feed back into your next workout.",
    items: [
      { id: "debrief", title: "One session debrief", meta: "RPE, feel, enjoyment and notes.", icon: ClipboardCheck },
      { id: "logbook", title: "Logbook & calendar", meta: "Saved, scheduled, favourited or repeated.", icon: NotebookPen },
      { id: "progress", title: "Progress & comparison", meta: "Each attempt compared like-for-like.", icon: TrendingUp },
      { id: "load", title: "Training load", meta: "Against your own 21-day baseline.", icon: Activity },
      { id: "achieve", title: "Achievements & reminders", meta: "Milestones and scheduled-session alerts.", icon: Trophy },
      { id: "library", title: "Exercise library", meta: "1,384 movements with GIFs.", icon: BookOpen, to: "/exercise-library" },
    ],
    cta: { label: "Explore the Exercise Library", to: "/exercise-library" },
  },
];

const homeSections: Section[] = [
  {
    id: "smarty-workouts",
    image: imgSmartyWorkouts,
    tag: "Smarty Workouts",
    lead: "Ready workouts, built to",
    accentWord: "train now",
    green: true,
    description:
      "Choose from Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability, Pilates and Recovery. Every session is designed by Haris Falas and ready when you are.",
    items: [
      { id: "strength", title: "Strength & Muscle Building", meta: "Structured sets and reps", icon: Dumbbell },
      { id: "conditioning", title: "Conditioning & Challenge", meta: "Efficient, purposeful formats", icon: Activity },
      { id: "mobility", title: "Mobility & Pilates", meta: "Controlled movement and recovery", icon: RefreshCw },
    ],
    cta: { label: "Explore Smarty Workouts", to: "/smarty-workouts" },
  },
  {
    id: "workout-of-the-day",
    image: imgWod,
    tag: "Workout of the Day",
    lead: "Two planned workouts,",
    accentWord: "every day",
    green: false,
    description:
      "Our workouts follow a science-based periodization approach designed by Coach Haris Falas, ensuring that within each weekly cycle, you train all fitness parameters. Unlike random workouts you find on YouTube or Instagram, following SmartyGym's structured program means you can rest assured that your training is reliable, professionally organized, and designed to systematically improve all aspects of your fitness.",
    items: [
      { id: "bodyweight", title: "Bodyweight Workout", meta: "Train anywhere", icon: Activity },
      { id: "equipment", title: "Equipment Workout", meta: "Use the gear available to you", icon: Dumbbell },
      { id: "planned", title: "Planned Progression", meta: "Balanced across your training cycle", icon: TrendingUp },
    ],
    cta: { label: "Open Workout of the Day", to: "/wod" },
  },
  {
    id: "create-workout",
    image: imgCreate,
    tag: "Create Your Own Workout",
    lead: "Your goal, time and gear,",
    accentWord: "one complete session",
    green: true,
    description:
      "Tell Smarty Coach what you want to train, how you feel, how much time you have and what equipment is available. Your workout is built around your Training Profile and your circumstances today.",
    items: [
      { id: "personal", title: "Personalized", meta: "Built around your profile", icon: SlidersHorizontal },
      { id: "science", title: "Science-informed", meta: "Coherent, coach-like programming", icon: FlaskConical },
      { id: "adaptive", title: "Adaptive", meta: "Matches today's energy and equipment", icon: Brain },
    ],
    cta: { label: "Create Your Own Workout", to: "/create-your-own-workout" },
  },
  {
    id: "shared-workouts",
    image: imgSharedWorkouts,
    tag: "Shared Workouts",
    lead: "Member-created sessions,",
    accentWord: "ready to explore",
    green: false,
    description:
      "Browse workouts shared by SmartyGym members. Open a session, see how it is structured and, when signed in, train it, like it and join the conversation.",
    items: [
      { id: "browse", title: "Browse Workouts", meta: "Discover sessions shared by members", icon: BookOpen },
      { id: "train", title: "Train a Shared Session", meta: "Open and follow the complete workout", icon: Dumbbell },
      { id: "connect", title: "Join the Community", meta: "Like and comment when signed in", icon: Activity },
    ],
    cta: { label: "Explore Shared Workouts", to: "/shared-workouts" },
  },
  {
    id: "smarty-ritual",
    image: imgRitual,
    tag: "Smarty Ritual",
    lead: "Move, reset and recover,",
    accentWord: "every day",
    green: true,
    description:
      "Open one fresh daily ritual with three practical phases: Morning activation, a Midday reset and an Evening unwind, supporting mobility, energy and recovery around your training.",
    items: [
      { id: "morning", title: "Morning", meta: "Start the day with activation", icon: Activity },
      { id: "midday", title: "Midday", meta: "Reset your body and focus", icon: RefreshCw },
      { id: "evening", title: "Evening", meta: "Unwind and support recovery", icon: Clock },
    ],
    cta: { label: "Open Smarty Ritual", to: "/smarty-ritual" },
  },
  {
    id: "smarty-tools",
    image: imgTools,
    tag: "Smarty Tools",
    lead: "Practical training tools,",
    accentWord: "always ready",
    green: false,
    description:
      "Use focused tools for the moments around your workout: calculate training loads, track rounds and keep your session timing clear without leaving SmartyGym.",
    items: [
      { id: "calculator", title: "1RM Calculator", meta: "Estimate and plan your working loads", icon: TrendingUp, to: "/tools/1rm-calculator" },
      { id: "timer", title: "Workout Timer", meta: "Time intervals and training blocks", icon: Clock, to: "/tools/workout-timer" },
      { id: "rounds", title: "Rounds Tracker", meta: "Keep every round accounted for", icon: ClipboardCheck, to: "/tools/rounds-tracker" },
    ],
    cta: { label: "Explore Smarty Tools", to: "/tools" },
  },
  {
    id: "smarty-blog",
    image: imgBlog,
    tag: "Smarty Blog",
    lead: "Training knowledge,",
    accentWord: "made useful",
    green: true,
    description:
      "Read practical insights on training, recovery, performance and the thinking behind better programming, written to help you understand not only what to do, but why it works.",
    items: [
      { id: "training", title: "Training Insights", meta: "Strength, conditioning and progression", icon: Dumbbell },
      { id: "recovery", title: "Recovery & Readiness", meta: "Train with better timing and awareness", icon: RefreshCw },
      { id: "method", title: "The Smarty Method", meta: "The science behind the system", icon: BookOpen, to: "/the-smarty-method" },
    ],
    cta: { label: "Read the Smarty Blog", to: "/blog" },
  },
];


function ItemRow({ item, compact = false }: { item: Item; compact?: boolean }) {
  const Icon = item.icon;
  const inner = (
    <>
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className={compact
            ? "h-10 w-10 flex-shrink-0 rounded-md object-cover"
            : "h-12 w-12 flex-shrink-0 rounded-md object-cover lg:h-14 lg:w-14 xl:h-16 xl:w-16"}
        />
      ) : Icon ? (
        <span className={compact
          ? `flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${iconTone(item.title)}`
          : `flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md lg:h-14 lg:w-14 ${iconTone(item.title)}`}>
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary xl:text-base">
          {item.title}
        </div>
        <div className="mt-0.5 truncate text-xs leading-tight text-muted-foreground xl:text-sm">
          {item.meta}
        </div>
      </div>
      {item.to && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
      )}
    </>
  );
  const cls = compact
    ? "group flex min-h-10 items-center gap-3 text-left transition-colors"
    : "group flex min-h-12 items-center gap-3 text-left transition-colors lg:min-h-14 xl:min-h-16";
  return item.to ? (
    <Link to={item.to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Desktop-only About layout mirroring the old SmartyGym desktop homepage. */
export function DesktopAboutLanding({ page = "home", workoutCount = 0 }: { page?: "home" | "about"; workoutCount?: number }) {
  const [slide, setSlide] = useState(0);
  const sections = page === "about" ? aboutSections : homeSections;
  const displayedSections = sections.map((section) =>
    section.id === "smarty-workouts"
      ? {
          ...section,
          description: `${workoutCount.toLocaleString()} expert-designed workouts by Haris Falas across Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability, Pilates and Recovery.`,
        }
      : section,
  );
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 2750);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden lg:block">
      <section className="relative h-[90vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        {heroSlides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            loading={i === 0 ? "eager" : "lazy"}
            className={`about-kenburns absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDuration: "2600ms", transformOrigin: i % 2 === 0 ? "center center" : "center 40%" }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-hero-shade" aria-hidden="true" />
        <div
          className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-background to-transparent"
          style={{ height: "22%" }}
          aria-hidden="true"
        />
        <div className="relative z-10 h-full">
          <div className={`mx-auto w-full max-w-[1080px] px-6 ${page === "about" ? "pt-[144px]" : "pt-[118px]"}`}>
            <div className="w-[640px] max-w-full text-left">
              {page === "about" && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About SmartyGym</p>}
              <h2 className={`text-[60px] font-extrabold uppercase leading-[1.05] tracking-tight text-hero-foreground ${page === "about" ? "mt-2" : ""}`}>
                <span className="block whitespace-nowrap">Your Gym Re-imagined</span>
                <span className="block whitespace-nowrap text-primary">Anywhere, Anytime.</span>
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-hero-foreground/85">
                Your online gym and fitness coach — built on the sports science and training
                philosophy of{" "}
                <Link to="/haris-falas" className="font-bold text-primary hover:underline">
                  Sports Scientist Haris Falas
                </Link>
                .
              </p>
            </div>
            <div className="mt-5 flex flex-nowrap items-center gap-3">
              {[
                { to: "/smarty-workouts", label: "Smarty Workouts" },
                { to: "/wod", label: "Workout of the Day" },
                { to: "/create-your-own-workout", label: "Create Your Own Workout" },
              ].map((b) => (
                <Link
                  key={b.to}
                  to={b.to}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground transition-all hover:opacity-95"
                >
                  {b.label} <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div>
        {displayedSections.map((s, idx) => {
          const reverse = idx % 2 === 1;
          const accent = s.green ? "text-green-600 dark:text-green-500" : "text-primary";
          const bar = s.green ? "bg-green-600 dark:bg-green-500" : "bg-primary";
          const many = s.items.length > 4;
          const compactRows = s.id === "how" || s.id === "train";
          return (
            <section key={s.id} id={s.id} className="bg-background">
              <div
                className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-12 px-8 py-10 ${
                  reverse ? "[&>*:first-child]:order-2" : ""
                }`}
              >
                <Link
                  to={s.cta.to}
                  aria-label={s.cta.label}
                  className="group relative block aspect-[4/3] min-w-0 overflow-hidden rounded-3xl shadow-2xl"
                >
                  <img
                    src={s.image}
                    alt={`${s.lead} ${s.accentWord}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
                <div className="flex aspect-[4/3] min-w-0 flex-col justify-between py-1">
                  <div className="min-h-0">
                    <div className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] ${accent}`}>
                      <span className={`h-px w-6 ${bar}`} />
                      {s.tag}
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                      {s.lead} <span className={accent}>{s.accentWord}</span>
                    </h2>
                    <p className="mt-3 line-clamp-4 text-sm leading-snug text-muted-foreground">
                      {s.description}
                    </p>
                    <div className={`mt-5 grid ${compactRows ? "gap-1.5" : "gap-2 lg:gap-2.5"} ${many ? "grid-cols-2 gap-x-6" : "grid-cols-1"}`}>
                      {s.items.map((item) => (
                        <ItemRow key={item.id} item={item} compact={compactRows} />
                      ))}
                    </div>
                  </div>
                  <div className="pt-3">
                    <Link
                      to={s.cta.to}
                      className={`group inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3 ${accent}`}
                    >
                      {s.cta.label}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
