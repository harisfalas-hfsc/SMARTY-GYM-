import { createServerFn } from "@tanstack/react-start";

export interface SharedWorkoutSeo {
  found: boolean;
  indexable: boolean;
  title: string;
  description: string;
  keywords: string[];
  image: string | null;
  category: string | null;
  format: string | null;
  duration: number | null;
  equipment: string[];
  sharedAt: string | null;
}

const FALLBACK: SharedWorkoutSeo = {
  found: false,
  indexable: false,
  title: "Shared workout — Smarty Community",
  description: "A workout shared with the Smarty Community by a member.",
  keywords: [],
  image: null,
  category: null,
  format: null,
  duration: null,
  equipment: [],
  sharedAt: null,
};

/**
 * Public, read-only head data for a shared workout page: only the fields that are
 * already visible to any member on the community list, plus the stored SEO copy.
 * Pages stay noindex while membership gates the community, and become indexable
 * automatically when Free Access Mode is ON.
 */
export const getSharedWorkoutSeo = createServerFn({ method: "GET" })
  .inputValidator((input: { workoutId: string }) => input)
  .handler(async ({ data }): Promise<SharedWorkoutSeo> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { isFreeAccessMode } = await import("@/lib/free-access.server");
      const [{ data: row }, { data: seo }, freeAccessMode] = await Promise.all([
        supabaseAdmin
          .from("community_workouts_public")
          .select(
            "id, name, category, format, focus, duration_min, equipment, location, image_url, description, shared_at",
          )
          .eq("id", data.workoutId)
          .maybeSingle(),
        supabaseAdmin
          .from("workout_seo")
          .select("seo_title, seo_description, seo_keywords")
          .eq("workout_id", data.workoutId)
          .maybeSingle(),
        isFreeAccessMode(),
      ]);

      if (!row) return FALLBACK;
      const w = row as {
        name: string;
        category: string | null;
        format: string | null;
        focus: string | null;
        duration_min: number | null;
        equipment: string[] | null;
        location: string | null;
        image_url: string | null;
        description: string | null;
        shared_at: string | null;
      };
      const s = seo as
        | { seo_title: string | null; seo_description: string | null; seo_keywords: string[] | null }
        | null;

      const bits = [w.category, w.format, w.duration_min ? `${w.duration_min} min` : null]
        .filter(Boolean)
        .join(" · ");
      return {
        found: true,
       indexable: Boolean(freeAccessMode),
        title: s?.seo_title || `${w.name} — Smarty Community workout`,
        description:
          s?.seo_description ||
          `${w.name}${bits ? ` (${bits})` : ""} — a workout shared with the Smarty Community, ready to train.`,
        keywords: s?.seo_keywords ?? [],
        image: w.image_url ?? null,
        category: w.category,
        format: w.format,
        duration: w.duration_min,
        equipment: w.equipment ?? [],
        sharedAt: w.shared_at,
      };
    } catch {
      return FALLBACK;
    }
  });
