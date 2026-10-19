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
};

const COLS =
  "id,slug,name,body_part,equipment,target_muscle,secondary_muscles,instructions,difficulty,category,description,gif_path";

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
