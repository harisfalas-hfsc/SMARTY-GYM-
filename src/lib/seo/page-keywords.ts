/**
 * Keywords that come from the fixed public pages of the site.
 * Every term here describes something that is genuinely on that page.
 */
import { EXTENDED_PAGE_KEYWORDS, mergeKeywords } from "@/lib/seo/extended-keywords";

const BASE_PAGE_KEYWORDS: Record<string, string[]> = {
  "/": [
    "personalized workout generator",
    "personalized workout",
    "online personal trainer",
    "workout app",
    "training plan",
    "workout of the day",
    "smarty coach",
  ],
  "/about": [
    "coaching philosophy",
    "strength and conditioning",
    "evidence based training",
    "progressive overload",
    "periodization",
    "training methodology",
  ],
  "/how-it-works": [
    "training profile",
    "pre workout questionnaire",
    "warm up",
    "activation",
    "main workout",
    "finisher",
    "cool down",
    "sets reps tempo rest",
    "exercise demonstrations",
    "workout player",
    "session debrief",
  ],
  "/wod": [
    "workout of the day",
    "wod",
    "daily workout",
    "bodyweight workout of the day",
    "equipment workout of the day",
    "84 day training cycle",
    "recovery day",
  ],
  "/exercise-library": [
    "exercise library",
    "exercise database",
    "animated exercise demonstrations",
    "muscle group",
    "movement pattern",
    "equipment filter",
  ],
  "/tools": [
    "workout timer",
    "interval timer",
    "rounds tracker",
    "1rm calculator",
    "one rep max calculator",
    "training tools",
  ],
  "/faq": [
    "workout app questions",
    "membership questions",
    "how workouts are generated",
    "cancel membership",
  ],
  "/glossary": [
    "training terminology",
    "rpe",
    "tempo",
    "amrap",
    "emom",
    "superset",
    "training load",
    "deload",
  ],
  "/pricing": ["fitness subscription", "monthly membership", "9.99 per month", "cancel anytime"],
  "/haris-falas": ["haris falas", "sports scientist", "cscs", "strength coach"],
  "/logbook": ["training logbook", "workout history", "progress tracking", "training calendar"],
  "/progress": ["progress score", "personal records", "training load", "performance trend"],
};

/** Base keywords plus the extended phrases, for every known page path. */
export const PAGE_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  Array.from(new Set([...Object.keys(BASE_PAGE_KEYWORDS), ...Object.keys(EXTENDED_PAGE_KEYWORDS)])).map((path) => [
    path,
    mergeKeywords(BASE_PAGE_KEYWORDS[path] ?? [], path),
  ]),
);
