import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Clock3,
  Dumbbell,
  Gauge,
  HeartPulse,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SmartyCard } from "@/components/SmartyCard";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";

const SITE = "https://smartygym.com";
const URL = `${SITE}/training-load-science`;
const TITLE = "The Science Behind Training Load | SmartyGym";
const DESCRIPTION =
  "Learn how SmartyGym calculates personal strength, conditioning and overall training load from your logged workouts and your own recent baseline.";

export const Route = createFileRoute("/training-load-science")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content: withExtendedKeywords(
          "/training-load-science",
          "training load science, personal training load, strength workload, conditioning workload, workout readiness, Haris Falas training formula",
        ),
      },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": `${URL}#article`,
              url: URL,
              headline: "The Science Behind Training Load",
              description: DESCRIPTION,
              inLanguage: "en",
              author: { "@id": `${SITE}/haris-falas#person` },
              publisher: { "@id": `${SITE}/#organization` },
              isPartOf: { "@id": `${SITE}/#website` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Training Load Science",
                  item: URL,
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: TrainingLoadSciencePage,
});

const loadStates = [
  { title: "Low", description: "Meaningfully below your usual weekly load.", width: "w-1/4" },
  { title: "Moderate", description: "Broadly in line with your usual weekly load.", width: "w-1/2" },
  { title: "High", description: "Meaningfully above your usual weekly load.", width: "w-3/4" },
  { title: "Very High", description: "Far above your usual weekly load.", width: "w-full" },
] as const;

const measuredInputs = [
  {
    icon: Dumbbell,
    title: "Strength work",
    description:
      "Logged working sets and repetitions are measured. When an external weight is recorded, reps × kilograms also contributes to external volume.",
  },
  {
    icon: HeartPulse,
    title: "Conditioning work",
    description:
      "Logged working time, distance, rounds and completed intervals remain in their own units and are compared only with matching history.",
  },
  {
    icon: Gauge,
    title: "Effort",
    description:
      "Your session RPE can adjust the comparison when both the recent period and your baseline contain enough effort ratings.",
  },
];

function TrainingLoadSciencePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">Training Load Science</span>
        </nav>

        <PageHeader
          eyebrow="Performance science"
          icon={Activity}
          title={<>The science behind <span className="text-primary">training load</span></>}
          subtitle="A personal measure of the work you have actually recorded — designed to help you understand when your recent training is below, near or above your own normal level."
        />

        <section className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          <p>
            The SmartyGym training-load formula was created by Sports Scientist and Strength &amp; Conditioning Coach{" "}
            <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>.
            It translates the work you log into a clear training-management signal without pretending that one universal number can describe every person.
          </p>
          <p className="mt-4">
            Your body, training history and normal workload are individual. That is why SmartyGym compares you with your own recent training — never with a generic score table or another member.
          </p>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">What is measured</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Real work, in the units you logged</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {measuredInputs.map(({ icon: Icon, title, description }, index) => (
              <SmartyCard key={title} tone="blue" title={title} description={description}>
                <div className={`icon-tone-${index + 1} grid h-11 w-11 place-items-center rounded-lg border`}>
                  <Icon className="h-5 w-5" />
                </div>
              </SmartyCard>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
            Bodyweight repetitions are never converted into invented kilograms. Missing values are left missing, not treated as zero, and unlike measurements are never added together.
          </p>
        </section>

        <section className="mt-12 border-y border-border py-10 sm:mt-16 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">The comparison</p>
              <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Your last seven days versus your own baseline</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                SmartyGym totals comparable work from your most recent seven days, then compares it with your typical week across the preceding three weeks. A single unusual measurement cannot dominate the result because the middle of the available comparisons is used.
              </p>
            </div>
            <div className="space-y-4" aria-label="Training load states">
              {loadStates.map((state) => (
                <div key={state.title}>
                  <div className="mb-1 flex items-end justify-between gap-4">
                    <p className="text-sm font-bold">{state.title}</p>
                    <p className="text-right text-xs text-muted-foreground">{state.description}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-primary ${state.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Why it matters</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Context for better training decisions</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SmartyCard tone="blue" eyebrow="Balance" eyebrowIcon={Scale} title="See undertraining and sudden spikes" description="A personal baseline makes it easier to see when recent work has dropped well below normal or risen sharply above it, so training and recovery can be considered together." />
            <SmartyCard tone="blue" eyebrow="Timing" eyebrowIcon={Clock3} title="Understand the recent week" description="Training Load summarizes your current workload. The Last 10 Sessions graph complements it by showing how individual recorded sessions are changing over time." />
            <SmartyCard tone="blue" eyebrow="Readiness" eyebrowIcon={BarChart3} title="Turn records into useful context" description="Load, recent frequency, consecutive training days and logged effort inform your readiness indication. It supports training management; it does not diagnose health or injury." />
            <SmartyCard tone="blue" eyebrow="Integrity" eyebrowIcon={ShieldCheck} title="No confidence without evidence" description="When there is not enough comparable history, SmartyGym says Limited Data. It does not manufacture a confident result from thin or missing records." />
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">How accurate is it?</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">As accurate as the training you record</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The calculation is exact for the information entered: recorded sets, reps, external weight, time, distance, rounds, intervals and effort. Its usefulness grows as you log consistently and build comparable history. If a measure is not recorded, SmartyGym cannot infer it — and deliberately does not try.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Training Load and Readiness are coaching indicators, not medical assessments. Pain, illness, injury or unusual symptoms should be considered separately with an appropriate healthcare professional.
          </p>
        </section>
      </div>
    </main>
  );
}