/**
 * Site-wide icon colours. Every SMARTYGYM feature and workout category has one
 * permanent identity colour (see .icon-tone-N / .icon-ink-N in styles.css),
 * identical on mobile and desktop. Unknown keys fall back to a stable hash.
 */
const IDENTITY: Record<string, number> = {
  // Features
  coach: 0, smartycoach: 0, talktocoachharis: 0,
  workouts: 0, smartyworkouts: 0, browseworkouts: 0,
  wod: 2, workoutoftheday: 2,
  create: 3, createyourownworkout: 3, buildmyworkout: 3, createyourworkout: 3,
  shared: 1, sharedworkouts: 1, community: 1, smartycommunity: 1,
  ritual: 6, smartyritual: 6, smartyrituals: 6,
  tools: 5, smartytools: 5, gymtools: 5,
  library: 4, exerciselibrary: 4, exercisedatabase: 4,
  blog: 7, bloginsights: 7, coachingarticles: 7, articles: 7,
  logbook: 8, progress: 8, insights: 8,
  checkins: 9, smartycheckins: 9,
  inbox: 0, notifications: 0, account: 5, myaccount: 5,
  pricing: 6, premium: 6, membership: 6, gift: 7, smartygift: 7,
  about: 0, howitworks: 3, contact: 2, faq: 3,
  privacy: 8, privacypolicy: 8, terms: 8, termsconditions: 8, disclaimer: 8, connectai: 5,
  // Workout categories
  strength: 4, musclebuilding: 3, calorieburning: 2, cardio: 7, metabolic: 6,
  challenge: 8, mobilitystability: 5, pilates: 9, recovery: 1,
};
const TONES = 10;

function norm(key: string): string {
  return key.toLowerCase().replace(/&/g, "").replace(/[^a-z]/g, "");
}

export function toneIndex(key: string | number): number {
  if (typeof key === "number") return Math.abs(key) % TONES;
  const known = IDENTITY[norm(key)];
  if (known !== undefined) return known;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % TONES;
}

export function iconTone(key: string | number): string {
  return `icon-tone-${toneIndex(key)}`;
}

/** Text-only colour for bare icons (no background). */
export function iconInk(key: string | number): string {
  return `icon-ink-${toneIndex(key)}`;
}
