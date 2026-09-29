import type { SupabaseClient } from "@supabase/supabase-js";

export const SMARTY_WORKOUT_BUCKET = "smarty-workout-images";
const IMAGE_MODEL = "google/gemini-3.1-flash-image";

function prompt(w: { name: string; category: string; format: string | null; equipment: string[] }) {
  const kit = w.equipment.length ? w.equipment.join(", ") : "bodyweight only";
  return [
    "Photorealistic cover photograph for a fitness workout.",
    `Workout: "${w.name}". Category: ${w.category}. Format: ${w.format ?? "training session"}. Equipment: ${kit}.`,
    "A man and a woman training together with correct form, modern clean gym or studio,",
    "cinematic lighting with cool blue accents, wide 3:2 composition.",
    "No text, no words, no letters, no numbers, no logos, no watermarks, no borders.",
  ].join(" ");
}

/** Generates a cover image, stores it privately and returns its stable public path. */
export async function createSmartyWorkoutImage(
  db: SupabaseClient,
  w: { id: string; name: string; category: string; format: string | null; equipment: string[] },
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  let bytes: Uint8Array;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt: prompt(w), n: 1, size: "1536x1024" }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Picture service error ${res.status}`);
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("No picture was returned");
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  } finally {
    clearTimeout(timer);
  }
  return storeSmartyWorkoutImage(db, w.id, bytes, "png");
}

export async function storeSmartyWorkoutImage(
  db: SupabaseClient,
  id: string,
  bytes: Uint8Array,
  ext: "png" | "jpg" | "webp",
): Promise<string> {
  const file = `${id}-${Date.now()}.${ext}`;
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const { error } = await db.storage.from(SMARTY_WORKOUT_BUCKET).upload(file, bytes, {
    contentType: type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return `/api/public/workout-cover/${file}`;
}
