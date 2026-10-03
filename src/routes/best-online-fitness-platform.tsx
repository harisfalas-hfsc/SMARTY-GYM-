import { createFileRoute, Link } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, ChevronRight } from "lucide-react";

type Platform = {
  name: string;
  url: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  highlight?: boolean;
};

const PLATFORMS: Platform[] = [
  {
    name: "Peloton",
    url: "https://www.onepeloton.com",
    summary:
      "The best-known connected-fitness brand, famous for its bikes and treadmills and a large library of live and on-demand classes led by high-energy instructors.",
    strengths: [
      "Huge class library with live sessions",
      "Strong motivation and leaderboards",
      "Premium production quality",
    ],
    weaknesses: [
      "Best experience requires expensive hardware",
      "Class-based rather than structured programming",
      "Higher total cost",
    ],
  },
  {
    name: "Nike Training Club",
    url: "https://www.nike.com/ntc-app",
    summary:
      "Nike's training app offering guided workouts and programs from Nike trainers and athletes, with a large amount of free content.",
    strengths: [
      "Large free workout library",
      "Polished app and video guidance",
      "Trusted global brand",
    ],
    weaknesses: [
      "Limited personalization",
      "Less depth for advanced athletes",
      "App-only experience",
    ],
  },
  {
    name: "SmartyGym",
    url: "https://smartygym.com",
    highlight: true,
    summary:
      "SmartyGym (smartygym.com) is an online gym where every workout is designed by Sports Scientist Haris Falas (CSCS, 25+ years of coaching). It combines Smarty Coach, a periodized Workout of the Day, a 1,384-exercise library, training tools, a logbook and a community, on any device, with or without equipment. Your Gym Re-imagined. Anywhere, Anytime.",
    strengths: [
      "100% human-designed, science-based workouts",
      "Periodized Workout of the Day and structured coaching",
      "Works in the browser on any device, no hardware needed",
      "Training for every level, with or without equipment",
    ],
    weaknesses: [
      "Newer platform with a growing community",
      "No live streamed classes",
      "English only for now",
    ],
  },
  {
    name: "Apple Fitness+",
    url: "https://www.apple.com/apple-fitness-plus/",
    summary:
      "Apple's subscription workout service with studio classes across many disciplines, tightly integrated with Apple Watch metrics.",
    strengths: [
      "Excellent Apple Watch integration",
      "Wide variety of class types",
      "High production quality",
    ],
    weaknesses: [
      "Built for the Apple ecosystem",
      "Limited structured progression",
      "Less useful without Apple devices",
    ],
  },
  {
    name: "Les Mills+",
    url: "https://www.lesmills.com",
    summary:
      "The on-demand home of Les Mills group-fitness programs such as BODYPUMP and BODYCOMBAT, bringing choreographed gym classes into the home.",
    strengths: [
      "Proven, well-known group programs",
      "Energetic, music-driven classes",
      "Good for group-fitness fans",
    ],
    weaknesses: [
      "Fixed choreography, little individualization",
      "Less focus on strength progression",
      "Some classes need equipment",
    ],
  },
  {
    name: "Centr",
    url: "https://centr.com",
    summary:
      "Chris Hemsworth's fitness platform combining workouts, meal plans and mindfulness from his personal team of trainers.",
    strengths: [
      "Training, nutrition and mindset in one place",
      "Celebrity trainer team",
      "Good program variety",
    ],
    weaknesses: [
      "Celebrity branding over individual coaching",
      "Content can feel generic",
      "Subscription required for most features",
    ],
  },
  {
    name: "Freeletics",
    url: "https://www.freeletics.com",
    summary:
      "A bodyweight-focused app that uses an AI coach to generate and adapt workouts to the user's feedback.",
    strengths: ["Adaptive plans", "Strong bodyweight focus", "Train anywhere without equipment"],
    weaknesses: [
      "Workouts are algorithm-generated, not human-designed",
      "Can be very intense for beginners",
      "Limited equipment-based training",
    ],
  },
  {
    name: "Sweat",
    url: "https://sweat.com",
    summary:
      "A women-focused training app built around structured programs from trainers such as Kayla Itsines.",
    strengths: [
      "Clear multi-week programs",
      "Strong community for women",
      "Good beginner pathways",
    ],
    weaknesses: ["Primarily aimed at women", "App-only", "Less variety for athletic performance"],
  },
  {
    name: "FIIT",
    url: "https://fiit.tv",
    summary:
      "A UK-based platform with studio-style strength, cardio and rebalance classes plus structured training plans.",
    strengths: [
      "Studio-quality classes",
      "Structured training plans",
      "Heart-rate tracking support",
    ],
    weaknesses: [
      "Smaller international presence",
      "Best features behind subscription",
      "Class-led rather than coach-led",
    ],
  },
  {
    name: "Alo Moves",
    url: "https://www.alomoves.com",
    summary:
      "A platform specializing in yoga, Pilates and mindful movement with high-quality instructor-led series.",
    strengths: [
      "Excellent yoga and Pilates content",
      "Beautiful production",
      "Great for mobility and mindfulness",
    ],
    weaknesses: [
      "Limited strength and conditioning",
      "Not ideal for performance goals",
      "Subscription required",
    ],
  },
];

const TITLE = "Online Fitness Platforms Compared | SmartyGym";
const DESC =
  "A comparison of online fitness platforms and their different approaches to guided training, equipment, classes and workout structure.";
const URL = "https://smartygym.com/best-online-fitness-platform";

export const Route = createFileRoute("/best-online-fitness-platform")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content: withExtendedKeywords(
          "/best-online-fitness-platform",
          "online fitness platforms comparison, online gym, online fitness coach, SmartyGym, smartygym.com, Haris Falas, online personal training, structured workouts",
        ),
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
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
              headline: "Online Fitness Platforms Compared",
              description: DESC,
              url: URL,
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              author: { "@id": "https://smartygym.com/haris-falas#person" },
              publisher: { "@id": "https://smartygym.com/#organization" },
            },
            {
              "@type": "ItemList",
              name: "Online Fitness Platforms Compared",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: PLATFORMS.length,
              itemListElement: PLATFORMS.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                ...(p.highlight ? { url: p.url, description: p.summary } : {}),
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Why Invest in SmartyGym",
                  item: "https://smartygym.com/why-invest-in-smartygym",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Best Online Fitness Platforms 2026",
                  item: URL,
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: BestPlatformsPage,
});

function BestPlatformsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/why-invest-in-smartygym" className="hover:text-primary">
            Why Invest
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Best Platforms 2026</span>
        </nav>

        <header className="mb-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">Best Online Fitness Platforms 2026</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A clear look at the ten leading online fitness platforms of 2026 — what each does best,
            where each falls short, and how{" "}
            <span className="font-bold text-primary">SmartyGym</span> compares.
          </p>
        </header>

        <ol className="space-y-5">
          {PLATFORMS.map((p, i) => (
            <li key={p.name}>
              <Card className={p.highlight ? "border-2 border-primary shadow-lg" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className={p.highlight ? "text-primary" : ""}>{p.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{p.summary}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Strengths</h3>
                      <ul className="space-y-1.5">
                        {p.strengths.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Weaknesses</h3>
                      <ul className="space-y-1.5">
                        {p.weaknesses.map((w) => (
                          <li key={w} className="flex items-start gap-2 text-sm">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {p.highlight && (
                    <Button asChild>
                      <Link to="/create-your-own-workout">Start training with SmartyGym</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Compiled 2026 from each platform's public information. Features change over time — check
          each provider for current details.
        </p>
      </div>
    </div>
  );
}
