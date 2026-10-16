/**
 * Hidden question-and-answer data (FAQPage JSON-LD) for AI answer engines.
 * Answers reuse wording already published on each page; nothing is rendered on screen.
 */
import { SITE_URL } from "./site";

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(url: string, items: FaqItem[]) {
  const clean = items.filter((i) => i.question?.trim() && i.answer?.trim());
  if (!clean.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    inLanguage: "en",
    mainEntity: clean.map((i) => ({
      "@type": "Question",
      name: i.question.trim(),
      acceptedAnswer: { "@type": "Answer", text: i.answer.trim() },
    })),
  };
}

/** Reads the optimizer's stored FAQ pairs; returns [] for anything malformed. */
export function parseStoredFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ question: String(r.question ?? ""), answer: String(r.answer ?? "") }))
    .filter((r) => r.question.trim() && r.answer.trim())
    .slice(0, 8);
}

export const METHOD_FAQ: FaqItem[] = [
  {
    question: "What is The Smarty Method?",
    answer:
      "The Smarty Method is the SmartyGym performance system designed by Strength & Conditioning Coach Haris Falas: science-based workouts and intelligent periodization, built on science and experience.",
  },
  {
    question: "How is a SmartyGym workout structured?",
    answer:
      "Every session starts with a clear objective, then warm-up and activation, a primary training block of structured sets, reps and intensities, and a cool-down for recovery.",
  },
  {
    question: "How does the Workout of the Day follow a plan?",
    answer:
      "Each day targets a different energy system and every weekly cycle covers strength, cardio, mobility, metabolic conditioning, stability and recovery. No random workouts: each day builds on the previous one and every session has a clear objective.",
  },
  {
    question: "Is SmartyGym a physical gym?",
    answer:
      "No. SmartyGym is an online fitness platform. You train anywhere, anytime: at home, outdoors or in any gym, with workouts, tracking and tools on your phone or computer.",
  },
];

export const METHOD_FACTS = [
  "SmartyGym is an online-only fitness platform; it has no physical gym location.",
  "Workouts are programmed by sports scientist and CSCS-certified coach Haris Falas.",
  "Smarty Workouts and Smarty Coach workouts are built by fixed coaching rules from a closed, demonstrated exercise library.",
  "Every exercise is given as a simple dose: sets, reps or time, and rest.",
  "Workouts come in Beginner, Intermediate and Advanced levels.",
  "Sessions follow a clear structure: preparation and activation, main workout, cool-down.",
];

export const TRAINING_LOAD_FAQ: FaqItem[] = [
  {
    question: "How does SmartyGym calculate training load?",
    answer:
      "SmartyGym calculates personal strength, conditioning and overall training load from your logged workouts, in the units you logged, and compares it with your own recent baseline.",
  },
  {
    question: "What is my training load compared with?",
    answer:
      "SmartyGym totals comparable work from your most recent seven days, then compares it with your typical week across the preceding three weeks. The middle of the available comparisons is used so one unusual measurement cannot dominate.",
  },
  {
    question: "What do Low, Moderate, High and Very High mean?",
    answer:
      "Low is meaningfully below your usual weekly load, Moderate is broadly in line with it, High is meaningfully above it and Very High is far above it.",
  },
  {
    question: "Is training load a medical diagnosis?",
    answer:
      "No. Training load is a coaching indicator that supports training management. It does not diagnose health or injury.",
  },
];

export function categoryFaq(label: string, description: string, slug: string): FaqItem[] {
  const lower = label.toLowerCase();
  return [
    { question: `What are SmartyGym ${label} workouts?`, answer: `${description} Ready ${lower} workouts by Haris Falas.` },
    {
      question: `Can I do ${lower} workouts at home or in the gym?`,
      answer: `Yes. SmartyGym is an online platform, so ${lower} workouts can be done at home or in any gym, filtered by equipment, duration and difficulty.`,
    },
    {
      question: `Where can I find ${lower} workouts on SmartyGym?`,
      answer: `All ${lower} workouts are listed at ${SITE_URL}/smarty-workouts/category/${slug}.`,
    },
  ];
}
