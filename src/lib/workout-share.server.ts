import type { WorkoutShareTarget } from "@/lib/workout/social-share";

/** Anonymous policies/public views are the disclosure boundary, not the caller. */
export async function loadPublicShareCard(target: WorkoutShareTarget) {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) return null;
  const db = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  let query = db.from(target.kind === "smarty" ? "smarty_workouts" : "community_workouts_public")
    .select("id,name,category,format,focus,difficulty_stars,duration_min,location,equipment,image_url")
    .eq("id", target.id);
  if (target.kind === "smarty") query = query.eq("is_visible", true);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id), name: String(data.name), category: data.category as string | null,
    format: data.format as string | null, focus: data.focus as string | null,
    difficulty_stars: Number(data.difficulty_stars), difficulty_label: null,
    duration_min: data.duration_min as number | null, duration_label: null,
    location: data.location as string | null, equipment: data.equipment as string[] | null,
    image_url: data.image_url as string | null,
  };
}