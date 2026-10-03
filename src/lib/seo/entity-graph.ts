/** Canonical public entity relationships. This is internal SEO data, not page content. */
import { PAGE_SEO } from "./page-seo";
import { TRAINING_TOPICS } from "./training-topics";
import { SITE_URL } from "./site";

type EntityType = "Organization" | "Person" | "SoftwareApplication" | "CollectionPage" | "WebPage";
export interface SeoEntity {
  id: string;
  canonical: string;
  type: EntityType;
  name: string;
  aliases: string[];
  primaryTopic: string;
  searchIntent: string;
  supportingTopics: string[];
  parent: string | null;
  related: string[];
  children: string[];
  keywords: string[];
  indexable: boolean;
  publishedAt?: string;
  modifiedAt?: string;
  image?: string;
  author?: string;
  expertise?: string[];
}

const core = [
  ["smartygym", "/", "SmartyGym", "Organization", "online fitness platform", null],
  ["haris-falas", "/haris-falas", "Haris Falas", "Person", "sports science and strength coaching", "smartygym"],
  ["smarty-coach", "/how-it-works", "Smarty Coach", "SoftwareApplication", "personalized workout creation", "smartygym"],
  ["smarty-workouts", "/smarty-workouts", "Smarty Workouts", "CollectionPage", "ready-made expert workouts", "smartygym"],
  ["wod", "/wod", "Workout of the Day", "WebPage", "daily shared training", "smartygym"],
  ["programs", "/training", "Training Programs", "WebPage", "structured training", "smartygym"],
  ["exercises", "/exercise-library", "Exercise Library", "CollectionPage", "exercise demonstrations", "smartygym"],
  ["categories", "/smarty-workouts", "Training Categories", "CollectionPage", "workout categories", "smarty-workouts"],
  ["formats", "/glossary", "Workout Formats", "CollectionPage", "workout formats", "smartygym"],
  ["tools", "/tools", "Fitness Tools", "CollectionPage", "training tools", "smartygym"],
  ["blog", "/blog", "Blog Articles", "CollectionPage", "fitness articles", "smartygym"],
  ["guides", "/training", "Training Guides", "CollectionPage", "training education", "smartygym"],
  ["community", "/shared-workouts", "Shared Workouts", "CollectionPage", "community workouts", "smartygym"],
  ["method", "/the-smarty-method", "The Smarty Method", "WebPage", "training methodology", "smartygym"],
] as const;

export const SEO_ENTITIES: SeoEntity[] = core.map(([id, path, name, type, topic, parent]) => {
  const page = PAGE_SEO.find((p) => p.path === path);
  return {
    id, canonical: `${SITE_URL}${path}`, name, type, primaryTopic: topic,
    aliases: id === "smartygym" ? ["Smarty Gym", "smartygym.com"] : [],
    searchIntent: id === "haris-falas" ? "about the founder" : `learn about ${topic}`,
    supportingTopics: page?.keywords.slice(0, 8) ?? [],
    keywords: page ? [page.keyphrase, ...page.keywords] : [topic],
    parent, related: core.filter(([other]) => other !== id && (other === parent || id === "smartygym")).map(([other]) => other),
    children: core.filter(([, , , , , owner]) => owner === id).map(([other]) => other),
    indexable: !["categories", "formats", "programs"].includes(id),
    ...(id === "haris-falas" ? { expertise: ["Sports Science", "Strength and Conditioning"] } : {}),
    ...(id === "smartygym" ? { author: "haris-falas" } : {}),
  };
});

/** Guide pages inherit the real topic taxonomy; no synthetic URLs are created. */
export const GUIDE_ENTITIES: SeoEntity[] = TRAINING_TOPICS.map((topic) => ({
  id: `guide:${topic.slug}`,
  canonical: `${SITE_URL}/training/${topic.slug}`,
  type: "WebPage",
  name: topic.h1,
  aliases: [],
  primaryTopic: topic.eyebrow,
  searchIntent: `learn about ${topic.h1}`,
  supportingTopics: topic.related.map((r) => r.label),
  parent: "guides",
  related: topic.related.map((r) => `guide:${r.to.split("/").pop()}`),
  children: [],
  keywords: [topic.h1, topic.eyebrow],
  indexable: true,
  author: "haris-falas",
}));

export const SEO_GRAPH = [...SEO_ENTITIES, ...GUIDE_ENTITIES];