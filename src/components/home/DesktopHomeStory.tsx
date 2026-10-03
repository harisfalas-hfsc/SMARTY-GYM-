import { iconInk } from "@/lib/icon-tone";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  GraduationCap,
  Heart,
  Plane,
  Shield,
  Target,
  Users,
} from "lucide-react";

import harisPhoto from "@/assets/haris-falas-coach.jpg";
import builtForRealLife from "@/assets/home-values/value-built-for-real-life.webp";
import scientificApproach from "@/assets/home-values/value-scientific-approach.webp";
import accessibleToAll from "@/assets/home-values/value-accessible-to-all.webp";
import safeEffective from "@/assets/home-values/value-safe-effective.webp";
import evidenceBased from "@/assets/home-values/value-evidence-based.webp";
import structureClarity from "@/assets/home-values/value-structure-clarity.webp";
import humanConnection from "@/assets/home-values/value-human-connection.webp";
import resultsDriven from "@/assets/home-values/value-results-driven.webp";
import exerciseLibrary from "@/assets/explore-exercise-library.jpg";
import community from "@/assets/community-card.jpg";
import checkins from "@/assets/explore-checkins.jpg";

const partnerValues = [
  {
    title: "Real Expertise",
    text: "Training shaped by Sports Scientist Haris Falas and more than twenty years of coaching experience.",
    image: scientificApproach,
    Icon: GraduationCap,
  },
  {
    title: "Built Around You",
    text: "Your profile, goals, available equipment, schedule and daily readiness guide every personalized session.",
    image: builtForRealLife,
    Icon: Heart,
  },
  {
    title: "Clear Guidance",
    text: "Complete workout structure, exercise demonstrations, prescriptions and performance tracking in one place.",
    image: structureClarity,
    Icon: CheckCircle2,
  },
  {
    title: "Always Expanding",
    text: "New Smarty Workouts, daily rituals, useful tools and practical training articles keep the gym moving forward.",
    image: accessibleToAll,
    Icon: Dumbbell,
  },
];

const promiseValues = [
  { title: "Built for Real Life", text: "Train at home, in the gym, outdoors or while travelling, with the time and equipment you have.", image: builtForRealLife, Icon: Target },
  { title: "Scientific Approach", text: "Programming follows proven principles of exercise science, biomechanics and progressive training.", image: scientificApproach, Icon: Brain },
  { title: "Accessible to All", text: "Clear options support beginners, experienced gym-goers and athletes without losing training purpose.", image: accessibleToAll, Icon: Users },
  { title: "Safe & Effective", text: "Structured preparation, appropriate prescriptions and guided exercise execution support better training.", image: safeEffective, Icon: Shield },
];

const principles = [
  { title: "Evidence-Based", text: "Training decisions are grounded in sports science and proven coaching principles, not passing trends.", image: evidenceBased, Icon: Award },
  { title: "Structure & Clarity", text: "Every workout gives you a clear plan, from preparation through the final exercise and debrief.", image: structureClarity, Icon: CheckCircle2 },
  { title: "Human Expertise", text: "The method and ready-workout library carry the experience and standards of a real professional coach.", image: humanConnection, Icon: Heart },
  { title: "Results-Driven", text: "Your logbook, performance, training load and check-ins turn completed sessions into useful progress.", image: resultsDriven, Icon: Target },
];

const audiences = [
  { label: "Busy Adults", Icon: Users },
  { label: "Parents", Icon: Heart },
  { label: "Beginners", Icon: GraduationCap },
  { label: "Experienced", Icon: Target },
  { label: "Travellers", Icon: Plane },
  { label: "Gym-Goers", Icon: Dumbbell },
];

const destinations = [
  { title: "Exercise Library", text: "Explore the complete movement library with demonstrations and clear exercise information.", image: exerciseLibrary, to: "/exercise-library" },
  { title: "Smarty Community", text: "Connect around training, activity, shared workouts and the community rankings.", image: community, to: "/community" },
  { title: "Smarty Check-ins", text: "Record morning readiness and evening recovery so your training reflects how you actually feel.", image: checkins, to: "/smarty-checkins" },
] as const;

function Heading({ ghost, eyebrow, children }: { ghost: string; eyebrow: string; children: ReactNode }) {
  return (
    <div className="relative mb-12 text-center">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-9 text-[112px] font-black uppercase leading-none text-muted/45">
        {ghost}
      </span>
      <div className="relative pt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h2 className="text-5xl font-black uppercase text-foreground">{children}</h2>
      </div>
    </div>
  );
}

function ValueGrid({ items }: { items: typeof promiseValues }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      {items.map(({ title, text, image, Icon }) => (
        <article key={title} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="aspect-[16/9] overflow-hidden">
            <img src={image} alt="" loading="lazy" width={703} height={450} className="h-full w-full object-cover" />
          </div>
          <div className="p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Icon className={`h-5 w-5 ${iconInk(title)}`} /> {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DesktopHomeStory() {
  return (
    <div className="hidden lg:block">
      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-8">
          <Heading ghost="EXPLORE" eyebrow="More in SmartyGym">Everything In One Place</Heading>
          <div className="grid grid-cols-3 gap-5">
            {destinations.map((destination) => (
              <Link key={destination.title} to={destination.to} className="group overflow-hidden rounded-lg border border-border bg-card">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={destination.image} alt={destination.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-black text-foreground group-hover:text-primary">{destination.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{destination.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Explore <ChevronRight className="h-4 w-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-7xl px-8">
          <Heading ghost="THE GYM" eyebrow="Your Fitness Partner">Anywhere, Anytime.</Heading>
          <p className="mx-auto max-w-4xl text-center text-lg leading-relaxed text-muted-foreground">
            SmartyGym gives you a complete training system when life changes the plan. Train at home, at your gym, outdoors or while travelling with expert workouts, personalized sessions and clear guidance from start to finish.
          </p>
          <div className="mt-10 grid grid-cols-4 gap-5">
            {partnerValues.map(({ title, text, image, Icon }) => (
              <article key={title} className="overflow-hidden rounded-lg border border-border bg-card">
                <img src={image} alt="" loading="lazy" width={703} height={450} className="aspect-[16/9] w-full object-cover" />
                <div className="p-5">
                  <h3 className="flex items-center gap-2 font-bold text-foreground"><Icon className={`h-5 w-5 ${iconInk(title)}`} />{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-8">
            <Link to="/why-invest-in-smartygym" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Why SmartyGym <ChevronRight className="h-4 w-4" /></Link>
            <Link to="/the-smarty-method" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><BookOpen className="h-4 w-4" /> Discover The Smarty Method <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 border-t border-border pt-8">
            <p className="mb-5 text-center text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">Who is SmartyGym for?</p>
            <div className="mx-auto grid max-w-4xl grid-cols-6 gap-4">
              {audiences.map(({ label, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <Icon className={`h-7 w-7 ${iconInk(label)}`} />
                  <span className="text-sm font-bold text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-8">
          <Heading ghost="THE PROMISE" eyebrow="Why SmartyGym">Built for Real Life</Heading>
          <ValueGrid items={promiseValues} />
          <div className="mt-10 border-l-4 border-primary bg-card px-10 py-9 text-center">
            <h3 className="text-3xl font-black uppercase text-foreground">The SmartyGym Promise</h3>
            <p className="mx-auto mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">
              Every part of SmartyGym is built to remove confusion and help you train with purpose. You get structure, flexibility and guidance that fit your goals, your level and the reality of your day.
            </p>
            <p className="mt-4 font-bold text-primary">Real coaching principles. Useful technology. Training that moves with you.</p>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-8">
          <Heading ghost="VALUES" eyebrow="Our Principles">What We Stand For</Heading>
          <ValueGrid items={principles} />
        </div>
      </section>

      <section className="bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-8">
          <Heading ghost="THE COACH" eyebrow="A Word From">Haris Falas</Heading>
          <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-12 border-t border-border pt-10">
            <div>
              <img src={harisPhoto} alt="Haris Falas, founder of SmartyGym" loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
              <Link to="/haris-falas" className="mt-5 inline-flex items-center gap-1.5 text-lg font-bold text-primary hover:underline">Haris Falas <ChevronRight className="h-5 w-5" /></Link>
              <p className="mt-1 text-sm text-muted-foreground">Founder · Sports Scientist · Strength & Conditioning Coach</p>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>For more than twenty years, I have coached athletes, teams and everyday people who want to train with purpose. People rarely struggle because they do not care. They struggle because they do not have a clear plan they can trust.</p>
              <p className="font-bold text-foreground">That is why I created SmartyGym.</p>
              <p>My goal is to make professional training simpler: ready expert workouts, personalized daily sessions, clear exercise guidance and meaningful tracking, whether you train at home, outdoors or inside a gym.</p>
              <p>SmartyGym is for people who want more than random exercises. It is a system designed to help you feel stronger, move better, understand your training and keep progressing one session at a time.</p>
              <blockquote className="border-l-4 border-primary bg-card p-5 font-semibold text-foreground">Your Gym Re-imagined. Anywhere, Anytime.</blockquote>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}