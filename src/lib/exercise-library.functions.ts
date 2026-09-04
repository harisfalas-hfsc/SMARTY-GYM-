import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "exercise-library";
const UPSERT_BATCH = 500;

async function assertAdmin(ctx: { userId: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden: admin access required");
  return supabaseAdmin;
}

export type ExerciseLibraryStatus = {
  exercisesInDb: number;
  gifsInStorage: number;
  jsonFiles: string[];
};

/** Counts what is already in place so the admin page can show it. */
export const getExerciseLibraryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExerciseLibraryStatus> => {
    const supabaseAdmin = await assertAdmin(context as never);

    const { count } = await supabaseAdmin
      .from("exercises")
      .select("*", { count: "exact", head: true });

    let gifs = 0;
    let offset = 0;
    for (let i = 0; i < 50; i++) {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .list("gifs", { limit: 100, offset });
      if (error || !data) break;
      gifs += data.length;
      if (data.length < 100) break;
      offset += 100;
    }

    const { data: dataFiles } = await supabaseAdmin.storage
      .from(BUCKET)
      .list("data", { limit: 100 });
    const jsonFiles = (dataFiles ?? [])
      .map((f) => f.name)
      .filter((n) => n.toLowerCase().endsWith(".json"));

    return { exercisesInDb: count ?? 0, gifsInStorage: gifs, jsonFiles };
  });

type AnyRecord = Record<string, unknown>;

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function pick(r: AnyRecord, ...keys: string[]): unknown {
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== null) return r[k];
  }
  return undefined;
}

/**
 * Maps one JSON record onto the exercises table. Accepts both the normalised
 * export (snake_case) and the raw ExerciseDB-style fields (camelCase), so
 * either file version imports cleanly.
 */
function mapExercise(raw: AnyRecord): AnyRecord | null {
  const id = asString(pick(raw, "id", "exerciseId"));
  const name = asString(pick(raw, "name", "exerciseName"));
  if (!id || !name) return null;

  let gifPath = asString(pick(raw, "gif_path", "gifPath"));
  if (!gifPath) {
    const gifUrl = asString(pick(raw, "gifUrl", "gif_url", "gif"));
    if (gifUrl) {
      const file = gifUrl.split("?")[0]!.split("/").pop();
      if (file) gifPath = `gifs/${file}`;
    }
  }
  if (!gifPath) gifPath = `gifs/${id}.gif`;

  return {
    id,
    name,
    body_part: asString(pick(raw, "body_part", "bodyPart")),
    target_muscle: asString(pick(raw, "target_muscle", "target", "targetMuscle")),
    secondary_muscles: asStringArray(pick(raw, "secondary_muscles", "secondaryMuscles")),
    equipment: asString(pick(raw, "equipment")),
    category: asString(pick(raw, "category")),
    difficulty: asString(pick(raw, "difficulty", "level")),
    movement_pattern: asString(pick(raw, "movement_pattern", "movementPattern")),
    body_region: asString(pick(raw, "body_region", "bodyRegion")),
    description: asString(pick(raw, "description")),
    instructions: asStringArray(pick(raw, "instructions")),
    gif_path: gifPath,
    tags: asStringArray(pick(raw, "tags")),
    is_active: typeof raw["is_active"] === "boolean" ? raw["is_active"] : true,
    frame_start_path: asString(pick(raw, "frame_start_path", "frameStartPath")),
    frame_end_path: asString(pick(raw, "frame_end_path", "frameEndPath")),
  };
}

export type ImportResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: string[];
};

/**
 * Reads every metadata JSON stored under data/ in the exercise-library bucket
 * and upserts the rows into the exercises table the engine reads from.
 */
export const importExerciseLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImportResult> => {
    const supabaseAdmin = await assertAdmin(context as never);
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list("data", { limit: 100 });
    if (listError) return { ok: false, imported, skipped, errors: [listError.message] };

    const jsonFiles = (files ?? []).filter((f) => f.name.toLowerCase().endsWith(".json"));
    if (!jsonFiles.length) {
      return {
        ok: false,
        imported,
        skipped,
        errors: ["No metadata JSON found in the library. Upload the JSON file first."],
      };
    }

    const records: AnyRecord[] = [];
    for (const file of jsonFiles) {
      const { data: blob, error: dlError } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(`data/${file.name}`);
      if (dlError || !blob) {
        errors.push(`${file.name}: ${dlError?.message ?? "download failed"}`);
        continue;
      }
      try {
        const parsed = JSON.parse(await blob.text()) as unknown;
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray((parsed as AnyRecord)?.exercises)
            ? ((parsed as AnyRecord).exercises as unknown[])
            : Array.isArray((parsed as AnyRecord)?.data)
              ? ((parsed as AnyRecord).data as unknown[])
              : [];
        for (const item of list) {
          if (item && typeof item === "object") records.push(item as AnyRecord);
        }
      } catch (e) {
        errors.push(`${file.name}: invalid JSON (${e instanceof Error ? e.message : "parse error"})`);
      }
    }

    const rows = new Map<string, AnyRecord>();
    for (const raw of records) {
      const mapped = mapExercise(raw);
      if (!mapped) {
        skipped++;
        continue;
      }
      rows.set(mapped["id"] as string, mapped);
    }

    const all = [...rows.values()];
    for (let i = 0; i < all.length; i += UPSERT_BATCH) {
      const batch = all.slice(i, i + UPSERT_BATCH);
      const { error } = await supabaseAdmin
        .from("exercises")
        .upsert(batch as never[], { onConflict: "id" });
      if (error) {
        errors.push(`batch ${Math.floor(i / UPSERT_BATCH) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return { ok: errors.length === 0, imported, skipped, errors };
  });
