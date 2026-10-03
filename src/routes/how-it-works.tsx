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
      { title: "How SmartyGym works — create, share and train" },
      {
        name: "description",
        content:
          "Create your own workout with Smarty Coach or build it yourself from the Exercise Library. Explore how members share and track training.",
      },
      { property: "og:title", content: "How SmartyGym works — create, share and train" },
      { property: "og:description", content: "Create your own workout with Smarty Coach or build it yourself from the Exercise Library. Explore how members share and track training." },
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
    title: "Choose your way",
    desc: "Smarty Coach or Build It Yourself",
  },
  {
    n: "02",
    title: "Make it yours",
    desc: "Answer a few questions or browse the Exercise Library",
  },
  {
    n: "03",
    title: "Build your session",
    desc: "Coach builds for you or you pick each exercise",
  },
  {
    n: "04",
    title: "Train and track",
    desc: "Save it to your logbook • Train • Share",
  },
];

const WOD_STEPS = [
  {
    n: "01",
    title: "Every training day",
    desc: "Two fresh workouts • Ready for you",
  },
  {
    n: "02",
    title: "Periodization decides",
    desc: "A different category and level each day",
  },
  {
    n: "03",
    title: "Two expert workouts",
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
    desc: "Share your own Smarty Coach or Build It Yourself workout",
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
  const workoutCount = Route.useLoaderData()?.total ?? 0;
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
           Explore {workoutCount.toLocaleString()} expert-designed workouts across nine categories: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic,
           Challenge, Mobility &amp; Stability, Pilates and Recovery. Open a category to filter by equipment,
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
          Create your own workout, your way.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Choose Smarty Coach to build a session around your goal, mood, time and equipment, or
          Build It Yourself by choosing exercises from the Exercise Library for each part of your workout.
          Explore either option before signing up; membership is needed to save your workout.
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
          Train on your schedule, choose the exercises yourself or let Smarty Coach help, keep a
          record of what you did, and <span className="text-primary">share your own session.</span>
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="font-extrabold uppercase">
            <Link to="/create-your-own-workout">Create my workout</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5 sm:p-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
           Way 3 — Workout of the Day
        </p>
        <h2 className="mt-2 text-center text-xl font-extrabold uppercase sm:text-2xl">
          Your training is planned.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          Every day you get two ready workouts — one with equipment, one bodyweight only — expertly
          designed by Coach Haris Falas. Both follow a scientific periodization plan:
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
            <Link to="/wod">See the Workout of the Day</Link>
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
          Members can share their own Smarty Coach or Build It Yourself workouts. Open one with the
          same player as your logbook, train it, like it or comment. Creators can unshare at any time,
          removing it from Shared Workouts, or delete it for everyone. Likes, comments and favourites
          go with a deleted workout; completed training stays in each member's progress. A workout
          you saved from Shared Workouts is yours to train, not to re-share or delete.
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
          The workout is only half of it. SmartyGym records what you actually did, how it felt,
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
          <span className="text-primary">your training history</span> keeps your completed activity
          even if the workout is later removed.
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
