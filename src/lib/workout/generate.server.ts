import type { AthleteContext } from "./prompt.server";
import { knownLimitations, type LimitationProfile } from "./limitations";
import { enforceWorkout, estimateWorkMinutes } from "./enforce.server";
import { validateWorkout } from "./validate.server";
import { classifyIssuesForFallback } from "@/lib/workout-validation";
import { buildPackWorkout, packCopy } from "./pack.server";
import { overusedExerciseIds } from "./exercise-usage";
import { buildSessionPlan } from "./programming";
import { smartyCopy } from "./copy-bank.server";
import { dominantRegion, focusRegion, resolveLocation } from "./doctrine";

import {
  buildActivationPool,
  buildCooldownPool,
  filterPool,
  parseNoteExclusions,

  loadAllExercises,
  resolveCustomEquipment,
  type PoolExercise,
} from "./pool.server";

import {
  BANNED_NAME_WORDS,
  CATEGORY_FORMATS,
  starsToLevel,
  type Category,
  type EquipmentMode,
  type Format,
  type StrengthFocus,
} from "./spec";

// Smarty Coach runs 100% on the deterministic engine — no AI model, no credits.

export type GenerateInput = {
  category: Category;
  format?: Format | null;
  equipmentMode: EquipmentMode;
  customEquipment?: string[];
  customEquipmentRaw?: string;
  selectedEquipment: string[];
  stars: number;
  minutes: number;
  focus?: StrengthFocus | null;
  note?: string;
  location?: string;
  mood?: string;
  /** Library ids picked as favourites / dislikes in the training profile. */
  favoriteIds?: string[];
  dislikedIds?: string[];
  /** Library ids programmed in the athlete's last few sessions — used for variety. */
  recentIds?: string[];

  athlete?: AthleteContext;
};

export type GeneratedWorkout = {
  name: string;
  description_html: string;
  main_workout: string;
  instructions_html: string;
  tips_html: string;
  warnings: string[];
  needs_review: boolean;
};

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function pickFormat(category: Category, requested?: Format | null): Format {
  const allowed = CATEGORY_FORMATS[category];
  if (requested && allowed.includes(requested)) return requested;
  return allowed[Math.floor(Math.random() * allowed.length)]!;
}

const ROMAN_RE = /^(?:i{1,3}|iv|vi{0,3}|ix|xi{0,2})$/i;
const CODE_RE = /\b[A-Z]{2,4}[-\s]?\d+\b/;

export function isValidName(name: string, used: string[]): boolean {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d/.test(trimmed)) return false;
  if (CODE_RE.test(trimmed)) return false;
  if (words.some((w) => ROMAN_RE.test(w))) return false;
  const lower = trimmed.toLowerCase();
  if (BANNED_NAME_WORDS.some((w) => lower.includes(w))) return false;
  if (used.some((u) => u.toLowerCase() === lower)) return false;
  return true;
}


export async function generateWorkoutContent(
  supabase: Parameters<typeof loadAllExercises>[0],
  input: GenerateInput,
  usedNames: string[],
): Promise<GeneratedWorkout & { format: Format; pool: PoolExercise[]; duration: string }> {
  const level = starsToLevel(input.stars);
  const format = pickFormat(input.category, input.format ?? null);
  const all = await loadAllExercises(supabase);
  const customEquipment = input.customEquipmentRaw
    ? resolveCustomEquipment(all, input.customEquipmentRaw)
    : (input.customEquipment ?? []);
  const favoriteIds = input.favoriteIds ?? [];
  const dislikedIds = input.dislikedIds ?? [];
  const bannedTerms = input.note ? parseNoteExclusions(input.note) : [];
  // §18 — "Anywhere" is a real practicality filter (portable equipment only),
  // unless the athlete explicitly ticked fixed-station gym equipment.
  const location = resolveLocation(input.location ?? null, input.selectedEquipment);
  const limitations: LimitationProfile = {
    limitations: knownLimitations(input.athlete?.limitations ?? []),
    pregnancyStage: input.athlete?.pregnancy_stage ?? null,
    clearance: input.athlete?.limitation_clearance ?? false,
  };
  const pool = filterPool(all, {
    category: input.category,
    format,
    equipmentMode: input.equipmentMode,
    selectedEquipment: input.selectedEquipment,
    customEquipment,
    level,
    focus: input.focus ?? null,
    dislikedIds,
    favoriteIds,
    bannedTerms,
    location,
    age: input.athlete?.age ?? null,
    limitations,
  });


  if (pool.length < 1) {
    throw new Error(
      limitations.limitations?.length
        ? "There aren't enough safe exercises for your injuries & limitations with this equipment, so no workout was forced. Try a Recovery or Mobility & Stability session, add equipment, or review your limitations in your Training Profile — and seek guidance from a qualified professional if you're unsure."
        : "Not enough exercises match those settings. Try different equipment.",
    );
  }

  const duration = durationLabel(input.minutes);

  const plan = buildSessionPlan({
    category: input.category,
    format,
    level,
    stars: input.stars,
    minutes: input.minutes,
    mood: input.mood ?? null,
    location: input.location ?? null,
    focus: input.focus ?? null,
    equipmentCount: Math.max(1, input.selectedEquipment.length),
  });

  // Activation and Cool Down get their own library-backed vocabulary so both
  // sections always carry real exercise links and show up in the player.
  // §21 — activation vocabulary is narrowed to the demand of the work that is
  // about to be programmed: the focus when one was chosen, otherwise the
  // dominant region of the approved session pool.
  // Fix 3 — activation must prepare what the Main Workout actually trains:
  // the focus region when one was chosen, otherwise the dominant body region /
  // movement pattern of the exercises this session may actually draw from.
  const focusReg = focusRegion(input.focus ?? null);
  const activationRegion = focusReg === "full" ? dominantRegion(pool) : focusReg;
  const activationPool = buildActivationPool(all, {
    selectedEquipment: input.selectedEquipment,
    dislikedIds,
    focus: input.focus ?? null,
    region: activationRegion,
    limitations,
  });


  const cooldownPool = buildCooldownPool(all, {
    selectedEquipment: input.selectedEquipment,
    dislikedIds,
    limitations,
  });
  const prepIds = [...activationPool.map((e) => e.id), ...cooldownPool.map((e) => e.id)];
  const seed = `${input.category}${input.minutes}${pool.length}`.length + Date.now() % 100000;

  const enforceOpts = {
    category: input.category,
    format,
    level,
    targetMinutes: input.minutes,
    activationPool,
    cooldownPool,
    seed,
    requireFinisher: Boolean(plan.finisher),
    finisherMin: Math.max(1, plan.finisherCount[0]),
    requireActivation: plan.activationCount > 0,
    requireCooldown: plan.cooldownCount > 0,
    mainMin: plan.mainCount[0],
  };


  const validateOpts = {
    library: all,
    pool,
    category: input.category,
    format,
    level,
    targetMinutes: input.minutes,
    equipmentMode: input.equipmentMode,
    selectedEquipment: input.selectedEquipment,
    customEquipment,
    focus: input.focus ?? null,
    dislikedIds,
    limitations,
    location,
    mood: input.mood ?? null,
    age: input.athlete?.age ?? null,



    prepIds,
    requireFinisher: Boolean(plan.finisher),
    finisherMin: Math.max(1, plan.finisherCount[0]),
    requireActivation: plan.activationCount > 0,
    requireCooldown: plan.cooldownCount > 0,
    mainMin: plan.mainCount[0],
  };



  const fallbackName = () =>
    `${input.category.split(" ")[0]!.toLowerCase()} ${level} session`.replace(/\b\w/g, (c) =>
      c.toUpperCase(),
    );

  // ---- Deterministic engine: the only generation path -------------------------
  // Usage cap (exercise-usage.ts): read this category's Smarty Workouts; failure only skips the cap.
  let overusedIds: string[] = [];
  try {
    const { data: existing } = await (supabase as any).from("smarty_workouts").select("main_workout").eq("category", input.category);
    if (existing?.length) overusedIds = [...overusedExerciseIds(existing.map((r: { main_workout: string | null }) => r.main_workout ?? ""), pool.map((e) => e.id))];
  } catch {
    overusedIds = [];
  }
  const pack = buildPackWorkout(pool, all, {
    category: input.category,
    format,
    level,
    minutes: input.minutes,
    focus: input.focus ?? null,
    favoriteIds,
    activationPool,
    cooldownPool,
    seed,
    finisher: Boolean(plan.finisher),
    plan,
    overusedIds,
  });
  const enforcedPack = enforceWorkout(pack.html, pool, enforceOpts);

  const packValidation = validateWorkout(enforcedPack.html, validateOpts);
  const packSplit = classifyIssuesForFallback([
    ...enforcedPack.errors,
    ...packValidation.errors,
  ]);
  // Safety is never "adjusted": a workout that still carries an exercise the
  // member's limitations exclude is not delivered at all.
  const safetyFaults = packValidation.errors.filter((m) => /because of your .* limitation|conflicts with your injuries/i.test(m));
  if (safetyFaults.length)
    throw new Error(
      "We couldn't build a session that fully respects your injuries & limitations, so no workout was forced. Try a Recovery or Mobility & Stability session, or review your limitations in your Training Profile — and seek guidance from a qualified professional if you're unsure.",
    );
  // Coaching text comes from the real Smarty Workouts library (closest match
  // on category, difficulty, equipment mode and duration); the plain template
  // copy is the fallback when nothing matches.
  const copy =
    (await smartyCopy(supabase as never, {
      category: input.category,
      stars: input.stars,
      equipmentMode: input.equipmentMode,
      minutes: input.minutes,
      seed,
    })) ??
    packCopy({
      category: input.category,
      format,
      level,
      minutes: input.minutes,
      focus: input.focus ?? null,
    });
  const name = isValidName(pack.name, usedNames) ? pack.name : fallbackName();

  return {
    name,
    ...copy,
    main_workout: enforcedPack.html,
    warnings: [
      ...enforcedPack.warnings,
      ...packValidation.warnings,
      ...packSplit.soft,
      ...packSplit.structural.map((issue) => `Adjustment: ${issue}`),
    ],
    needs_review: packSplit.structural.length > 0,
    format,
    pool,
    duration,
  };
}


export { estimateWorkMinutes };
