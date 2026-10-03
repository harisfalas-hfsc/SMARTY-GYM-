import type { SupabaseClient } from "@supabase/supabase-js";
import { storeSmartyWorkoutImage } from "./smarty-workouts-image.server";

/** One-off importer: old SMARTYGYM admin_workouts → smarty_workouts (hidden, idempotent via legacy_id). */
const OLD_URL = "https://cvccrvyimyzrxcwzmxwk.supabase.co";
const OLD_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2NydnlpbXl6cnhjd3pteHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTc2NjIsImV4cCI6MjA3NjE5MzY2Mn0.XU_h4CYRiQ7VN079laFHSVMrzB6urOhQZFoTagU_Wno";

const CATEGORY_MAP: Record<string, string> = {
  STRENGTH: "STRENGTH",
  CHALLENGE: "CHALLENGE",
  "CALORIE BURNING": "CALORIE BURNING",
  METABOLIC: "METABOLIC",
  CARDIO: "CARDIO",
  "MOBILITY & STABILITY": "MOBILITY & STABILITY",
  PILATES: "PILATES",
  RECOVERY: "RECOVERY",
};
const SETS_AND_REPS = new Set(["STRENGTH", "MUSCLE BUILDING", "MOBILITY & STABILITY", "PILATES"]);

export type OldWorkout = Record<string, unknown> & { id: string; name: string; category: string | null };
export type ImportReport = {
  found: number;
  imported: number;
  updated: number;
  skipped: number;
  missingImages: string[];
  unmatchedExercises: number;
  byCategory: Record<string, number>;
};

export async function fetchOldWorkouts(email: string, password: string, anonKey: string = OLD_ANON) {
  const auth = await fetch(`${OLD_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!auth.ok) throw new Error(`Old SMARTYGYM sign-in failed (${auth.status})`);
  const { access_token } = (await auth.json()) as { access_token: string };
  const res = await fetch(`${OLD_URL}/rest/v1/admin_workouts?select=*&limit=2000`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error(`Could not read old workouts (${res.status})`);
  return (await res.json()) as OldWorkout[];
}

function equipToken(e: string): string | null {
  const s = e.toLowerCase();
  if (s.includes("body weight") || s.includes("assisted")) return null;
  if (s.includes("dumbbell")) return "dumbbells";
  if (s.includes("kettlebell")) return "kettlebells";
  if (s.includes("barbell") || s.includes("trap bar")) return "barbell";
  if (s.includes("band")) return "bands";
  if (/cable|leverage|smith|sled|machine|ergometer|skierg/.test(s)) return "machines";
  return "other";
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

export function transformOld(o: OldWorkout, exercises: Map<string, string | null>) {
  const category = CATEGORY_MAP[String(o.category ?? "").toUpperCase()];
  if (!category) return null;
  let unmatched = 0;
  const kit = new Set<string>();
  const fix = (html: string | null) =>
    html?.replace(/\{\{exercise:([^:}]+):([^}]*)\}\}/g, (m, id: string, name: string) => {
      if (exercises.has(id)) {
        const t = equipToken(exercises.get(id) ?? "body weight");
        if (t) kit.add(t);
        return m;
      }
      unmatched += 1;
      return name;
    }) ?? null;
  const parts = ["warm_up", "activation", "main_workout", "finisher", "cool_down"]
    .map((k) => fix(str(o[k])))
    .filter(Boolean);
  const bodyweight = String(o.equipment ?? "").toUpperCase() === "BODYWEIGHT";
  const equipment = bodyweight ? ["bodyweight"] : kit.size ? [...kit] : ["other"];
  const lvl = String(o.difficulty ?? "").toLowerCase();
  const stars = Number(o.difficulty_stars ?? 0);
  const difficulty =
    lvl === "beginner" ? 1 : lvl === "intermediate" ? 2 : lvl === "advanced" ? 3 : stars ? (stars <= 2 ? 1 : stars <= 4 ? 2 : 3) : 2;
  const dur = String(o.duration ?? "");
  const minutes = Math.min(180, Math.max(1, parseInt(dur, 10) || 30));
  return {
    row: {
      legacy_id: o.id,
      name: String(o.name).slice(0, 200),
      category,
      format: SETS_AND_REPS.has(category) ? "REPS & SETS" : str(o.format),
      focus: str(o.focus),
      difficulty_stars: difficulty,
      duration_min: minutes,
      duration_label: /\d/.test(dur) ? dur : `${minutes} min`,
      equipment,
      location: bodyweight ? "anywhere" : "gym",
      description_html: fix(str(o.description)),
      main_workout: parts.join(""),
      instructions_html: fix(str(o.instructions)),
      tips_html: fix(str(o.tips)),
    },
    unmatched,
    imageUrl: str(o.image_url),
  };
}

export async function importOldWorkouts(db: SupabaseClient, old: OldWorkout[], createdBy: string | null) {
  const { data: ex } = await db.from("exercises").select("id,equipment").limit(5000);
  const exercises = new Map<string, string | null>((ex ?? []).map((e: { id: string; equipment: string | null }) => [e.id, e.equipment]));
  const { data: existing } = await db.from("smarty_workouts").select("id,legacy_id,image_url").not("legacy_id", "is", null);
  const byLegacy = new Map((existing ?? []).map((r: { id: string; legacy_id: string; image_url: string | null }) => [r.legacy_id, r]));
  const report: ImportReport = { found: old.length, imported: 0, updated: 0, skipped: 0, missingImages: [], unmatchedExercises: 0, byCategory: {} };

  for (const o of old) {
    const t = transformOld(o, exercises);
    if (!t) { report.skipped += 1; continue; }
    report.unmatchedExercises += t.unmatched;
    const prev = byLegacy.get(o.id);
    let id: string;
    if (prev) {
      const { error } = await db.from("smarty_workouts").update(t.row).eq("id", prev.id);
      if (error) throw new Error(`${o.name}: ${error.message}`);
      id = prev.id;
      report.updated += 1;
    } else {
      const { data, error } = await db
        .from("smarty_workouts")
        .insert({ ...t.row, is_visible: false, created_by: createdBy })
        .select("id")
        .single();
      if (error || !data) throw new Error(`${o.name}: ${error?.message}`);
      id = data.id;
      report.imported += 1;
    }
    report.byCategory[t.row.category] = (report.byCategory[t.row.category] ?? 0) + 1;
    if (!prev?.image_url) {
      try {
        if (!t.imageUrl) throw new Error("none");
        const res = await fetch(t.imageUrl);
        if (!res.ok) throw new Error(String(res.status));
        const type = res.headers.get("content-type") ?? "";
        const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
        const url = await storeSmartyWorkoutImage(db, id, new Uint8Array(await res.arrayBuffer()), ext);
        await db.from("smarty_workouts").update({ image_url: url }).eq("id", id);
      } catch {
        report.missingImages.push(o.name);
      }
    }
  }
  return report;
}
