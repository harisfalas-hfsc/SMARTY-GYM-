import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The nine ready-workout categories, in page order. */
export const SMARTY_WORKOUT_CATEGORIES = [
  "STRENGTH",
  "MUSCLE BUILDING",
  "CALORIE BURNING",
  "CARDIO",
  "METABOLIC",
  "CHALLENGE",
  "MOBILITY & STABILITY",
  "PILATES",
  "RECOVERY",
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
  legacy_id?: string | null;
};

export type SmartyWorkoutCard = Pick<
  SmartyWorkout,
  "id" | "name" | "category" | "format" | "focus" | "difficulty_stars" | "duration_min" | "equipment" | "location" | "image_url"
>;

export type SmartyWorkoutCounts = {
  total: number;
  byCategory: Record<string, number>;
};

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
export const listSmartyWorkouts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; id?: string } | undefined) => ({
    category: typeof d?.category === "string" ? d.category.slice(0, 60) : undefined,
    id: typeof d?.id === "string" ? d.id.slice(0, 80) : undefined,
  }))
  .handler(
  async ({ data: filter }): Promise<{ workouts: SmartyWorkoutCard[] }> => {
    try {
      const db = await publicClient();
      let q = db.from("smarty_workouts").select(CARD_COLS).eq("is_visible", true);
      if (filter.category) q = q.eq("category", filter.category);
      if (filter.id) q = q.eq("id", filter.id);
      const { data } = await q
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return { workouts: (data ?? []) as SmartyWorkoutCard[] };
    } catch {
      return { workouts: [] };
    }
  },
);

/** Public live totals for the visible Smarty Workouts collection. */
export const getSmartyWorkoutCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<SmartyWorkoutCounts> => {
    const byCategory = Object.fromEntries(SMARTY_WORKOUT_CATEGORIES.map((category) => [category, 0]));
    try {
      const db = await publicClient();
      const { data } = await db
        .from("smarty_workouts")
        .select("category")
        .eq("is_visible", true);
      for (const row of data ?? []) {
        const category = String(row.category);
        if (category in byCategory) byCategory[category] += 1;
      }
      return { total: Object.values(byCategory).reduce((sum, count) => sum + count, 0), byCategory };
    } catch {
      return { total: 0, byCategory };
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

const dupSchema = z.object({ source: z.enum(["smarty", "member"]), id: z.string().uuid() });

/** Copies a Smarty Workout or a member's workout into a new hidden Smarty Workout draft. */
export const adminDuplicateSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof dupSchema>) => dupSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ id: string } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const table = data.source === "smarty" ? "smarty_workouts" : "workouts";
      const { data: src, error: readErr } = await supabaseAdmin
        .from(table as "smarty_workouts")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (readErr) return { error: readErr.message };
      if (!src) return { error: "Workout not found" };
      const s = src as Record<string, unknown>;
      const cats = SMARTY_WORKOUT_CATEGORIES as readonly string[];
      const rawCat = String(s["category"] ?? "").toUpperCase();
      const category = cats.includes(rawCat) ? rawCat : "STRENGTH";
      const str = (k: string) => (s[k] == null ? null : String(s[k]));
      const { LEGAL_FORMATS } = await import("@/lib/workout/doctrine");
      const legalFormats = LEGAL_FORMATS[category as keyof typeof LEGAL_FORMATS] ?? ["REPS & SETS"];
      const sourceFormat = str("format");
      const format = sourceFormat && (legalFormats as readonly string[]).includes(sourceFormat) ? sourceFormat : legalFormats[0] ?? null;
      const { data: row, error } = await supabaseAdmin
        .from("smarty_workouts")
        .insert({
          name: `${String(s["name"] ?? "Workout")} (copy)`.slice(0, 200),
          category,
          format,
          focus: str("focus"),
          difficulty_stars: Math.min(3, Math.max(1, Number(s["difficulty_stars"] ?? 2) || 2)),
          duration_min: Math.min(180, Math.max(1, Number(s["duration_min"] ?? 30) || 30)),
          duration_label: str("duration_label"),
          equipment: Array.isArray(s["equipment"]) ? (s["equipment"] as string[]) : [],
          location: str("location"),
          image_url: str("image_url"),
          description_html: str("description_html"),
          main_workout: str("main_workout"),
          instructions_html: str("instructions_html"),
          tips_html: str("tips_html"),
          is_visible: false,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !row) return { error: error?.message ?? "Could not duplicate the workout" };
      return { id: row.id };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

const blankSchema = z.object({ main_workout: z.string().max(20000) });

/** Manual creation: a hidden draft the admin fills in themselves in the editor (no AI). */
export const adminCreateBlankSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof blankSchema>) => blankSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ id: string } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { data: row, error } = await context.supabase
        .from("smarty_workouts")
        .insert({
          name: "New Workout",
          category: "STRENGTH",
          format: "REPS & SETS",
          focus: null,
          difficulty_stars: 2,
          duration_min: 30,
          duration_label: "30 min",
          equipment: ["bodyweight"],
          location: "anywhere",
          description_html: "",
          main_workout: data.main_workout,
          instructions_html: "",
          tips_html: "",
          is_visible: false,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !row) return { error: error?.message ?? "Could not create the workout" };
      return { id: row.id };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
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
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
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
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("smarty_workouts").delete().eq("id", data.id);
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

/**
 * Premium members start a ready workout: it is copied, unchanged, into their
 * own logbook so it gets the same page, player, logging, rating, schedule and
 * completion as every other workout. Tagged created_by "smarty:<id>" so it
 * can never be shared to the community. Reuses an unfinished copy.
 */
export const startSmartyWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ workoutId: string } | { locked: true } | { error: string }> => {
    const { getAccessStateForUser } = await import("@/lib/eligibility.server");
    const access = (await getAccessStateForUser(context.supabase as never, context.userId)) as { premium?: boolean };
    if (!access?.premium) return { locked: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tag = `smarty:${data.id}`;
    const { data: existing } = await supabaseAdmin
      .from("workouts")
      .select("id")
      .eq("user_id", context.userId)
      .eq("created_by", tag)
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { workoutId: (existing as { id: string }).id };
    const { data: previousFavorite } = await supabaseAdmin.from("workouts").select("is_favorite").eq("user_id", context.userId).eq("created_by", tag).eq("is_favorite", true).limit(1).maybeSingle();
    const { data: src } = await supabaseAdmin
      .from("smarty_workouts")
      .select("*")
      .eq("id", data.id)
      .eq("is_visible", true)
      .maybeSingle();
    if (!src) return { error: "Workout not found" };
    const s = src as unknown as SmartyWorkout & { description?: string | null };
    const { data: created, error } = await supabaseAdmin
      .from("workouts")
      .insert({
        user_id: context.userId,
        status: "created",
        created_by: tag,
        is_shared: false,
        is_wod: false,
        is_favorite: Boolean(previousFavorite),
        name: s.name,
        category: s.category,
        format: s.format,
        focus: s.focus,
        difficulty_stars: s.difficulty_stars,
        duration_min: s.duration_min,
        duration_label: s.duration_label,
        equipment: s.equipment ?? [],
        location: s.location,
        image_url: s.image_url,
        description_html: s.description_html,
        instructions_html: s.instructions_html,
        tips_html: s.tips_html,
        main_workout: s.main_workout,
        tips: [],
        plan: {},
      } as never)
      .select("id")
      .single();
    if (error) return { error: "Could not start this workout. Please try again." };
    return { workoutId: (created as { id: string }).id };
  });

/** Favourite a ready workout directly from its discovery card. */
export const setSmartyWorkoutFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; favorite: boolean }) =>
    z.object({ id: z.string().uuid(), favorite: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ workoutId: string; favorite: boolean } | { locked: true } | { error: string }> => {
    const { getAccessStateForUser } = await import("@/lib/eligibility.server");
    const access = (await getAccessStateForUser(context.supabase as never, context.userId)) as { premium?: boolean };
    if (!access?.premium) return { locked: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tag = `smarty:${data.id}`;
    const { data: existing } = await supabaseAdmin
      .from("workouts")
      .select("id")
      .eq("user_id", context.userId)
      .eq("created_by", tag)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const workoutId = (existing as { id: string }).id;
      const { error } = await supabaseAdmin
        .from("workouts")
        .update({ is_favorite: data.favorite })
        .eq("id", workoutId)
        .eq("user_id", context.userId);
      if (error) return { error: "Could not update this favourite." };
      return { workoutId, favorite: data.favorite };
    }

    if (!data.favorite) return { error: "Could not find this favourite." };

    const { data: src } = await supabaseAdmin
      .from("smarty_workouts")
      .select("*")
      .eq("id", data.id)
      .eq("is_visible", true)
      .maybeSingle();
    if (!src) return { error: "Workout not found" };
    const s = src as unknown as SmartyWorkout & { description?: string | null };
    const { data: created, error } = await supabaseAdmin
      .from("workouts")
      .insert({
        user_id: context.userId,
        status: "created",
        created_by: tag,
        is_favorite: true,
        is_shared: false,
        is_wod: false,
        name: s.name,
        category: s.category,
        format: s.format,
        focus: s.focus,
        difficulty_stars: s.difficulty_stars,
        duration_min: s.duration_min,
        duration_label: s.duration_label,
        equipment: s.equipment ?? [],
        location: s.location,
        image_url: s.image_url,
        description_html: s.description_html,
        instructions_html: s.instructions_html,
        tips_html: s.tips_html,
        main_workout: s.main_workout,
        tips: [],
        plan: {},
      } as never)
      .select("id")
      .single();
    if (error || !created) return { error: "Could not save this favourite." };
    return { workoutId: (created as { id: string }).id, favorite: true };
  });

// ---------- Permanent transferred-workout validation and visibility ----------

async function loadLibrary(db: any): Promise<Array<{ id: string; name: string }>> {
  const out: Array<{ id: string; name: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("exercises").select("id,name").eq("is_active", true).range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function loadAllSmarty(db: any): Promise<Array<{ id: string; name: string; category: string; is_visible: boolean; main_workout: string | null }>> {
  const out: any[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db
      .from("smarty_workouts")
      .select("id,name,category,is_visible,main_workout")
      .order("name")
      .range(from, from + 499);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return out;
}

export type WorkoutCheckReport = {
  total: number;
  clean: number;
  visible: number;
  visibleWithIssues: number;
  names: Array<{ name: string; lines: number; workouts: number }>;
  workouts: Array<{ id: string; name: string; category: string; is_visible: boolean; issues: Array<{ kind: string; section: string; text: string }> }>;
};

async function transferredWorkoutAudit(db: any) {
  const { data: rows, error: workoutError } = await db.from("smarty_workouts").select("*").order("created_at");
  if (workoutError) throw new Error(workoutError.message);
  const exercises: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("exercises").select("id,name,description,instructions,gif_path,is_active").range(from, from + 999);
    if (error) throw new Error(error.message);
    exercises.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const { auditTransferredWorkouts } = await import("@/lib/workout/smarty-transfer-audit");
  return auditTransferredWorkouts(rows ?? [], exercises);
}

export const adminAuditTransferredWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return { report: await transferredWorkoutAudit(supabaseAdmin) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Audit failed" };
    }
  });

export const adminSetTransferredVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { visible: boolean }) => z.object({ visible: z.boolean() }).parse(d))
  .handler(async ({ context, data }): Promise<{ count: number } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin.from("smarty_workouts").update({ is_visible: data.visible, updated_at: new Date().toISOString() });
      if (data.visible) {
        const report = await transferredWorkoutAudit(supabaseAdmin);
        const failing = report.workouts.filter((w) => w.issues.length > 0).map((w) => w.id);
        if (failing.length) q = q.not("id", "in", `(${failing.join(",")})`);
      } else {
        q = q.not("id", "is", null);
      }
      const { data: changed, error } = await q.select("id");
      if (error) return { error: error.message };
      return { count: changed?.length ?? 0 };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Visibility update failed" };
    }
  });

/** Admin: checks every Smarty Workout for lines the player cannot play. */
export const adminCheckSmartyWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ report: WorkoutCheckReport } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { auditWorkoutHtml, primaryName } = await import("@/lib/workout/link-names");
      const lib = await loadLibrary(supabaseAdmin);
      const ids = new Set(lib.map((e) => e.id));
      const rows = await loadAllSmarty(supabaseAdmin);
      const names = new Map<string, { lines: number; workouts: Set<string> }>();
      const workouts: WorkoutCheckReport["workouts"] = [];
      for (const r of rows) {
        const issues = auditWorkoutHtml(r.main_workout ?? "", ids);
        for (const i of issues) {
          if (i.kind !== "unlinked") continue;
          const n = primaryName(i.text);
          const e = names.get(n) ?? { lines: 0, workouts: new Set<string>() };
          e.lines += 1;
          e.workouts.add(r.id);
          names.set(n, e);
        }
        if (issues.length) workouts.push({ id: r.id, name: r.name, category: r.category, is_visible: r.is_visible, issues });
      }
      return {
        report: {
          total: rows.length,
          clean: rows.length - workouts.length,
          visible: rows.filter((r) => r.is_visible).length,
          visibleWithIssues: workouts.filter((w) => w.is_visible).length,
          names: [...names].map(([name, v]) => ({ name, lines: v.lines, workouts: v.workouts.size })).sort((a, b) => b.lines - a.lines),
          workouts,
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Check failed" };
    }
  });

/** Admin: links one unmatched exercise name to a library exercise in every Smarty Workout. */
export const adminLinkExerciseEverywhere = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; exerciseId: string }) =>
    z.object({ name: z.string().min(1).max(120), exerciseId: z.string().min(1).max(20) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ workouts: number; lines: number } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { linkExerciseLines, normName } = await import("@/lib/workout/link-names");
      const { data: ex } = await supabaseAdmin.from("exercises").select("id,name").eq("id", data.exerciseId).eq("is_active", true).maybeSingle();
      if (!ex) return { error: "That exercise is not in the library." };
      const entry = ex as { id: string; name: string };
      const idx = new Map([[normName(data.name), entry]]);
      const rows = await loadAllSmarty(supabaseAdmin);
      let workouts = 0;
      let lines = 0;
      for (const r of rows) {
        const res = linkExerciseLines(r.main_workout ?? "", idx);
        if (!res.linked) continue;
        const { error } = await supabaseAdmin.from("smarty_workouts").update({ main_workout: res.html }).eq("id", r.id);
        if (error) return { error: error.message };
        // Members' not-yet-started copies get the same fix.
        await supabaseAdmin
          .from("workouts")
          .update({ main_workout: res.html })
          .eq("created_by", `smarty:${r.id}`)
          .in("status", ["created", "ready"]);
        workouts += 1;
        lines += res.linked;
      }
      return { workouts, lines };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Admin: publishes every hidden Smarty Workout that passes the check. */
export const adminPublishCheckedWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number; held: number } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { auditWorkoutHtml } = await import("@/lib/workout/link-names");
      const ids = new Set((await loadLibrary(supabaseAdmin)).map((e) => e.id));
      const hidden = (await loadAllSmarty(supabaseAdmin)).filter((r) => !r.is_visible);
      const ok = hidden.filter((r) => auditWorkoutHtml(r.main_workout ?? "", ids).length === 0).map((r) => r.id);
      for (let i = 0; i < ok.length; i += 100) {
        const { error } = await supabaseAdmin.from("smarty_workouts").update({ is_visible: true }).in("id", ok.slice(i, i + 100));
        if (error) return { error: error.message };
      }
      return { count: ok.length, held: hidden.length - ok.length };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });
