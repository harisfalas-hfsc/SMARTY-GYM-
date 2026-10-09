import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Dumbbell,
  CalendarDays,
  Wrench,
  BookOpen,
  Users,
  Newspaper,
  ClipboardList,
  ChevronRight,
  Award,
  BarChart3,
  Activity,
  Waves,
  Mountain,
  Timer,
  Baby,
  Plane,
  Briefcase,
  Star,
  LineChart as LineChartIcon,
  Goal,
  Smartphone,
  Sparkles,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  LineChart,
  CartesianGrid,
} from "recharts";
import { exportBrandPagePdf } from "@/lib/brand-page-export";
import { iconTone } from "@/lib/icon-tone";
import { REPORT_LINE_WIDTH, REPORT_DOT_RADIUS } from "@/lib/report-chart";

export const Route = createFileRoute("/the-smarty-method")({
  head: () => ({
    meta: [
      { title: "The Smarty Method | SmartyGym Performance System" },
      {
        name: "description",
        content:
          "Discover The Smarty Method — a complete performance system designed by Strength & Conditioning Coach Haris Falas. Science-based workouts and intelligent periodization.",
      },
      {
        name: "keywords",
        content: withExtendedKeywords(
          "/the-smarty-method",
          "the smarty method, smartygym performance system, periodization, workout structure, strength and conditioning method, science based training",
        ),
      },
      { property: "og:title", content: "The Smarty Method | SmartyGym" },
      {
        property: "og:description",
        content:
          "More than workouts. A complete performance system built on science, experience, and intelligent periodization.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/the-smarty-method" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/the-smarty-method" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              url: "https://smartygym.com/the-smarty-method",
              name: "The Smarty Method | SmartyGym Performance System",
              description:
                "A complete performance system designed by Strength & Conditioning Coach Haris Falas, built on science and intelligent periodization.",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              about: { "@id": "https://smartygym.com/haris-falas#person" },
              publisher: { "@id": "https://smartygym.com/#organization" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "The Smarty Method",
                  item: "https://smartygym.com/the-smarty-method",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: TheSmartyMethod,
});

const SG = () => <span className="font-semibold text-primary">SmartyGym</span>;

const progressData = [
  { week: "W1", value: 40 },
  { week: "W2", value: 48 },
  { week: "W3", value: 52 },
  { week: "W4", value: 58 },
  { week: "W5", value: 55 },
  { week: "W6", value: 63 },
  { week: "W7", value: 68 },
  { week: "W8", value: 75 },
];

const cardAccentBorders = [
  "border-blue-500/45",
  "border-green-500/45",
  "border-amber-500/45",
  "border-purple-500/45",
  "border-rose-500/45",
  "border-cyan-500/45",
  "border-orange-500/45",
  "border-pink-500/45",
];

const wodPeriodizationCards = [
  {
    icon: Activity,
    title: "Different Energy System Daily",
    description:
      "Each day of the week targets a different energy system — aerobic, anaerobic, phosphagen. Your body is challenged in every way it needs to be.",
  },
  {
    icon: Waves,
    title: "All Fitness Parameters Covered",
    description:
      "Strength, cardio, mobility, metabolic conditioning, stability, recovery. Every parameter a human body needs is addressed within each weekly cycle.",
  },
  {
    icon: Baby,
    title: "Designed for Real Life",
    description:
      "Whether you're a parent, a traveler, a busy professional, or a student — the Workout of the Day handles the planning so you don't have to.",
  },
  {
    icon: Mountain,
    title: "Progressive & Purposeful",
    description:
      "No random workouts. Each day builds on the previous one. Each week follows a structured plan. Every session has a clear objective.",
  },
  {
    icon: Timer,
    title: "Time-Efficient Programming",
    description:
      "Sessions designed to deliver maximum results in realistic timeframes. Because your time is valuable and every minute must count.",
  },
  {
    icon: Smartphone,
    title: "Total Convenience",
    description:
      "Train anywhere, anytime. Access workouts, tracking, and tools from your pocket — no spreadsheets, no guesswork.",
  },
];

const workoutStructure = [
  {
    step: "01",
    title: "Clear Objective",
    description:
      "Every session starts with a defined goal — strength, calorie burning, metabolic conditioning, cardio, mobility and stability, challenge, pilates, or recovery.",
  },
  {
    step: "02",
    title: "Warm-Up & Activation",
    description:
      "Targeted preparation that primes your muscles, joints, and nervous system for the work ahead.",
  },
  {
    step: "03",
    title: "Primary Training Block",
    description:
      "The core of the session — structured sets, reps, and intensities aligned with the session's objective.",
  },
  {
    step: "04",
    title: "Finisher Conditioning",
    description:
      "A focused finishing block designed to push capacity, burn calories, or reinforce the session's training effect.",
  },
  {
    step: "05",
    title: "Cool-Down & Recovery",
    description:
      "Guided cool-down protocols to promote recovery, reduce soreness, and prepare your body for the next session.",
  },
];

const ecosystemItems = [
  {
    icon: CalendarDays,
    title: "Workout of the Day",
    description:
      "A fresh, professionally designed workout delivered daily. Structured, purposeful, and aligned with a periodized weekly plan — never random.",
    link: "/wod",
  },
  {
    icon: Dumbbell,
    title: "Smarty Coach",
    description:
      "Rule-based personal sessions created deterministically from your goal, experience, time and equipment — with no AI credits used.",
    link: "/create-your-own-workout",
  },
  {
    icon: Sparkles,
    title: "Build It Yourself",
    description:
      "Choose, organize and name your own exercises from the library, then save the finished workout directly to your Logbook.",
    link: "/create-your-own-workout",
  },
  {
    icon: Wrench,
    title: "Smarty Tools",
    description:
      "Performance tools — workout timer, rounds tracker, and 1RM calculator — designed to support data-driven decisions.",
    link: "/tools",
  },
  {
    icon: BookOpen,
    title: "Exercise Library",
    description:
      "A curated, professional exercise database with proper demonstrations. Ensuring correct technique and movement quality.",
    link: "/exercise-library",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "A motivating digital environment where members support each other, share progress, and stay accountable.",
    link: "/community",
  },
  {
    icon: Newspaper,
    title: "Blog",
    description:
      "Educational content focused on fitness, health, performance, and lifestyle optimization. Written by professionals, not generated by machines.",
    link: "/blog",
  },
  {
    icon: Activity,
    title: "Smarty Check-ins & Ritual",
    description:
      "Morning readiness, evening recovery and a focused daily ritual add useful context beyond the workout itself.",
    link: "/smarty-checkins",
  },
  {
    icon: Users,
    title: "Shared Workouts",
    description:
      "Discover member-created workouts, then like, rate, comment or add one to your own Logbook while personal records stay private.",
    link: "/shared-workouts",
  },
];

const logbookFeatures = [
  {
    icon: Goal,
    title: "Goal Setting",
    description:
      "Define clear, measurable goals. Track your targets and milestones. Know exactly where you're heading and why.",
  },
  {
    icon: ClipboardList,
    title: "Workout Logging",
    description:
      "Record every session — exercises, sets, reps, weights. Build a complete training journal that becomes your most valuable coaching tool.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Monitor your training load, 1RM progress, and workout completions over time with clear visual data.",
  },
  {
    icon: Star,
    title: "Session Rating",
    description:
      "Rate each session, leave notes, track energy and mood. Understand patterns that drive your best — and worst — performances.",
  },
  {
    icon: Download,
    title: "Progress PDF",
    description:
      "Choose a date range and export your score, rank, workout analytics, performance, check-ins and awards in one branded report.",
  },
];

const audienceSegments = [
  {
    icon: Briefcase,
    title: "Busy Professionals",
    description:
      "Your schedule is packed. You need a professional system that delivers results in the time you actually have — not the time you wish you had.",
  },
  {
    icon: Baby,
    title: "Parents",
    description:
      "Between school runs, bedtimes, and everything in between — fitness has to fit your life. Not the other way around.",
  },
  {
    icon: Plane,
    title: "Travelers",
    description:
      "Airports, hotels, different time zones. Your gym travels with you. No equipment dependency, no excuses, no disruption.",
  },
  {
    icon: Dumbbell,
    title: "Gym-Goers",
    description:
      "You have a gym membership — but do you have a plan? Structured programming in your pocket changes everything.",
  },
  {
    icon: Award,
    title: "Beginners",
    description:
      "Starting is the hardest part. You need safe, structured guidance from a qualified professional — not random YouTube videos.",
  },
  {
    icon: TrendingUp,
    title: "Experienced Lifters",
    description:
      "You've been training for years. You need intelligent periodization and fresh programming to break through plateaus.",
  },
];

function TheSmartyMethod() {
  const [exporting, setExporting] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    setExporting(true);
    try {
      if (!pdfContentRef.current) throw new Error("The guide is not ready.");
      await exportBrandPagePdf("method", pdfContentRef.current);
      toast.success("The Smarty Method PDF is ready.");
    } catch {
      toast.error("The PDF could not be prepared. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:max-w-[1200px] md:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:text-sm [&>*]:whitespace-nowrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/about" className="hover:text-primary lg:hidden">About SmartyGym</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 lg:hidden" />
          <span className="text-foreground">The Smarty Method</span>
        </nav>

        <div ref={pdfContentRef}>
        {/* Hero / Introduction */}
        <section data-pdf-block className="mb-16 text-center">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            More Than Workouts.{" "}
            <span className="text-primary">A Complete Performance System.</span>
          </h1>
          <p className="mx-auto max-w-3xl leading-relaxed text-muted-foreground">
            <SG /> is not a collection of random workouts. It is a structured ecosystem designed by
            Strength and Conditioning Coach{" "}
            <Link to="/haris-falas" className="font-semibold text-primary hover:underline">
              Haris Falas
            </Link>
            , built on science, real-world coaching experience, and intelligent periodization. Every
            element serves a purpose. Every session has a goal.
          </p>
          <Button data-pdf-exclude type="button" className="mt-6 gap-2 shadow-primary" onClick={downloadPdf} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Preparing PDF" : "Download The Smarty Method PDF"}
          </Button>
        </section>

        {/* The Expertise Behind the System */}
        <section data-pdf-block className="mb-16">
          <Card className="border-primary/40">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Award className="h-7 w-7 flex-shrink-0 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">The Expertise Behind the System</h2>
              </div>
              <div className="space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  <Link to="/haris-falas" className="font-semibold text-primary hover:underline">
                    Haris Falas
                  </Link>{" "}
                  is a qualified Strength and Conditioning Coach with a degree in Sports Science and
                  years of hands-on experience in the fitness industry — from personal training and
                  group coaching to program design and athlete preparation.
                </p>
                <p>
                  That experience shaped <SG />. Every workout and every tool reflects a coaching
                  philosophy rooted in <strong className="text-foreground">precision</strong>,{" "}
                  <strong className="text-foreground">leadership</strong>, and{" "}
                  <strong className="text-foreground">long-term thinking</strong>. This is not
                  content created for clicks. It is training architecture designed for results.
                </p>
                <p>
                  The difference between a workout you found online and a workout from <SG /> is the
                  difference between guessing and knowing. When a professional designs your
                  training, every variable is accounted for.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* WOD: Smart Periodization */}
        <section data-pdf-block className="mb-16">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
            Workout of the Day: Smart Periodization
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
            The <SG /> Workout of the Day is not a random daily workout. It is part of a carefully
            designed weekly periodization cycle that ensures every energy system, every fitness
            parameter, and every aspect of human performance is covered — week after week.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wodPeriodizationCards.map((item, index) => (
              <Card key={item.title} className={`${cardAccentBorders[index % cardAccentBorders.length]} transition-colors`}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`${iconTone(index)} grid h-9 w-9 shrink-0 place-items-center rounded-lg border`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How We Build Our Workouts */}
        <section data-pdf-block className="mb-16">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">How We Build Our Workouts</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
            Every session follows a deliberate structure. Nothing is left to chance.
          </p>
          <div className="space-y-4">
            {workoutStructure.map((item, index) => (
              <Card key={item.step} className={`${cardAccentBorders[(index + 2) % cardAccentBorders.length]} transition-colors`}>
                <CardContent className="flex items-start gap-4 p-5">
                  <span className={`${iconTone(index + 2)} grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border text-sm font-bold`}>{item.step}</span>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* The Smarty Ecosystem */}
        <section data-pdf-block className="mb-16">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">The Smarty Ecosystem</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
            A complete, interconnected system where every component supports your progress.
          </p>
          <div className="grid grid-cols-1 gap-6">
            {ecosystemItems.map((item, index) => (
              <Link to={item.link} key={item.title} className="group">
                <Card className={`h-full ${cardAccentBorders[index % cardAccentBorders.length]} transition-all group-hover:shadow-lg`}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`${iconTone(index)} grid h-9 w-9 shrink-0 place-items-center rounded-lg border`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* The Logbook and Tracking System */}
        <section data-pdf-block className="mb-16">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">The Logbook &amp; Tracking System</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
            What gets measured gets managed. Without tracking, you&apos;re guessing. With <SG />,
            you&apos;re building a data-driven training journal that turns effort into measurable
            progress.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {logbookFeatures.map((item, index) => (
              <Card key={item.title} className={`${cardAccentBorders[(index + 4) % cardAccentBorders.length]} transition-colors`}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`${iconTone(index + 4)} grid h-9 w-9 shrink-0 place-items-center rounded-lg border`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-8 flex justify-center">
            <Link to="/training-load-science" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
              Discover the training load science <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Progress chart */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Strength Progress</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Line type="linear" dataKey="value" stroke="var(--chart-1)" strokeWidth={REPORT_LINE_WIDTH} dot={{ r: REPORT_DOT_RADIUS }} activeDot={{ r: 3 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Track your lifts and see your strength grow over time.
                </p>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Closing Section — The Why */}
        <section data-pdf-block className="mb-8">
          <Card className="border-primary">
            <CardContent className="p-6 text-center sm:p-10">
              <h2 className="mb-6 text-2xl font-bold sm:text-3xl md:text-4xl">
                Built to Win. <span className="text-primary">Built to Last.</span>
              </h2>

              <div className="mx-auto mb-10 max-w-3xl space-y-4 text-left leading-relaxed text-muted-foreground">
                <p>
                  The world is changing. Everything is moving online — education, work, healthcare.
                  Fitness is no exception. The future of training is{" "}
                  <strong className="text-foreground">hybrid</strong>: combining the best of digital
                  programming with real-world effort. <SG /> was built for that future.
                </p>
                <p>
                  Life is busier than it has ever been. Between demanding jobs, raising children,
                  traveling, managing stress, and trying to stay healthy — most people don&apos;t
                  have the luxury of spending two hours at a gym figuring out what to do. They need a{" "}
                  <strong className="text-foreground">system</strong>. A professional, structured
                  plan that fits in their pocket, adapts to their schedule, and delivers real
                  results.
                </p>
                <p>
                  That&apos;s why <SG /> exists. Not because the world needed another fitness app.
                  But because it needed a{" "}
                  <strong className="text-foreground">professional coaching platform</strong> —
                  designed by a real Strength and Conditioning Coach — that makes structured,
                  science-based training accessible to everyone, everywhere, at any time.
                </p>
                <p>
                  Even if you go to a gym every day, having a structured plan in your pocket changes
                  everything. No more guesswork. No more wasted sessions. No more wondering if what
                  you&apos;re doing is actually working. <SG /> is the coach you carry with you —{" "}
                  <strong className="text-foreground">always ready, always planned, always professional</strong>.
                </p>
              </div>

              <h3 className="mb-6 text-xl font-bold">
                Who is <SG /> For?
              </h3>
              <div className="mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {audienceSegments.map((seg, index) => (
                  <div
                    key={seg.title}
                    className={`flex items-start gap-3 rounded-lg border bg-background/50 p-4 text-left ${cardAccentBorders[(index + 1) % cardAccentBorders.length]}`}
                  >
                    <div className={`${iconTone(index + 1)} grid h-9 w-9 shrink-0 place-items-center rounded-lg border`}>
                      <seg.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold">{seg.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{seg.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button asChild size="lg">
                <Link to="/create-your-own-workout">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </main>
  );
}
