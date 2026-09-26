/**
 * Legacy URL preservation for smartygym.com.
 *
 * The domain previously served a static site whose addresses all ended in
 * ".html" (plus /workout/*, /trainingprogram/* and /blog/* sections). Those
 * URLs are indexed by Google, Bing and the AI crawlers. Letting them 404 would
 * throw away the ranking history of the domain, so every one of them is
 * answered with a permanent (301) redirect to the closest page in this app.
 *
 * Nothing here is visible to visitors: no links, no UI, no layout changes.
 */

/** Exact one-to-one matches for the old top level pages. */
const PAGE_MAP: Record<string, string> = {
  "/index.html": "/",
  "/home.html": "/",
  "/about.html": "/about",
  "/contact.html": "/contact",
  "/faq.html": "/faq",
  "/fitness-training.html": "/training",
  "/glossary.html": "/glossary",
  "/research.html": "/glossary",
  "/blog.html": "/blog",
  "/coach-profile.html": "/haris-falas",
  "/coach-cv.html": "/haris-falas",
  "/the-smarty-method.html": "/how-it-works",
  "/best-online-fitness-platform.html": "/about",
  "/why-invest-in-smartygym.html": "/how-it-works",
  "/workout.html": "/training",
  "/wod-archive.html": "/wod",
  "/daily-ritual.html": "/wod",
  "/trainingprogram.html": "/training/workout-programs",
  "/smarty-premium.html": "/how-it-works",
  "/corporate.html": "/contact",
  "/corporate-wellness.html": "/contact",
  "/exerciselibrary.html": "/exercise-library",
  "/tools.html": "/tools",
  "/community.html": "/community",
  "/shop.html": "/how-it-works",
  "/privacy-policy.html": "/privacy",
  "/termsofservice.html": "/terms",
  "/terms-of-service.html": "/terms",
  "/disclaimer.html": "/disclaimer",
  "/home": "/",
  "/start": "/",
  "/about-smartygym": "/about",
  "/why-smartygym": "/about",
  "/human-performance": "/about",
  "/best-online-fitness-platform": "/about",
  "/smartygym-vs-peloton": "/about",
  "/smartygym-vs-freeletics": "/about",
  "/smartygym-vs-peloton.html": "/about",
  "/smartygym-vs-freeletics.html": "/about",
  "/coach-profile": "/haris-falas",
  "/coach-cv": "/haris-falas",
  "/the-smarty-method": "/how-it-works",
  "/why-invest-in-smartygym": "/how-it-works",
  "/take-a-tour": "/how-it-works",
  "/takeatour": "/how-it-works",
  "/smarty-premium": "/how-it-works",
  "/smartypremium": "/how-it-works",
  "/join-premium": "/how-it-works",
  "/joinpremium": "/how-it-works",
  "/premiumbenefits": "/how-it-works",
  "/premium-comparison": "/how-it-works",
  "/premiumcomparison": "/how-it-works",
  "/smarty-plans": "/how-it-works",
  "/shop": "/how-it-works",
  "/corporate": "/contact",
  "/corporate-wellness": "/contact",
  "/fitness-training": "/training",
  "/research": "/glossary",
  "/termsofservice": "/terms",
  "/privacy-policy": "/privacy",
  "/1rmcalculator": "/tools/1rm-calculator",
  "/workouttimer": "/tools/workout-timer",
  "/bmrcalculator": "/tools",
  "/macrocalculator": "/tools",
  "/caloriecounter": "/tools",
  "/caloriecalculator": "/tools",
  "/calculator-history": "/tools",
  "/create-your-own-workout": "/how-it-works",
  "/dashboard": "/",
  "/userdashboard": "/",
  "/my-workouts": "/",
};

/** Old /workout/<category>[/<session>] sections. */
const WORKOUT_MAP: Record<string, string> = {
  wod: "/wod",
  strength: "/training/strength-training",
  "calorie-burning": "/training/metabolic-conditioning",
  metabolic: "/training/metabolic-conditioning",
  cardio: "/training/cardio-workouts",
  mobility: "/training/mobility-and-stability",
  challenge: "/training/workout-programs",
  pilates: "/training/mobility-and-stability",
  recovery: "/training/mobility-and-stability",
  "micro-workouts": "/training/bodyweight-workouts",
};

/** Old /trainingprogram/<category>[/<program>] sections. */
const PROGRAM_MAP: Record<string, string> = {
  "functional-strength": "/training/strength-training",
  "muscle-hypertrophy": "/training/strength-training",
  "weight-loss": "/training/metabolic-conditioning",
  "cardio-endurance": "/training/cardio-workouts",
  "mobility-stability": "/training/mobility-and-stability",
  "low-back-pain": "/training/mobility-and-stability",
};

/** Old /tools/<tool>.html pages. Retired calculators land on the tools hub. */
const TOOL_MAP: Record<string, string> = {
  "1rm-calculator": "/tools/1rm-calculator",
  "workout-timer": "/tools/workout-timer",
  "rounds-tracker": "/tools/rounds-tracker",
  "bmr-calculator": "/tools",
  "macro-calculator": "/tools",
  "calorie-counter": "/tools",
};

function stripHtml(segment: string): string {
  return segment.endsWith(".html") ? segment.slice(0, -5) : segment;
}

/**
 * Resolves a legacy address to its replacement, or null when the path is not a
 * known legacy address (in which case the normal not-found page applies).
 */
export function resolveLegacyPath(rawPathname: string): string | null {
  if (!rawPathname) return null;

  // Normalise: lowercase, no trailing slash.
  let pathname = rawPathname.toLowerCase();
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);

  const direct = PAGE_MAP[pathname] ?? PAGE_MAP[`${pathname}.html`];
  if (direct) return direct;

  const segments = pathname.split("/").filter(Boolean).map(stripHtml);
  if (segments.length === 0) return null;

  const [first, second] = segments;

  if (first === "workout") {
    if (!second) return "/training";
    if (second === "shared") return "/shared-workouts";
    return WORKOUT_MAP[second] ?? "/training";
  }

  if (first === "trainingprogram" || first === "training-program") {
    if (!second) return "/training/workout-programs";
    return PROGRAM_MAP[second] ?? "/training/workout-programs";
  }

  if (first === "tools") {
    if (!second) return "/tools";
    return TOOL_MAP[second] ?? "/tools";
  }

  if (first === "blog") {
    if (!second) return "/blog";
    // Old category listings have no equivalent listing page.
    if (second === "category") return "/blog";
    return `/blog/${second}`;
  }

  if (first === "exerciselibrary" || first === "exercise-library") return "/exercise-library";
  if (first === "wod-archive" || first === "daily-ritual") return "/wod";

  // Any other retired ".html" page: try the same path without the extension.
  if (pathname.endsWith(".html")) {
    const withoutExtension = `/${segments.join("/")}`;
    return withoutExtension === pathname ? null : withoutExtension;
  }

  return null;
}
