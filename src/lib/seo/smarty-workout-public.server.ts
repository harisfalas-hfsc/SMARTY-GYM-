import { SITE_URL } from "@/lib/seo/site";

/** Only public card facts; the exercise prescription remains behind Premium. */
export type PublicSmartyWorkout = {
  id: string;
  name: string;
  category: string;
  format: string | null;
  focus: string | null;
  duration_min: number;
  equipment: string[] | null;
  image_url: string | null;
  updated_at: string;
};

const COLS = "id,name,category,format,focus,duration_min,equipment,image_url,updated_at";

function validImage(url: string | null): string | null {
  if (!url) return null;
  if (/^\/api\/public\/workout-cover\/[a-z0-9-]+\.(png|jpe?g|webp)$/i.test(url))
    return `${SITE_URL}${url}`;
  if (url.startsWith("https://")) return url;
  return null;
}

export function smartyWorkoutSearchData(workout: PublicSmartyWorkout) {
  const category = workout.category.toLowerCase();
  const equipment = (workout.equipment ?? []).filter((item) => !["bodyweight", "other"].includes(item.toLowerCase()));
  const equipmentLabel = equipment.length ? `Equipment: ${equipment.join(", ")}.` : "Bodyweight training.";
  // Existing search-intent phrases are used only when the public card facts
  // actually support them. Never infer exercises or the Premium prescription.
  const categoryPhrase: Record<string, string> = {
    STRENGTH: "strength training",
    "MUSCLE BUILDING": "muscle building workout",
    "CALORIE BURNING": "calorie burning workout",
    CARDIO: "cardio workout",
    METABOLIC: "metabolic conditioning",
    CHALLENGE: "challenge workout",
    "MOBILITY & STABILITY": "mobility workout",
    PILATES: "Pilates workout",
    RECOVERY: "active recovery",
  };
  const intent = categoryPhrase[workout.category.toUpperCase()] ?? `${category} workout`;
  const format = workout.format?.trim();
  const focus = workout.focus?.trim();
  const categoryTitle = workout.category.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${workout.name} — ${workout.duration_min}-Min ${categoryTitle} Workout | SmartyGym`;
  const description = `${workout.name}: a ${workout.duration_min}-minute ${intent} by Haris Falas${format ? ` in ${format} format` : ""}${focus ? `, focused on ${focus}` : ""}. ${equipmentLabel} On SmartyGym. Log in with Premium to follow the workout.`;
  return { title, description, image: validImage(workout.image_url), imageTitle: `${workout.name} — SmartyGym ${intent}` };
}

export async function getPublicSmartyWorkout(id: string): Promise<PublicSmartyWorkout | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("smarty_workouts").select(COLS)
    .eq("is_visible", true).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as PublicSmartyWorkout | null) ?? null;
}

export async function listPublicSmartyWorkouts(): Promise<PublicSmartyWorkout[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows: PublicSmartyWorkout[] = [];
  for (let offset = 0; offset < 49000; offset += 1000) {
    const { data, error } = await supabaseAdmin.from("smarty_workouts").select(COLS)
      .eq("is_visible", true).order("id").range(offset, offset + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as PublicSmartyWorkout[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}