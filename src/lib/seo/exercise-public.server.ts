/** Public exercise facts for crawlable exercise pages. Exercises are already
 *  public in the library; this only exposes the same fields by slug. */

export type PublicExercise = {
  id: string;
  slug: string | null;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target_muscle: string | null;
  secondary_muscles: string[] | null;
  instructions: string[] | null;
  difficulty: string | null;
  category: string | null;
  description: string | null;
  gif_path: string | null;
  created_at?: string | null;
};

const COLS =
  "id,slug,name,body_part,equipment,target_muscle,secondary_muscles,instructions,difficulty,category,description,gif_path,created_at";

export async function getPublicExerciseBySlug(slug: string): Promise<PublicExercise | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("exercises")
    .select(COLS)
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicExercise | null) ?? null;
}

export async function listPublicExerciseSlugs(): Promise<{ slug: string; name: string }[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows: { slug: string; name: string }[] = [];
  for (let offset = 0; offset < 49000; offset += 1000) {
    const { data, error } = await supabaseAdmin
      .from("exercises")
      .select("slug,name")
      .eq("is_active", true)
      .not("slug", "is", null)
      .order("slug")
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as { slug: string; name: string }[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

/** Name → slug pairs used to turn article mentions into internal links. */
export async function listExerciseLinkTargets(): Promise<{ name: string; slug: string }[]> {
  return listPublicExerciseSlugs();
}

/**
 * The exact list an anonymous visitor sees first in the library: the
 * rule-allowed ("liked by default") exercises, alphabetical, first page of 60.
 * Used so the server-rendered HTML already contains the real list.
 */
export async function listDefaultLibraryExercises(): Promise<PublicExercise[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { loadAllExercises } = await import("@/lib/workout/pool.server");
  const { computeAllowedExerciseIds } = await import("@/lib/workout/allowed-exercises.server");
  const allowed = [...computeAllowedExerciseIds(await loadAllExercises(supabaseAdmin))];
  if (allowed.length === 0) return [];
  const batches: PublicExercise[][] = [];
  for (let index = 0; index < allowed.length; index += 150) {
    const { data, error } = await supabaseAdmin
      .from("exercises")
      .select(COLS)
      .in("id", allowed.slice(index, index + 150))
      .order("name");
    if (error) throw error;
    batches.push(((data ?? []) as PublicExercise[]));
  }
  return batches.flat().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
}

/** A linked exercise card on a standalone exercise page. */
export type ExerciseLink = {
  slug: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target_muscle: string | null;
  gif_path: string | null;
};

/** A public workout card (card facts only — never the prescription). */
export type WorkoutLink = {
  path: string;
  name: string;
  category: string;
  duration_min: number;
  image_url: string | null;
};

export type ExerciseLanding = {
  exercise: PublicExercise;
  sameMuscle: ExerciseLink[];
  sameEquipment: ExerciseLink[];
  previous: ExerciseLink | null;
  next: ExerciseLink | null;
  workouts: WorkoutLink[];
};

const LINK_COLS = "slug,name,body_part,equipment,target_muscle,gif_path";

/** Stable per-page ordering so links spread across the library, not just A–Z. */
export function stableRank(seed: string, key: string): number {
  let hash = 2166136261;
  const text = `${seed}:${key}`;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Maps an exercise's equipment to the equipment labels used on Smarty Workouts. */
export function workoutEquipmentFor(equipment: string | null): string {
  const e = (equipment ?? "").toLowerCase();
  if (!e || e.includes("body weight") || e === "bodyweight" || e === "assisted") return "bodyweight";
  if (e.includes("kettlebell")) return "kettlebells";
  if (e.includes("dumbbell")) return "dumbbells";
  if (e.includes("smith") || e.includes("machine") || e.includes("cable") || e.includes("leverage") || e.includes("sled")) return "machines";
  if (e.includes("barbell") || e.includes("trap bar")) return "barbell";
  return "other";
}

function pick<T extends { slug: string }>(rows: T[], seed: string, count: number, exclude: Set<string>): T[] {
  return rows
    .filter((r) => r.slug && !exclude.has(r.slug))
    .sort((a, b) => stableRank(seed, a.slug) - stableRank(seed, b.slug))
    .slice(0, count);
}

export async function getExerciseLandingBySlug(slug: string): Promise<ExerciseLanding | null> {
  const exercise = await getPublicExerciseBySlug(slug);
  if (!exercise || !exercise.slug) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const base = () =>
    supabaseAdmin.from("exercises").select(LINK_COLS).eq("is_active", true).not("slug", "is", null);

  const [muscleRes, equipRes, prevRes, nextRes, workoutRes] = await Promise.all([
    exercise.target_muscle ? base().eq("target_muscle", exercise.target_muscle).limit(200) : Promise.resolve({ data: [], error: null }),
    exercise.equipment && exercise.body_part
      ? base().eq("equipment", exercise.equipment).eq("body_part", exercise.body_part).limit(200)
      : Promise.resolve({ data: [], error: null }),
    base().lt("slug", exercise.slug).order("slug", { ascending: false }).limit(1),
    base().gt("slug", exercise.slug).order("slug", { ascending: true }).limit(1),
    supabaseAdmin
      .from("smarty_workouts")
      .select("id,slug,name,category,duration_min,image_url,equipment")
      .eq("is_visible", true)
      .contains("equipment", [workoutEquipmentFor(exercise.equipment)])
      .limit(500),
  ]);
  for (const res of [muscleRes, equipRes, prevRes, nextRes, workoutRes]) if (res.error) throw res.error;

  const seen = new Set<string>([exercise.slug]);
  const sameMuscle = pick((muscleRes.data ?? []) as ExerciseLink[], exercise.slug, 8, seen);
  sameMuscle.forEach((e) => seen.add(e.slug));
  const sameEquipment = pick((equipRes.data ?? []) as ExerciseLink[], exercise.slug, 6, seen);

  type Row = { id: string; slug: string | null; name: string; category: string; duration_min: number; image_url: string | null };
  const workouts = ((workoutRes.data ?? []) as Row[])
    .map((w) => ({ ...w, key: w.slug ?? w.id }))
    .sort((a, b) => stableRank(exercise.slug!, a.key) - stableRank(exercise.slug!, b.key))
    .slice(0, 4)
    .map((w) => ({
      path: `/smarty-workouts/${w.key}`,
      name: w.name,
      category: w.category,
      duration_min: w.duration_min,
      image_url: w.image_url,
    }));

  return {
    exercise,
    sameMuscle,
    sameEquipment,
    previous: ((prevRes.data ?? [])[0] as ExerciseLink | undefined) ?? null,
    next: ((nextRes.data ?? [])[0] as ExerciseLink | undefined) ?? null,
    workouts,
  };
}
