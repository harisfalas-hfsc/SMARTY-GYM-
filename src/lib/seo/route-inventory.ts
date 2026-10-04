/**
 * Machine-readable inventory of every app route and how search engines should
 * treat it. The sitemap reads the indexable static list from here, and the SEO
 * validation test checks every route file is classified and that robots.txt
 * keeps the private areas out.
 */
import { TRAINING_TOPIC_SLUGS } from "@/lib/seo/training-topics";

export type RouteClass = "indexable" | "noindex" | "private" | "admin" | "utility" | "redirect";

export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface StaticSitemapEntry {
  path: string;
  changefreq: ChangeFreq;
  priority: string;
  /** Only listed while payments are on. */
  paidOnly?: boolean;
}

/** Route IDs (as in createFileRoute) → classification. */
export const ROUTE_CLASSIFICATION: Record<string, RouteClass> = {
  "/": "indexable",
  "/about": "indexable",
  "/why-invest-in-smartygym": "noindex",
  "/best-online-fitness-platform": "noindex",
  "/the-smarty-method": "indexable",
  "/training-load-science": "indexable",
  "/haris-falas": "indexable",
  "/founder-note": "indexable",
  "/how-it-works": "indexable",
  "/pricing": "indexable",
  "/exercise-library": "indexable",
  "/wod": "indexable",
  "/faq": "indexable",
  "/contact": "indexable",
  "/glossary": "indexable",
  "/training/": "indexable",
  "/training/$slug": "indexable",
  "/blog/": "indexable",
  "/blog/$slug": "indexable",
  "/tools/": "indexable",
  "/tools/workout-timer": "indexable",
  "/tools/rounds-tracker": "indexable",
  "/tools/1rm-calculator": "indexable",
  "/privacy": "indexable",
  "/terms": "indexable",
  "/disclaimer": "indexable",
  "/community/": "indexable",
  "/shared-workouts": "indexable",
  "/smarty-workouts/": "indexable",
  "/smarty-workouts/$workoutId": "indexable",
  "/smarty-workouts/category/$category": "indexable",
  "/smarty-ritual": "noindex",
  "/smarty-checkins": "noindex",
  "/community/workout/$workoutId": "indexable",
  "/community/workouts": "noindex",
  "/w/$workoutId": "noindex",
  "/auth": "noindex",
  "/reset-password": "noindex",
  "/checkout/return": "noindex",
  "/_authenticated": "private",
  "/_authenticated/account": "private",
  "/_authenticated/create-your-own-workout": "private",
  "/coach": "redirect",
  "/create-your-workout": "redirect",
  "/_authenticated/inbox": "private",
  "/_authenticated/logbook": "private",
  "/_authenticated/messages": "private",
  "/_authenticated/notifications": "private",
  "/_authenticated/profile": "private",
  "/_authenticated/progress": "private",
  "/_authenticated/workout/$workoutId": "private",
  "/admin/": "admin",
  "/admin/exercise-library": "admin",
  "/$": "redirect",
};

/** Private path prefixes that robots.txt must disallow for every crawler. */
export const PRIVATE_PREFIXES = [
  "/admin",
  "/auth",
  "/reset-password",
  "/account",
  "/create-your-own-workout",
  "/profile",
  "/logbook",
  "/progress",
  "/notifications",
  "/inbox",
  "/messages",
  "/checkout",
];

export const STATIC_SITEMAP_ENTRIES: StaticSitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/the-smarty-method", changefreq: "monthly", priority: "0.75" },
  { path: "/training-load-science", changefreq: "monthly", priority: "0.75" },
  { path: "/haris-falas", changefreq: "monthly", priority: "0.7" },
  { path: "/founder-note", changefreq: "monthly", priority: "0.6" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9", paidOnly: true },
  { path: "/exercise-library", changefreq: "weekly", priority: "0.85" },
  { path: "/wod", changefreq: "daily", priority: "0.85" },
  { path: "/shared-workouts", changefreq: "daily", priority: "0.75" },
  { path: "/smarty-workouts", changefreq: "weekly", priority: "0.8" },
  { path: "/community", changefreq: "daily", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
  { path: "/glossary", changefreq: "monthly", priority: "0.75" },
  { path: "/training", changefreq: "monthly", priority: "0.85" },
  ...TRAINING_TOPIC_SLUGS.map((slug) => ({
    path: `/training/${slug}`,
    changefreq: "monthly" as const,
    priority: "0.8",
  })),
  { path: "/blog", changefreq: "weekly", priority: "0.85" },
  { path: "/tools", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/workout-timer", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/rounds-tracker", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/1rm-calculator", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
];
