/**
 * Copy bank: workout descriptions, instructions and coach tips come from the
 * real Smarty Workouts library — never from an AI model. The engine picks the
 * closest-matching published workout (same category, same difficulty, same
 * equipment mode, nearest duration) and reuses its coaching text verbatim.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, EquipmentMode } from "./spec";

export type SmartyCopy = {
  description_html: string;
  instructions_html: string;
  tips_html: string;
};

type CopyRow = {
  id: string;
  category: string;
  description_html: string | null;
  instructions_html: string | null;
  tips_html: string | null;
  difficulty_stars: number | null;
  duration_min: number | null;
  equipment: string[] | null;
};

let cache: { at: number; rows: CopyRow[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

async function loadCopyRows(db: SupabaseClient): Promise<CopyRow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const { data } = await db
    .from("smarty_workouts")
    .select("id,category,description_html,instructions_html,tips_html,difficulty_stars,duration_min,equipment");
  const rows = ((data as CopyRow[] | null) ?? []).filter(
    (r) => r.description_html && r.instructions_html && r.tips_html,
  );
  cache = { at: Date.now(), rows };
  return rows;
}

const isBodyweightOnly = (equipment: string[] | null) =>
  !equipment?.length || equipment.every((e) => e.toLowerCase().includes("bodyweight"));

/**
 * Best-matching Smarty Workout copy for this brief, or null when nothing in
 * the library is close enough (the caller falls back to template copy).
 * Deterministic per brief: the same request always picks the same text.
 */
export async function smartyCopy(
  db: SupabaseClient,
  input: {
    category: Category;
    stars: number;
    equipmentMode: EquipmentMode;
    minutes: number;
    /** Varies the pick among equally good matches so workouts don't all read the same. */
    seed?: number;
  },
): Promise<SmartyCopy | null> {
  const rows = (await loadCopyRows(db)).filter(
    (r) => r.id && r.description_html && r.category === input.category,
  );
  if (!rows.length) return null;

  const wantBodyweight = input.equipmentMode === "BODYWEIGHT";
  const scored = rows
    .map((r) => {
      let score = 0;
      if (r.difficulty_stars === input.stars) score += 4;
      if (isBodyweightOnly(r.equipment) === wantBodyweight) score += 2;
      if (r.duration_min !== null) score -= Math.abs(r.duration_min - input.minutes) / 30;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  // Category match is decided by the caller's query — rows are pre-filtered.
  const best = scored[0];
  if (!best || best.score < 2) return null;

  const ties = scored.filter((s) => s.score === best.score).map((s) => s.r);
  const pick = ties[(input.seed ?? 0) % ties.length]!;
  return {
    description_html: pick.description_html!,
    instructions_html: pick.instructions_html!,
    tips_html: pick.tips_html!,
  };
}
