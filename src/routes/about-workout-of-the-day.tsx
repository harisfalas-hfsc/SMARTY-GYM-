import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, BatteryCharging, CalendarDays, ChartNoAxesCombined, Dumbbell, Flame, HeartPulse, House, Layers, NotebookPen, ShieldCheck, Target, Zap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { iconInk } from "@/lib/icon-tone";
import wodPhoto from "@/assets/hero-wod-card.jpg";
import coachPhoto from "@/assets/haris-falas-coach.jpg";

const title = "Workout of the Day Philosophy — Planned Training | SmartyGym";
const description = "Discover how Coach Haris Falas combines periodization, energy systems, training load and recovery in SmartyGym's science-based Workout of the Day.";

export const Route = createFileRoute("/about-workout-of-the-day")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/about-workout-of-the-day" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/about-workout-of-the-day" }],
  }),
  component: AboutWorkoutOfTheDay,
});

const principles = [
  { Icon: Target, identity: "wod", title: "A purpose for every session", text: "Strength, muscle building, conditioning and recovery are different training demands. A plan gives each session a clear role, rather than asking every workout to do everything." },
  { Icon: CalendarDays, identity: "wod", title: "Progress across a training cycle", text: "Periodization means organizing training over time: varying the emphasis, difficulty and demand of sessions so that challenging work and recovery complement one another. It is purposeful variation, not variety for its own sake." },
  { Icon: ChartNoAxesCombined, identity: "progress", title: "Consistency you can measure", text: "Following a structure makes it easier to build a routine and compare your own performance. Progress comes from repeated, appropriate effort over time—not from making every day harder than the last." },
];

const energySystems = [
  { Icon: Zap, identity: "strength", title: "Short, powerful efforts", text: "The phosphagen system supplies energy rapidly for brief, high-intensity efforts such as a powerful movement or a demanding set. Appropriate rest helps you repeat that effort with quality." },
  { Icon: Flame, identity: "metabolic", title: "Sustained hard efforts", text: "The glycolytic system contributes more as intense work continues, including challenging intervals and repeated efforts. Work duration and rest change how demanding these sessions feel." },
  { Icon: HeartPulse, identity: "cardio", title: "Endurance and between-effort recovery", text: "The aerobic system supports longer activity and helps restore your capacity between efforts. Developing it supports conditioning and your ability to recover for the next bout of work." },
];

function AboutWorkoutOfTheDay() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader image={wodPhoto} eyebrow="The philosophy" title="Workout of the Day" subtitle="A purposeful session today. A coherent training plan over time." />

      <section className="pb-8 sm:pb-12">
        <div className="flex items-center gap-3">
          <CalendarDays className={`h-6 w-6 shrink-0 ${iconInk("wod")}`} />
          <h2 className="text-xl font-extrabold uppercase sm:text-2xl">Your training, already planned</h2>
        </div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Every training day SmartyGym delivers two fresh, expertly designed workouts — one with equipment and one without. On recovery days, a single guided recovery session. Each day focuses on a different category and difficulty level, following a science-based periodization approach designed by Coach{" "}
          <Link to="/haris-falas" className="font-semibold text-primary">HARIS FALAS</Link>.
        </p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Workout of the Day removes the daily guesswork of choosing what to train. The two training-day workouts offer alternative ways to follow the day's focus, depending on your equipment—not an instruction to complete both. The aim is balanced physical preparation: purposeful strength and conditioning, supported by movement quality and recovery.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="flex items-start gap-3 p-5"><Dumbbell className={`mt-1 h-6 w-6 shrink-0 ${iconInk("strength")}`} /><div><h3 className="font-bold">With equipment</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Follow a ready session using the equipment listed in that workout.</p></div></Card>
          <Card className="flex items-start gap-3 p-5"><House className={`mt-1 h-6 w-6 shrink-0 ${iconInk("wod")}`} /><div><h3 className="font-bold">Without equipment</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Follow the same daily training direction with a bodyweight alternative.</p></div></Card>
        </div>
      </section>

      <section className="border-t border-border py-8 sm:py-12">
        <div className="flex items-center gap-3"><Layers className={`h-6 w-6 shrink-0 ${iconInk("wod")}`} /><h2 className="text-xl font-extrabold uppercase sm:text-2xl">Why a plan matters</h2></div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">A workout can be challenging without fitting the bigger picture. Thoughtful programming considers how today's effort relates to yesterday's work and tomorrow's recovery. This is the philosophy behind Workout of the Day—and why a coherent plan offers more direction than choosing unrelated sessions at random.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{principles.map(({ Icon, identity, title: heading, text }) => <Card key={heading} className="p-5 sm:p-6"><Icon className={`h-7 w-7 ${iconInk(identity)}`} /><h3 className="mt-4 text-lg font-bold leading-snug">{heading}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></Card>)}</div>
      </section>

      <section className="border-t border-border py-8 sm:py-12">
        <div className="flex items-center gap-3"><Activity className={`h-6 w-6 shrink-0 ${iconInk("cardio")}`} /><h2 className="text-xl font-extrabold uppercase sm:text-2xl">Different demands. Different energy systems.</h2></div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">Your body uses several energy systems together. None switches on in isolation: the intensity, duration and recovery between efforts influence which contributes most. Strength work, demanding intervals and sustained conditioning therefore develop different—but connected—physical capacities.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{energySystems.map(({ Icon, identity, title: heading, text }) => <Card key={heading} className="p-5 sm:p-6"><Icon className={`h-7 w-7 ${iconInk(identity)}`} /><h3 className="mt-4 text-lg font-bold leading-snug">{heading}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></Card>)}</div>
        <p className="mt-5 text-base leading-7 text-muted-foreground">Varying the training focus gives these qualities a place within the wider plan. It does not mean exhausting every energy system every day. Rest periods, exercise selection and session format all help give the workout its intended stimulus.</p>
      </section>

      <section className="border-t border-border py-8 sm:py-12">
        <div className="flex items-center gap-3"><NotebookPen className={`h-6 w-6 shrink-0 ${iconInk("logbook")}`} /><h2 className="text-xl font-extrabold uppercase sm:text-2xl">Training load: the work you actually do</h2></div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">A plan describes the intended session. Training load helps you understand the demand of the work you actually perform. Session duration, effort, resistance, repetitions and rest all matter to how your body experiences training. A hard session is not automatically a better session; the useful question is whether the demand is appropriate for you now.</p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Record your performed work and how it felt in the Logbook. Your history, check-ins and current readiness help Smarty Coach put the recommendation in context. A planned workout is not proof that you trained, and simply opening a workout is not a completed session. Your own records make the difference between intention and actual training.</p>
        <Button asChild variant="link" className="mt-3 h-auto whitespace-normal px-0 py-2 text-left"><Link to="/training-load-science">Understand Training Load <ArrowRight /></Link></Button>
      </section>

      <section className="border-t border-border py-8 sm:py-12">
        <div className="flex items-center gap-3"><BatteryCharging className={`h-6 w-6 shrink-0 ${iconInk("recovery")}`} /><h2 className="text-xl font-extrabold uppercase sm:text-2xl">Recovery belongs in the plan</h2></div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">Training provides a stimulus; adaptation requires recovery. Sleep, adequate food, hydration and the spacing of demanding sessions affect how well you respond. Guided recovery days are a deliberate part of Workout of the Day, not a gap in the program or a workout you have failed to do.</p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Your readiness can also change within the day. If you have already trained, feel unusually fatigued or are recovering poorly, more intense work may not be the right next step. Use your check-in, logged training and Smarty Coach guidance to make a sensible choice. Do not try to catch up by stacking missed workouts into one day.</p>
      </section>

      <section className="border-t border-border py-8 sm:py-12">
        <div className="flex items-center gap-3"><ShieldCheck className={`h-6 w-6 shrink-0 ${iconInk("coach")}`} /><h2 className="text-xl font-extrabold uppercase sm:text-2xl">Coach-designed, science-informed</h2></div>
        <div className="mt-5 flex items-center gap-4"><img src={coachPhoto} alt="Coach Haris Falas" loading="lazy" className="h-20 w-20 shrink-0 rounded-md object-cover object-top" /><div><Link to="/haris-falas" className="font-extrabold text-primary">HARIS FALAS</Link><p className="mt-1 text-sm text-muted-foreground">Sports Scientist · BSc Sport Science · NSCA CSCS</p></div></div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">Workout of the Day puts Coach Haris Falas's training methodology into practice through organized sessions and a considered training sequence. Its foundations are established sports-science principles: specificity, progressive overload, variation and recovery. These principles provide direction; they do not promise identical results for everyone.</p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">It is like having a personal trainer in your pocket: a clear session to follow, a reason behind the work and a way to track your response. Smarty Coach adds guidance from your own training context. This is structured digital coaching—not a live one-to-one conversation or a substitute for in-person technique assessment, medical advice or an individually supervised rehabilitation program.</p>
      </section>

      <section className="border-t border-border pt-8 sm:pt-12">
        <h2 className="text-xl font-extrabold uppercase sm:text-2xl">Follow the plan. Respect your body.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">Check today's focus and your readiness, choose the equipment or bodyweight option that fits, follow the prescribed session and record what you actually did. Use recovery days as intended. If your goals require a more specialized approach, Workout of the Day remains one way to train within SmartyGym—not an obligation to ignore your own needs.</p>
        <Button asChild size="lg" className="mt-6 h-auto min-h-12 whitespace-normal py-3"><Link to="/wod">See today's Workout of the Day <ArrowRight /></Link></Button>
      </section>
    </div>
  );
}