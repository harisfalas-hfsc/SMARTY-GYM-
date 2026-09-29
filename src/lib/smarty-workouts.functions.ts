import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The eight ready-workout categories, in page order. */
export const SMARTY_WORKOUT_CATEGORIES = [
  "STRENGTH",
  "MUSCLE BUILDING",
  "CALORIE BURNING",
  "CARDIO",
  "METABOLIC",
  "CHALLENGE",
  "MOBILITY & STABILITY",
  "PILATES",
] as const;

export type SmartyWorkout = {
  id: string;
  name: string;
  category: string;
  format: string | null;
  focus: string | null;
  difficulty_stars: number;
  duration_min: number;
  duration_label: string | null;
  equipment: string[];
  location: string | null;
  image_url: string | null;
  description_html: string | null;
  main_workout: string | null;
  instructions_html: string | null;
  tips_html: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SmartyWorkoutCard = Pick<
  SmartyWorkout,
  "id" | "name" | "category" | "format" | "focus" | "difficulty_stars" | "duration_min" | "equipment" | "location" | "image_url"
>;

const CARD_COLS = "id,name,category,format,focus,difficulty_stars,duration_min,equipment,location,image_url";

async function publicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
}

/** Public: visible ready workouts (card fields only). */
export const listSmartyWorkouts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ workouts: SmartyWorkoutCard[] }> => {
    try {
      const db = await publicClient();
      const { data } = await db
        .from("smarty_workouts")
        .select(CARD_COLS)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return { workouts: (data ?? []) as SmartyWorkoutCard[] };
    } catch {
      return { workouts: [] };
    }
  },
);

/** Premium members (or admins / free mode) open the full workout. */
export const getSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(
    async ({ context, data }): Promise<{ workout: SmartyWorkout } | { locked: true } | { error: string }> => {
      const { getAccessStateForUser } = await import("@/lib/eligibility.server");
      const access = (await getAccessStateForUser(context.supabase as never, context.userId)) as {
        premium?: boolean;
      };
      if (!access?.premium) return { locked: true };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("smarty_workouts")
        .select("*")
        .eq("id", data.id)
        .eq("is_visible", true)
        .maybeSingle();
      if (!row) return { error: "Workout not found" };
      return { workout: row as unknown as SmartyWorkout };
    },
  );

// ---------------- Admin ----------------

export const adminListSmartyWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ workouts: SmartyWorkout[] } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("smarty_workouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return { error: error.message };
      return { workouts: (data ?? []) as unknown as SmartyWorkout[] };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

const genSchema = z.object({
  category: z.enum(SMARTY_WORKOUT_CATEGORIES),
  format: z.string().nullable(),
  focus: z.string().nullable(),
  stars: z.number().int().min(1).max(3),
  minutes: z.number().int().min(5).max(90),
  equipment: z.array(z.string()).max(12),
  location: z.string().nullable(),
  note: z.string().max(500).optional(),
  withImage: z.boolean(),
});

/** Admin: build a ready workout with the same shared engine members use, saved hidden. */
export const adminCreateSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof genSchema>) => genSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ id: string; imageError?: string } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const engine = await import("@/lib/workout/generate.server");
      const equipment = data.equipment.length ? data.equipment : ["bodyweight"];
      const bodyweightOnly = equipment.every((e) => e === "bodyweight");
      const built = await engine.generateWorkoutContent(
        supabaseAdmin as never,
        {
          category: data.category as never,
          format: (data.format as never) ?? null,
          equipmentMode: bodyweightOnly ? "BODYWEIGHT" : "EQUIPMENT",
          selectedEquipment: equipment,
          stars: data.stars,
          minutes: data.minutes,
          focus: (data.focus as never) ?? null,
          ...(data.note ? { note: data.note } : {}),
          location: data.location ?? "anywhere",
        },
        [],
      );
      const { data: row, error } = await supabaseAdmin
        .from("smarty_workouts")
        .insert({
          name: built.name,
          category: data.category,
          format: built.format,
          focus: data.focus,
          difficulty_stars: data.stars,
          duration_min: data.minutes,
          duration_label: built.duration ?? null,
          equipment,
          location: data.location,
          description_html: built.description_html,
          main_workout: built.main_workout,
          instructions_html: built.instructions_html,
          tips_html: built.tips_html,
          is_visible: false,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !row) return { error: error?.message ?? "Could not save the workout" };
      let imageError: string | undefined;
      if (data.withImage) {
        try {
          const { createSmartyWorkoutImage } = await import("@/lib/smarty-workouts-image.server");
          const url = await createSmartyWorkoutImage(supabaseAdmin as never, {
            id: row.id,
            name: built.name,
            category: data.category,
            format: built.format,
            equipment,
          });
          await supabaseAdmin.from("smarty_workouts").update({ image_url: url }).eq("id", row.id);
        } catch (e) {
          imageError = e instanceof Error ? e.message : "Picture failed";
        }
      }
      return { id: row.id, ...(imageError ? { imageError } : {}) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Generation failed" };
    }
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      name: z.string().min(1).max(200),
      category: z.enum(SMARTY_WORKOUT_CATEGORIES),
      format: z.string().nullable(),
      focus: z.string().nullable(),
      difficulty_stars: z.number().int().min(1).max(3),
      duration_min: z.number().int().min(1).max(180),
      equipment: z.array(z.string()),
      location: z.string().nullable(),
      image_url: z.string().nullable(),
      description_html: z.string().nullable(),
      main_workout: z.string().nullable(),
      instructions_html: z.string().nullable(),
      tips_html: z.string().nullable(),
      is_visible: z.boolean(),
      sort_order: z.number().int(),
    })
    .partial(),
});

export const adminUpdateSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof updateSchema>) => updateSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { error } = await context.supabase
        .from("smarty_workouts")
        .update({ ...data.patch, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const adminDeleteSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { error } = await context.supabase.from("smarty_workouts").delete().eq("id", data.id);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Admin: (re)generate the cover picture, or store an uploaded one (base64). */
export const adminSmartyWorkoutImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; upload?: { base64: string; ext: "png" | "jpg" | "webp" } }) =>
    z
      .object({
        id: z.string().uuid(),
        upload: z
          .object({ base64: z.string().max(14_000_000), ext: z.enum(["png", "jpg", "webp"]) })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ image_url: string } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const img = await import("@/lib/smarty-workouts-image.server");
      const { data: w } = await supabaseAdmin
        .from("smarty_workouts")
        .select("id,name,category,format,equipment")
        .eq("id", data.id)
        .single();
      if (!w) return { error: "Workout not found" };
      let url: string;
      if (data.upload) {
        const bin = atob(data.upload.base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        url = await img.storeSmartyWorkoutImage(supabaseAdmin as never, data.id, bytes, data.upload.ext);
      } else {
        url = await img.createSmartyWorkoutImage(supabaseAdmin as never, w as never);
      }
      await supabaseAdmin.from("smarty_workouts").update({ image_url: url }).eq("id", data.id);
      return { image_url: url };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Picture failed" };
    }
  });
