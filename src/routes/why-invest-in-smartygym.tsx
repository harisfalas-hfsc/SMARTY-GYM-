import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Brain,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Smile,
  Target,
  Shield,
  Home,
  Briefcase,
  Award,
  BarChart3,
  BookOpen,
  ExternalLink,
  Dumbbell,
  Sparkles,
  Calculator,
  Zap,
  CheckCircle2,
  Smartphone,
  Plane,
  Timer,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { exportBrandPagePdf } from "@/lib/brand-page-export";

export const Route = createFileRoute("/why-invest-in-smartygym")({
  head: () => ({
    meta: [
      { title: "Why Invest in SmartyGym | Structured Fitness" },
      { name: "robots", content: "noindex, follow" },
      {
        name: "description",
        content:
          "Explore structured training, exercise science and the benefits of a consistent fitness routine with SmartyGym.",
      },
      {
        name: "keywords",
        content: withExtendedKeywords(
          "/why-invest-in-smartygym",
          "why invest in SmartyGym, fitness research, structured workout programs, exercise science, fitness results, SmartyGym",
        ),
      },
      { property: "og:title", content: "Why Invest in SmartyGym | Structured Fitness" },
      {
        property: "og:description",
        content: "Explore the role of consistent, structured exercise in fitness and wellbeing.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://smartygym.com/why-invest-in-smartygym" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/why-invest-in-smartygym" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: "Why Invest in SmartyGym",
              description:
                "A look at structured exercise, consistency and fitness in everyday life.",
              url: "https://smartygym.com/why-invest-in-smartygym",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              author: { "@id": "https://smartygym.com/haris-falas#person" },
              publisher: { "@id": "https://smartygym.com/#organization" },
              about: [
                "fitness research",
                "exercise science",
                "structured training",
                "mental health",
                "progressive overload",
              ],
              audience: "people interested in structured fitness training",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "About",
                  item: "https://smartygym.com/about",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Why Invest in SmartyGym",
                  item: "https://smartygym.com/why-invest-in-smartygym",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: WhyInvestInSmartyGym,
});

// Chart data based on real research
const mentalHealthData = [
  { condition: "Anxiety", withExercise: 25, withoutExercise: 48 },
  { condition: "Depression", withExercise: 20, withoutExercise: 42 },
  { condition: "Stress", withExercise: 35, withoutExercise: 62 },
  { condition: "Sleep Issues", withExercise: 22, withoutExercise: 45 },
];

const consistencyResultsData = [
  { week: "Week 1", structured: 5, unstructured: 5 },
  { week: "Week 4", structured: 20, unstructured: 12 },
  { week: "Week 8", structured: 45, unstructured: 18 },
  { week: "Week 12", structured: 75, unstructured: 22 },
  { week: "Week 24", structured: 120, unstructured: 28 },
];

const adherenceData = [
  { name: "Expert-Guided Training", value: 67, fill: "#22c55e" },
  { name: "Self-Guided Training", value: 23, fill: "#f59e0b" },
  { name: "Generic Apps", value: 10, fill: "#94a3b8" },
];

const inactivityColors = ["#fbbf24", "#fb923c", "#f97316", "#ef4444", "#dc2626"];

const inactivityByAgeData = [
  { age: "18-29", percentage: 27 },
  { age: "30-44", percentage: 31 },
  { age: "45-64", percentage: 35 },
  { age: "65-74", percentage: 38 },
  { age: "75+", percentage: 52 },
];

function WhyInvestInSmartyGym() {
  const [exporting, setExporting] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    setExporting(true);
    try {
      if (!pdfContentRef.current) throw new Error("The guide is not ready.");
      await exportBrandPagePdf("investment", pdfContentRef.current);
      toast.success("Your SmartyGym PDF is ready.");
    } catch {
      toast.error("The PDF could not be prepared. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-4xl px-4 py-8 md:max-w-[1200px] md:px-6">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:text-sm [&>*]:whitespace-nowrap"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/about" className="hover:text-primary">
            About SmartyGym
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">Why Invest in SmartyGym</span>
        </nav>

        <div ref={pdfContentRef}>
        {/* Header */}
        <div data-pdf-block className="mb-8 text-center">
          <div className="mb-2 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold sm:text-4xl">
              Why Invest in <span className="text-primary">SmartyGym</span>
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            The science behind structured fitness and lasting transformation
          </p>
          <Button data-pdf-exclude type="button" variant="outline" className="mt-5 gap-2" onClick={downloadPdf} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Preparing PDF" : "Download this guide as PDF"}
          </Button>
        </div>

        {/* Description Card */}
        <Card data-pdf-block className="mb-8 border-2 border-primary/30">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Your Body, Your Greatest Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              In a world of endless fitness advice on YouTube, conflicting information on social
              media, and generic gym memberships that lead nowhere, finding a structured path to
              real results has never been harder. This research explores why expert-designed,
              human-crafted fitness delivers transformative results—and how{" "}
              <span className="font-bold text-primary">SmartyGym</span> provides the ecosystem you
              need to elevate every aspect of your performance.
            </p>
          </CardContent>
        </Card>

        {/* Main Research Content Card */}
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="space-y-10 p-6 sm:p-8">
            {/* Section 1: Foundation of Human Performance */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">The Foundation of Human Performance</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Physical fitness isn&apos;t just about looking good—it&apos;s the bedrock upon
                  which all other performance is built. Research from the{" "}
                  <strong>American College of Sports Medicine</strong> consistently shows that
                  regular exercise improves cognitive function, emotional regulation, and energy
                  levels across all age groups.
                </p>
                <p>
                  According to a <strong>Harvard Medical School</strong> study, just 20 minutes of
                  moderate exercise can boost brain function for up to 12 hours afterward. The
                  implications for work productivity, parenting patience, and creative pursuits are
                  profound.
                </p>
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">23%</div>
                    <div className="text-sm text-muted-foreground">
                      Increase in cognitive performance
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">32%</div>
                    <div className="text-sm text-muted-foreground">
                      Boost in creative problem-solving
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">40%</div>
                    <div className="text-sm text-muted-foreground">
                      Improvement in stress resilience
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Exercise & Mental Health Chart */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Smile className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Exercise &amp; Mental Health</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  The <strong>National Institute of Mental Health</strong> and countless
                  peer-reviewed studies have established that regular physical activity is one of
                  the most effective interventions for mental health—often matching or exceeding the
                  effects of medication for mild to moderate conditions.
                </p>
                <div className="my-6 rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-4 text-center font-semibold">
                    Mental Health Symptoms: Exercisers vs. Non-Exercisers
                  </h3>
                  <p className="mb-4 text-center text-xs text-muted-foreground">
                    Percentage reporting significant symptoms
                  </p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mentalHealthData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="condition"
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        />
                        <YAxis
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                          dataKey="withExercise"
                          name="With Regular Exercise"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="withoutExercise"
                          name="Without Exercise"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Source: American Psychological Association / NIMH Research
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: The Modern Fitness Challenge */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">The Modern Fitness Challenge</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Despite knowing that exercise is beneficial, most people struggle to maintain a
                  consistent routine. The reasons are systemic, not personal failures:
                </p>
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Smartphone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Information Overload</strong>
                      <span className="text-sm text-muted-foreground">
                        YouTube, Instagram, TikTok—endless conflicting advice with no coherent
                        philosophy
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Target className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Lack of Structure</strong>
                      <span className="text-sm text-muted-foreground">
                        Random workouts without progressive overload or long-term planning
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Time Scarcity</strong>
                      <span className="text-sm text-muted-foreground">
                        Work, family, commute—no time for a &quot;real&quot; gym routine
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Plane className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Accessibility Gaps</strong>
                      <span className="text-sm text-muted-foreground">
                        Traveling? No equipment? The routine breaks down
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Consistency Science */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">
                  The Science of Consistency &amp; Progressive Overload
                </h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Research from the <strong>Journal of Strength and Conditioning</strong>{" "}
                  demonstrates that structured training with progressive overload produces results
                  3-5x greater than random workouts over a 24-week period.
                </p>
                <div className="my-6 rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-4 text-center font-semibold">
                    Fitness Gains: Structured vs. Self-Guided
                  </h3>
                  <p className="mb-4 text-center text-xs text-muted-foreground">
                    Performance improvement score over time
                  </p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={consistencyResultsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="structured"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                          name="Structured Training"
                        />
                        <Line
                          type="monotone"
                          dataKey="unstructured"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                          name="Self-Guided"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Source: Journal of Strength and Conditioning Research
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Adherence Rates */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Why Expert-Designed Training Wins</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  The <strong>RAND Corporation</strong> study on fitness program adherence found
                  that training designed by certified experts with clear progression has
                  dramatically higher completion rates than self-guided alternatives.
                </p>
                <div className="my-6 rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-4 text-center font-semibold">
                    12-Week Training Completion Rates
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adherenceData}
                          cx="50%"
                          cy="42%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ value }) => `${value}%`}
                        >
                          {adherenceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Source: RAND Corporation Wellness Study
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Impact on Life Roles */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Performance Across Life Roles</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Your fitness doesn&apos;t exist in isolation. When you invest in structured
                  training, the benefits cascade across every role you play:
                </p>
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <Briefcase className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <strong className="block text-primary">As an Employee</strong>
                      <span className="text-sm text-muted-foreground">
                        Higher energy, sharper focus, fewer sick days, better stress management,
                        increased creativity
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <Home className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <strong className="block text-primary">As a Parent</strong>
                      <span className="text-sm text-muted-foreground">
                        More patience, energy to play with kids, modeling healthy habits, emotional
                        regulation
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <Heart className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <strong className="block text-primary">In Relationships</strong>
                      <span className="text-sm text-muted-foreground">
                        Better mood, increased confidence, shared fitness activities, improved
                        intimacy
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <Target className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <strong className="block text-primary">In Your Hobbies</strong>
                      <span className="text-sm text-muted-foreground">
                        Better sports performance, outdoor endurance, recreational activities,
                        travel readiness
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* The Online Fitness Platform Revolution */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">The Online Fitness Platform Revolution</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Training has moved online. Millions of people now train at home, in hotel rooms
                  and in parks, guided by a screen instead of a membership card. Online fitness
                  platforms removed the commute, the fixed class times and the high monthly fees of
                  traditional gyms, and made expert coaching available to anyone, anywhere.
                </p>
                <p>
                  But not all platforms are equal. Some are built around expensive hardware, some
                  rely on algorithm-generated workouts, and many offer endless content without
                  structure. <span className="font-bold text-primary">SmartyGym</span> was built to
                  combine the freedom of online training with the structure of real coaching: every
                  workout is designed by <strong>Haris Falas</strong>, periodized, and available on
                  any device, with or without equipment.
                </p>
                <p>
                  See how the leading platforms compare — their strengths, their weaknesses, and
                  where SmartyGym stands among them.
                </p>
                <Link
                  to="/best-online-fitness-platform"
                  className="inline-flex items-center gap-1 font-semibold text-green-600 hover:underline dark:text-green-500"
                >
                  Best Online Fitness Platforms 2026
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            {/* Section 7: The SmartyGym Ecosystem */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">
                  The <span className="text-primary">SmartyGym</span> Ecosystem
                </h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  Unlike fragmented resources scattered across the internet,{" "}
                  <span className="font-bold text-primary">SmartyGym</span> provides a complete,
                  integrated ecosystem designed by <strong>Haris Falas</strong>—a Sports Scientist
                  with 25+ years of coaching experience and CSCS certification. Every component
                  works together under one philosophy.
                </p>
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Dumbbell className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Smarty Coach</strong>
                      <span className="text-sm text-muted-foreground">
                        Deterministic, rule-based workouts built around your goal, experience, time
                        and equipment with zero AI credits
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Activity className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Workout of the Day</strong>
                      <span className="text-sm text-muted-foreground">
                        A daily periodized plan that develops every fitness quality in the right
                        order
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Build It Yourself</strong>
                      <span className="text-sm text-muted-foreground">
                        Choose and arrange your own exercises, then save the workout to your Logbook
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <BookOpen className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Exercise Library</strong>
                      <span className="text-sm text-muted-foreground">
                        1,384 movements with demonstrations, plus your own likes and dislikes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Calculator className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Smarty Tools</strong>
                      <span className="text-sm text-muted-foreground">
                        Workout timer, rounds tracker and 1RM calculator for data-driven training
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Users className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Smarty Community</strong>
                      <span className="text-sm text-muted-foreground">
                        Shared workouts, rankings and comments that keep you accountable
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Logbook &amp; Progress</strong>
                      <span className="text-sm text-muted-foreground">
                        Every session logged, rated and compared so progress is always visible
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Heart className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Smarty Check-ins &amp; Ritual</strong>
                      <span className="text-sm text-muted-foreground">
                        Morning readiness, evening recovery and a focused daily wellbeing practice
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <strong className="block">Training Load &amp; Progress PDF</strong>
                      <span className="text-sm text-muted-foreground">
                        Personal load comparisons, graphs, awards and a complete date-range report
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <strong className="text-red-600 dark:text-red-400">100% Human. 0% AI.</strong>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coaching rules, workout examples and educational content come from real
                    expertise. Smarty Coach applies that system deterministically without using AI
                    credits.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8: Physical Inactivity Crisis */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-destructive/20 p-2">
                  <Activity className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">The Physical Inactivity Crisis</h2>
              </div>
              <div className="space-y-4 border-l-2 border-destructive/30 pl-4">
                <p>
                  The <strong>World Health Organization</strong> reports that physical inactivity is
                  the fourth leading risk factor for global mortality, accounting for 6% of deaths
                  worldwide. The data shows that inactivity increases with age—but structured
                  training can reverse this trend at any stage of life.
                </p>
                <div className="my-6 rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-4 text-center font-semibold">
                    Physical Inactivity Rates by Age Group
                  </h3>
                  <p className="mb-4 text-center text-xs text-muted-foreground">
                    Percentage not meeting WHO activity guidelines
                  </p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={inactivityByAgeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="age"
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        />
                        <YAxis
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        />
                        <Tooltip />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]} name="Inactive %">
                          {inactivityByAgeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={inactivityColors[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Source: World Health Organization Global Status Report
                  </p>
                </div>
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
                    <div className="text-3xl font-bold text-destructive">1.4B</div>
                    <div className="text-sm text-muted-foreground">
                      Adults globally are insufficiently active
                    </div>
                  </div>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
                    <div className="text-3xl font-bold text-destructive">$54B</div>
                    <div className="text-sm text-muted-foreground">
                      Annual global healthcare costs from inactivity
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9: Accessibility */}
            <section data-pdf-block>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Fitness Anywhere, Anytime</h2>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                <p>
                  <span className="font-bold text-primary">SmartyGym</span> eliminates every excuse.
                  Whether you&apos;re at home, in a hotel, at the gym, or outdoors—there&apos;s a
                  workout designed for your situation:
                </p>
                <div className="my-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
                    <Home className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Home</span>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
                    <Plane className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Travel</span>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
                    <Dumbbell className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Gym</span>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
                    <Timer className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">15-60 min</span>
                  </div>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card data-pdf-block className="mt-8 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background">
          <CardContent className="p-6 text-center">
            <Dumbbell className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-2xl font-bold">Ready to Transform Your Performance?</h2>
            <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
              Elevate your work, family life, and wellbeing with{" "}
              <span className="font-bold text-primary">SmartyGym</span>&apos;s expert-designed
              ecosystem.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/create-your-own-workout">
                  <Sparkles className="h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/wod">
                  <Dumbbell className="h-5 w-5" />
                  Workout of the Day
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* References Section */}
        <Card data-pdf-block className="mt-8 border border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              References &amp; Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>
                  World Health Organization (2022).{" "}
                  <em>Global Status Report on Physical Activity 2022.</em>{" "}
                  <a
                    href="https://www.who.int/publications/i/item/9789240059153"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    WHO Publications <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>
                  American College of Sports Medicine (2023).{" "}
                  <em>Exercise and Cognitive Function: A Review of Evidence.</em>{" "}
                  <a
                    href="https://www.acsm.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    ACSM <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>
                  Harvard Medical School (2021).{" "}
                  <em>Exercise and the Brain: How Physical Activity Boosts Your Mental Muscles.</em>{" "}
                  <a
                    href="https://www.health.harvard.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Harvard Health <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.</span>
                <span>
                  American Psychological Association (2024).{" "}
                  <em>Stress in America Survey: Exercise and Mental Health.</em>{" "}
                  <a
                    href="https://www.apa.org/news/press/releases/stress"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    APA Research <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">5.</span>
                <span>
                  National Institute of Mental Health (2023).{" "}
                  <em>Physical Activity as Treatment for Depression and Anxiety.</em>{" "}
                  <a
                    href="https://www.nimh.nih.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    NIMH <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.</span>
                <span>
                  Journal of Strength and Conditioning Research (2022).{" "}
                  <em>Progressive Overload and Long-Term Training Adaptations.</em>{" "}
                  <a
                    href="https://journals.lww.com/nsca-jscr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    JSCR <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">7.</span>
                <span>
                  RAND Corporation (2020).{" "}
                  <em>
                    Workplace Wellness Programs: Services Offered, Participation, and Incentives.
                  </em>{" "}
                  <a
                    href="https://www.rand.org/pubs/research_reports/RR254.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    RAND Research <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">8.</span>
                <span>
                  British Journal of Sports Medicine (2023).{" "}
                  <em>Exercise as Medicine: Evidence for Prescribing Exercise.</em>{" "}
                  <a
                    href="https://bjsm.bmj.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    BJSM <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}
