import { createFileRoute, Link } from "@tanstack/react-router";
import { faqSchema, READINESS_FAQ } from "@/lib/seo/faq";
import {
  Activity,
  BedDouble,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  Flame,
  Gauge,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const SITE = "https://smartygym.com";
const URL = `${SITE}/readiness-science`;
const TITLE = "The Science Behind Readiness | SmartyGym";
const DESCRIPTION =
  "Learn what readiness means in SmartyGym and how your live 0–10 score is calculated from recent workouts, Training Load, training streaks and your morning check-in.";

export const Route = createFileRoute("/readiness-science")({
  head: () => ({
    meta: [
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
              headline: "The Science Behind Readiness",
              keywords: "readiness score, training readiness, recovery score, workout readiness, sleep and soreness, training fatigue, training load and readiness, morning check-in, Haris Falas",
              about: { "@type": "Thing", name: "Training readiness and recovery" },
              mainEntityOfPage: URL,
              description: DESCRIPTION,
              inLanguage: "en",
              author: { "@id": `${SITE}/haris-falas#person` },
              publisher: { "@id": `${SITE}/#organization` },
              isPartOf: { "@id": `${SITE}/#website` },
            },
            faqSchema(URL, READINESS_FAQ),
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                { "@type": "ListItem", position: 2, name: "Readiness Science", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: ReadinessSciencePage,
});

const inputs = [
  {
    icon: Flame,
    title: "Recent workout fatigue",
    description:
      "Every workout you completed in the last 72 hours leaves fatigue based on its duration, difficulty and the effort (RPE) you logged. It is largest straight after the session and halves roughly every 12 hours as you recover. Recovery and mobility sessions count as light.",
  },
  {
    icon: Activity,
    title: "7-day Training Load",
    description:
      "Your last seven days compared with your own normal weeks. A High Training Load lowers readiness by 1 point and Very High by 2 — accumulated work still matters even when your last session was days ago.",
  },
  {
    icon: CalendarRange,
    title: "Training streak",
    description: "Six or more training days in a row lower readiness by 2 points, because the body also needs days without training to adapt.",
  },
  {
    icon: BedDouble,
    title: "Sleep",
    description: "Short or poor-quality sleep from your morning check-in lowers readiness in proportion to how far it falls below a restful night.",
  },
  {
    icon: HeartPulse,
    title: "Soreness",
    description: "Soreness above 3 out of 10 in your morning check-in lowers readiness — the more sore you feel, the larger the effect.",
  },
  {
    icon: Gauge,
    title: "How ready you feel",
    description: "Your own self-rating below 7 out of 10 lowers the score. How you feel is real information, and it is respected.",
  },
];

const bands = [
  { title: "8–10 · Ready", description: "Green — you are recovered and ready to train.", tone: "text-emerald-600", width: "w-full" },
  { title: "4–7 · Moderate", description: "Blue — train, but with sensible intensity.", tone: "text-primary", width: "w-2/3" },
  { title: "0–3 · Recovery", description: "Red — recovery work or rest is the smart choice.", tone: "text-red-600", width: "w-1/4" },
] as const;

function ReadinessSciencePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">Readiness Science</span>
        </nav>

        <PageHeader
          eyebrow="Performance science"
          icon={Gauge}
          title={<>The science behind <span className="text-primary">readiness</span></>}
          subtitle="A live score from 0 to 10 that shows how ready you are to train right now — built from the training you actually did and how you actually feel."
          mobileSubtitle="Understand your live readiness score and what moves it."
        />

        <section className="mx-auto max-w-3xl">
          <div className="app-card relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="icon-tone-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">The philosophy</p>
                <h2 className="text-lg font-extrabold uppercase sm:text-xl">Created by Haris Falas</h2>
              </div>
            </div>
            <div className="relative mt-5 space-y-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              <p>
                The SmartyGym readiness model was created by Sports Scientist and Strength &amp; Conditioning Coach{" "}
                <Link to="/haris-falas" className="font-semibold text-primary">Haris Falas</Link>.
                Training only makes you better when your body can absorb it. Readiness answers one practical question before every session: how much can you take on today?
              </p>
              <p>
                It is a moment-in-time value, never an average. You start from fully ready and the score goes down only when there is real evidence — work you logged, load you accumulated, or answers you gave. Nothing is invented.
              </p>
              <p>
                Readiness and <Link to="/training-load-science" className="font-semibold text-primary">Training Load</Link> work together: Training Load measures the work accumulated over weeks, readiness shows how recovered you are right now, and a high Training Load lowers readiness.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">What moves the score</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Six real signals</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {inputs.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="app-card p-6">
                <div className="flex items-center gap-3">
                  <div className={`icon-tone-${(index % 5) + 1} grid h-11 w-11 shrink-0 place-items-center rounded-lg border`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{title}</h3>
                </div>
                <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <div className="app-card mx-auto mt-4 max-w-3xl px-5 py-4 text-center text-sm leading-6 text-muted-foreground">
            The check-in can lower readiness by up to 5 points in total. The final score is rounded and always stays between 0 and 10.
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Estimated or calibrated</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Your check-in completes the picture</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="app-card p-6">
              <div className="flex items-center gap-3">
                <div className="icon-tone-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
                  <Timer className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Estimated</h3>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                Before your morning check-in, you still see a score — calculated from your recent workouts, Training Load and training streak. It is marked Estimated, because your training data cannot know how you slept or how sore you feel.
              </p>
            </div>
            <div className="app-card p-6">
              <div className="flex items-center gap-3">
                <div className="icon-tone-3 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Calibrated</h3>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                Once you complete your morning check-in (open from 05:00 to 19:00), your sleep, soreness and self-rating are added and the score becomes calibrated. Check in before you train for the most accurate guidance.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Reading the score</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Three clear colours</h2>
          </div>
          <div className="app-card mx-auto mt-6 max-w-3xl space-y-4 p-6">
            {bands.map((band) => (
              <div key={band.title}>
                <div className="mb-1 flex items-end justify-between gap-4">
                  <p className={`text-sm font-bold ${band.tone}`}>{band.title}</p>
                  <p className="text-right text-xs text-muted-foreground">{band.description}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-primary ${band.width}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="app-card p-6">
              <div className="flex items-center gap-3">
                <div className="icon-tone-4 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">One score everywhere</h3>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                The same readiness appears in your homepage briefing, Insights, Training Load and Smarty Coach, and Smarty Coach uses it to choose the right intensity for today.
              </p>
            </div>
            <div className="app-card p-6">
              <div className="flex items-center gap-3">
                <div className="icon-tone-5 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">A coaching indicator, not a diagnosis</h3>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                Readiness supports training decisions; it does not assess health or injury. Pain, illness or unusual symptoms should be considered separately with an appropriate healthcare professional.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
