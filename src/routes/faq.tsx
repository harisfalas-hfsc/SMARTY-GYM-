import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { createFileRoute } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { SmartyCard } from "@/components/SmartyCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/PageHeader";
import { getSmartyWorkoutCounts } from "@/lib/smarty-workouts.functions";

const URL = "https://smartygym.com/faq";
const TITLE = "SmartyGym FAQ — Smarty Coach, workouts & training";
const DESCRIPTION =
  "Answers about SmartyGym: create a workout with Smarty Coach or build it yourself, share workouts, track progress and manage your membership.";

const itemsWithWorkoutCount = (workoutCount: number): { q: string; a: string }[] => [
  {
    q: "What is SmartyGym?",
    a: "An online gym with ready workouts and Create Your Own Workout: choose Smarty Coach to build around your answers, or Build It Yourself from the Exercise Library.",
  },
  {
    q: "How does Smarty Coach build my workout?",
    a: "You answer five quick questions. Smarty Coach reads your profile, fitness level and training history, then builds the session from our exercise library.",
  },
  {
    q: "Can I build my own workout instead of using Smarty Coach?",
    a: "Yes. Create Your Own Workout offers two options: answer Smarty Coach's questions, or choose Build It Yourself to browse the Exercise Library and select exercises for Activation, Main Workout, Finisher and Cool Down. You can explore both options before signing up; saving a workout requires membership.",
  },
  {
    q: "What does it cost?",
    a: "€9.99 per month. No contract — cancel anytime.",
  },
  {
    q: "What's included in the subscription?",
    a: "Up to 2 workouts per day, access to ready Smarty Workouts, the daily Smarty Ritual, Smarty Check-ins, the full exercise library, all training tools, your logbook, progress tracking and every previous workout you've created.",
  },
  {
    q: "What are Smarty Workouts?",
    a: `${workoutCount.toLocaleString()} expert-designed workouts by Haris Falas across nine categories: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability, Pilates and Recovery. Anyone can browse the categories and see workout pictures and details; Premium members can open a workout and train it. Choose a category to filter workouts by equipment, duration and difficulty.`,
  },
  {
    q: "Can I track a Smarty Workout in my logbook?",
    a: "Yes. When you open one to train, it works like your other workouts: start the player, log performance, mark it completed or not completed, or schedule it. It appears in your logbook. You cannot share it to the community because it is already published for everyone to browse.",
  },
  {
    q: "What is the Workout of the Day?",
    a: "Every training day SmartyGym delivers two fresh, expertly designed workouts — one with equipment and one without. On recovery days, a single guided recovery session. Each day focuses on a different category and difficulty level, following a science-based periodization approach designed by Coach Haris Falas. Within each cycle you train all fitness parameters, so your training is reliable, professionally organized and designed to systematically improve every aspect of your fitness.",
  },
  {
    q: "Why should I follow the Workout of the Day?",
    a: "Because the hard part of training is knowing what to do today. Following the Workout of the Day is like having a personal trainer in your pocket: every day you receive a structured, professionally organized session, and you never have to worry about what to follow. Our science-based periodization mixes strength, cardio, metabolic, mobility and recovery in the right order, so you progress without overtraining or undertraining.",
  },
  {
    q: "How is it different from choosing a workout myself?",
    a: "Choosing manually is random: you repeat what you like and skip what you need. The Workout of the Day is a plan — like a personal trainer deciding for you — ready before you wake up, and you can still create your own workouts any time.",
  },
  {
    q: "Do I need equipment?",
    a: "No. Tell Smarty Coach what you have — nothing, dumbbells, bands or a full gym — and the session is built around it.",
  },
  {
    q: "Can I train at home, outdoors or in a hotel?",
    a: "Yes. Location is one of your answers and it changes the exercises you get.",
  },
  {
    q: "What about injuries or limitations?",
    a: "Add them to your training profile. Smarty Coach filters those exercises out of every session.",
  },
  {
    q: "Does it get better over time?",
    a: "Yes. Rate a workout and Smarty Coach uses that feedback plus your history to sharpen the next one.",
  },
  {
    q: "Can I see my past workouts?",
    a: "Yes. Your saved workouts are in your logbook. Completed training remains in your progress even if a creator later deletes a shared workout.",
  },
  {
    q: "Does the app track what I actually do in a session?",
    a: "Yes. The player records your reps, weight, time or rounds set by set, in the format each exercise is prescribed in, so nothing depends on memory.",
  },
  {
    q: "What is the session debrief?",
    a: "One short card-based questionnaire at the end of a workout: RPE, how you felt, whether you enjoyed it and an optional note. It is asked once and you can edit your answers any time — your progress and training load update immediately.",
  },
  {
    q: "How do I see if I am progressing?",
    a: "Repeat a workout and each attempt is compared with the previous one — but only when the prescription is genuinely the same. You see reps, load and time side by side with the RPE and feeling you logged that day.",
  },
  {
    q: "What is the training load?",
    a: "Your recent workload in your own logged units compared with your own 21-day baseline, adjusted by your RPE. There are no invented scores — only your own history.",
  },
  {
    q: "Are there achievements?",
    a: "Yes. Milestones unlock automatically as you complete, schedule, share and repeat workouts.",
  },
  {
    q: "Does the app work offline?",
    a: "You need a connection to load workouts and save training. Exercise demonstrations already loaded on your device may remain available temporarily, but offline training and automatic syncing are not guaranteed.",
  },

  {
    q: "What is the Smarty Community?",
    a: "The social area of the app. Members can share workouts they created with Smarty Coach or Build It Yourself. Other members can discover, train, like and comment on those workouts.",
  },
  {
    q: "Can I unshare or delete a workout I created?",
    a: "Yes. You can share, unshare or delete your own Smarty Coach or Build It Yourself workout. Unsharing removes it from Shared Workouts. Deleting removes the workout from everyone's logbooks and removes its likes, favourites and comments, but completed training remains in each person's progress. A workout you saved from Shared Workouts cannot be re-shared or deleted by you; its creator controls it.",
  },
  {
    q: "What happens when I open a shared workout?",
    a: "It opens exactly like a workout in your own logbook — same reader, same player. Below it you can mark it completed, not completed or scheduled, like it and comment on it.",
  },
  {
    q: "How do comments work?",
    a: "You can only comment on shared workouts, in up to 160 characters — like a text message. Your comment appears in the community comments card with your name and the first two lines; tapping it opens the workout and all of its comments.",
  },
  {
    q: "What are the rankings?",
    a: "Two boards with ten positions each: the member ranking (score, streak, completed, shared) and the workout ranking (most completed and most liked, shared workouts only). Empty positions stay visible until someone takes them.",
  },
  {
    q: "What is Smarty Ritual?",
    a: "One fresh daily plan with three practical phases: Morning activation, a Midday reset and an Evening unwind. It supports movement, mobility, energy and recovery around your workouts and the rest of your day.",
  },
  {
    q: "What are Smarty Check-ins?",
    a: "Two 30-second check-ins a day for Premium members. The morning check-in (07:00–10:00) asks about sleep, readiness, soreness and mood; the night check-in (19:00–22:00) about steps, hydration, protein and how demanding your day was. Together they give you a Daily Smarty Score out of 100, saved in Logbook → Progress with trends, weekly insights and streak badges.",
  },
  {
    q: "What if I miss the check-in pop-up?",
    a: "Open Smarty Check-ins from the menu and complete it any time while the window is open. You also get one reminder in your inbox during each window. Outside the windows, the page tells you when the next check-in opens.",
  },
  {
    q: "Do my check-ins change my workouts?",
    a: "They inform them. When you create a workout, the coach may suggest an easier or harder session because of how you slept, felt or how hard yesterday was, and tells you why. Your own choice stays unless you accept the suggestion.",
  },
  {
    q: "Can I schedule a workout?",
    a: "Yes. Open any workout and choose Schedule. Only the button matching the current state is highlighted, and you can press Schedule again anytime to move it to another day.",
  },
  {
    q: "Do I get reminders for a scheduled workout?",
    a: "Yes — a reminder 30 minutes before, another at the scheduled time, and a follow-up the next day asking if you did it so you can mark it completed, favourite it or share it with the community.",
  },
  {
    q: "Is this medical advice?",
    a: "No. SmartyGym is a general fitness tool. Consult a professional if you have a medical condition.",
  },

  {
    q: "What happens to my data?",
    a: "It stays in your account to personalize your training. We never sell it. See the Privacy Policy.",
  },
];

/** Drops every paid-membership question while Free Access Mode is ON. */
function visibleItems(freeAccessMode: boolean, workoutCount: number) {
  const items = itemsWithWorkoutCount(workoutCount);
  return freeAccessMode
    ? items.filter(
        (it) =>
          !/cost|subscription|subscribed|Unsubscribe/i.test(it.q) &&
          !/€|subscription|subscribed|Unsubscribe|cancel anytime/i.test(it.a),
      )
    : items;
}

const jsonLd = (freeAccessMode: boolean, workoutCount: number) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      "@id": `${URL}#faq`,
      mainEntity: visibleItems(freeAccessMode, workoutCount).map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
        { "@type": "ListItem", position: 2, name: "FAQ", item: URL },
      ],
    },
  ],
});

export const Route = createFileRoute("/faq")({
  loader: async () => {
    try {
      const { getFreeAccessMode } = await import("@/lib/free-access.functions");
      const [access, counts] = await Promise.all([getFreeAccessMode(), getSmartyWorkoutCounts()]);
      return { ...access, workoutCount: counts.total };
    } catch {
      return { freeAccessMode: false, workoutCount: 0 };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        name: "keywords",
        content: withExtendedKeywords("/faq", loaderData?.freeAccessMode
          ? "smartygym faq, workout app questions, how workouts are generated, free access, equipment needed"
          : "smartygym faq, workout app questions, how workouts are generated, membership questions, cancel membership, equipment needed"),
      },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd(loaderData?.freeAccessMode ?? false, loaderData?.workoutCount ?? 0)),
      },
    ],
  }),
  component: FAQ,
});

function FAQ() {
  const { freeAccessMode } = useFreeAccessMode();
  const { workoutCount } = Route.useLoaderData();
  const items = visibleItems(freeAccessMode, workoutCount);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader
        eyebrow="FAQ"
        title={
          <>
            Your <span className="text-primary">questions</span> answered
          </>
        }
      />

      <SmartyCard
        tone="cyan"
        eyebrow="FAQ"
        eyebrowIcon="?"
        title="Frequently asked"
        accent="questions."
      >
        <Accordion type="single" collapsible className="w-full">
          {items.map((it, i) => (
            <AccordionItem key={it.q} value={`item-${i}`} className="border-blue-200 dark:border-blue-500/40 last:border-b-0">
              <AccordionTrigger className="py-3 text-left text-sm font-semibold leading-5 hover:no-underline sm:text-base">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="pb-3 pr-6 pt-0 text-sm leading-6 text-muted-foreground">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SmartyCard>
    </div>
  );
}
