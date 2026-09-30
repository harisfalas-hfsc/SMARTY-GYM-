import { createFileRoute, Link } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import pageHeroImage from "@/assets/hero-training.jpg";
import { getSmartyWorkoutCounts } from "@/lib/smarty-workouts.functions";

export const Route = createFileRoute("/how-it-works")({
  loader: () => getSmartyWorkoutCounts(),
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
           withExtendedKeywords("/how-it-works", "how smartygym works, pre workout questionnaire, training profile, warm up activation main workout finisher cool down, sets reps tempo rest, guided workout player, session debrief, smarty ritual, daily movement recovery ritual"),
      },
      { title: "How Smarty Gym works — answer, analyze, train" },
      {
        name: "description",
        content:
          "You answer. Smarty Coach thinks. You train. Four simple steps from your goal to a personalized workout.",
      },
      { property: "og:title", content: "How Smarty Gym works" },
      { property: "og:description", content: "You answer. Smarty Coach thinks. You train." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://smartygym.com/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/how-it-works" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "HowTo",
              name: "How to get a personalized workout with SmartyGym",
              description:
                "Four steps from your goal to a complete personalized workout built by Smarty Coach.",
              totalTime: "PT2M",
              step: [
                {
                  "@type": "HowToStep",
                  position: 1,
                  name: "You answer",
                  text: "Set your goal, mood, available time, training location and equipment.",
                },
                {
                  "@type": "HowToStep",
                  position: 2,
                  name: "Smarty Coach analyses",
                  text: "Your training profile and today's answers are merged and matched against the exercise library.",
                },
                {
                  "@type": "HowToStep",
                  position: 3,
                  name: "Your workout is built",
                  text: "A full session with warm-up, activation, main work, finisher and cool-down, including sets, reps, tempo and rest.",
                },
                {
                  "@type": "HowToStep",
                  position: 4,
                  name: "You train and log it",
                  text: "Follow the guided player, then log the session so the next workout adapts to your feedback.",
                },
              ],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://smartygym.com/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "How it works",
                  item: "https://smartygym.com/how-it-works",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),

  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    title: "You answer",
    desc: "Goal • Mood • Time • Location • Equipment",
  },
  {
    n: "02",
    title: "Smarty Coach analyzes",
    desc: "Profile • Fitness level • Goals • History",
  },
  {
    n: "03",
    title: "Training philosophy",
    desc: "Sports science • Safety • Health • Performance",
  },
  {
    n: "04",
    title: "Your workout",
    desc: "The right exercises, built into your session.",
  },
];

const WOD_STEPS = [
  {
    n: "01",
    title: "You turn it on",
    desc: "Training Profile • One tap",
  },
  {
    n: "02",
    title: "The cycle decides",
    desc: "Periodized calendar • Same day for everyone",
  },
  {
    n: "03",
    title: "Two workouts are built",
    desc: "One with equipment • One bodyweight only",
  },
  {
    n: "04",
    title: "You just train",
    desc: "Open, follow, log. Every single day.",
  },
];

const COMMUNITY_STEPS = [
  {
    n: "01",
    title: "Members share",
    desc: "Any workout • Exactly as generated • Never edited",
  },
  {
    n: "02",
    title: "You browse",
    desc: "Shared workouts • Member ranking • Workout ranking • Comments",
  },
  {
    n: "03",
    title: "You train it",
    desc: "A copy lands in your logbook • Completed, not completed or scheduled",
  },
  {
    n: "04",
    title: "You react",
    desc: "Like it • Comment in 160 characters • Climb the rankings",
  },
];

const CHECKIN_STEPS = [
  { n: "01", title: "Morning check-in", desc: "Sleep • Readiness • Soreness • Mood" },
  { n: "02", title: "Night check-in", desc: "Steps • Hydration • Protein • Day strain" },
  { n: "03", title: "Smarty Score", desc: "One score out of 100 • Guides your workout" },
];

const RITUAL_STEPS = [
  {
    n: "01",
    title: "Morning activation",
    desc: "Wake up • Mobilize • Prepare",
  },
  {
    n: "02",
    title: "Midday reset",
    desc: "Move • Release stiffness • Refocus",
  },
  {
    n: "03",
    title: "Evening unwind",
    desc: "Recover • Decompress • Prepare for rest",
  },
];

const TRACKING_STEPS = [
  {
    n: "01",
    title: "The player logs it",
    desc: "Reps, weight, time, rounds • Set by set",
  },
  {
    n: "02",
    title: "You debrief once",
    desc: "RPE • How you felt • Enjoyment • Notes",
  },
  {
    n: "03",
    title: "It lands in your logbook",
    desc: "Calendar • Completed, scheduled, favourite • Equipment badges",
  },
  {
    n: "04",
    title: "Progress is measured",
    desc: "Same workout compared attempt by attempt • Training load",
  },
];




function HowItWorks() {
  const { freeAccessMode } = useFreeAccessMode();
  const workoutCount = Route.useLoaderData().total;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader image={pageHeroImage}
        eyebrow="How it works"
        title={
          <>
            Simple &amp; <span className="text-primary">transparent</span>
          </>
        }
         subtitle="Four ways to train: choose a ready Smarty Workout, create your own, follow the Workout of the Day or train with the Smarty Community — with Smarty Ritual supporting your movement and recovery."
      />

       <section className="rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
         <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
           Way 1 — Smarty Workouts
         </p>
         <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
           Find a ready workout and train.
         </h2>
         <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
           Explore {workoutCount.toLocaleString()} expert-designed workouts across eight categories: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic,
           Challenge, Mobility &amp; Stability and Pilates. Open a category to filter by equipment,
           duration and difficulty. Everyone can browse workout pictures and details; Premium members
           can open a workout, train it, log performance and track it in their logbook. These workouts
           are published for everyone to browse, so they cannot be shared to the community.
         </p>
         <div className="mt-6 flex justify-center">
           <Button asChild size="lg" className="font-extrabold uppercase">
             <Link to="/smarty-workouts">Explore Smarty Workouts</Link>
           </Button>
         </div>
       </section>

       <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
           Way 2 — Create any workout
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          You answer. Smarty Coach thinks. You train.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          For the days you know what you want: your goal, your mood, your time, your equipment.
          Smarty Coach builds a one-off session around exactly that.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-4 sm:gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">
                {s.n}
              </div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-semibold leading-snug text-muted-foreground">
          Then you train, give feedback, and Smarty Coach uses your history to make your next
          workout <span className="text-primary">even smarter.</span>
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/create-your-workout">Create my workout</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
           Way 3 — Workout of the Day
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          {freeAccessMode
            ? "You turn it on once. Your training is planned."
            : "You subscribe once. Your training is planned."}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Every day you get two ready workouts — one with equipment, one bodyweight only — built
          automatically around your Training Profile. Both follow a scientific periodization plan:
          strength, endurance, power, mobility and recovery days are sequenced so you never
          overtrain, never undertrain, and every fitness quality is developed in the right order.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-4 sm:gap-4">
          {WOD_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">
                {s.n}
              </div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-semibold leading-snug text-muted-foreground">
          Instead of improvising something different every day, it is like having a{" "}
          <span className="text-primary">personal trainer</span> who already knows what you must do
          today, next week and next month.
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/wod">Subscribe to Workout of the Day</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Daily support — Smarty Ritual
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          Your day is more than one workout.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Each day brings one fresh Smarty Ritual arranged around three moments: activate in the
          morning, reset at midday and unwind in the evening. Open it, follow the practical guidance
          and support your mobility, energy and recovery between workouts.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-4">
          {RITUAL_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">{s.n}</div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/smarty-ritual">Open Smarty Ritual</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Daily support — Smarty Check-ins
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          Tell your coach how you really feel.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Two 30-second check-ins a day. In the morning (07:00–10:00) you log sleep, readiness,
          soreness and mood; at night (19:00–22:00) your steps, hydration, protein and how demanding
          the day was. Both become one Daily Smarty Score, saved in Logbook → Progress, and Create
          Your Workout uses it to suggest the right intensity — you decide whether to accept. Missed
          the pop-up? Open Smarty Check-ins any time during the window, and you also get a reminder
          in your inbox.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-4">
          {CHECKIN_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">{s.n}</div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/smarty-checkins">Open Smarty Check-ins</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
           Way 4 — Smarty Community
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          Train the workouts other members share.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Every shared workout opens exactly like a workout in your own logbook — same reader, same
          player. Do it, mark it completed, not completed or scheduled, like it and leave a short
          comment. Your comment appears in the community comments card for everyone to read.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-4 sm:gap-4">
          {COMMUNITY_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">
                {s.n}
              </div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-semibold leading-snug text-muted-foreground">
          Training alone is hard. Training with{" "}
          <span className="text-primary">other Smarty members</span> keeps you accountable.
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/community">Open Smarty Community</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          After you train — tracking &amp; progress
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          Every session becomes data that improves the next one.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          The workout is only half of it. Smarty Gym records what you actually did, how it felt,
          and how it compares with the last time you did the same session — then feeds all of it
          back to Smarty Coach.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-4 sm:gap-4">
          {TRACKING_STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="text-4xl font-black leading-none text-primary sm:text-5xl">
                {s.n}
              </div>
              <div className="mt-3 text-base font-bold uppercase">{s.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-semibold leading-snug text-muted-foreground">
          Achievements unlock as you train, notifications remind you about scheduled sessions, and{" "}
          <span className="text-primary">offline mode</span> keeps your workouts, logbook and player
          working with no signal — everything syncs when you are back online.
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/logbook" search={{ filter: "all", equip: "all", view: "list" }}>
              Open my logbook
            </Link>

          </Button>
        </div>
      </section>

    </div>

  );
}
