/**
 * Background SEO optimizer for shared (public) workouts.
 *
 * Every workout a member shares with the Smarty Community becomes a public page,
 * so once a week the newest shared workouts get their own search title,
 * description and key phrases stored in `workout_seo`. Values are rendered as
 * invisible head data by /community/workout/$workoutId.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiTerminalError, generateSeoJson } from "@/lib/seo/ai.server";
import { contentHash } from "@/lib/seo/article-optimizer.server";

type DB = SupabaseClient;

export const WORKOUT_BATCH_SIZE = 8;
const LEASE_KEY = "workout-seo";
const LEASE_MINUTES = 15;

interface WorkoutRow {
  id: string;
  name: string;
  category: string | null;
  format: string | null;
  focus: string | null;
  difficulty_stars: number | null;
  duration_min: number | null;
  equipment: string[] | null;
  location: string | null;
  description: string | null;
}

const SCHEMA = {
  name: "workout_seo",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["seo_title", "seo_description", "seo_keywords"],
    properties: {
      seo_title: { type: "string" },
      seo_description: { type: "string" },
      seo_keywords: { type: "array", items: { type: "string" } },
    },
  },
} as const;

const INSTRUCTIONS = [
  "You write search titles and descriptions for individual workout pages on SmartyGym, for Google, Bing and AI answer engines.",
  "seo_title: at most 60 characters, describes the session by what it trains, its format and its length (for example 'Full-Body Strength Circuit — 45 min, Dumbbells').",
  "seo_description: 140-158 characters, says who the session suits, what it trains, the equipment needed and the duration.",
  "seo_keywords: 6-10 lowercase search phrases a person would type to find this session.",
  "No emojis, no quotes, no invented claims — use only the facts given.",
].join("\n");

function workoutHash(w: WorkoutRow): string {
  return contentHash(
    [
      w.name,
      w.category,
      w.format,
      w.focus,
      w.difficulty_stars,
      w.duration_min,
      (w.equipment ?? []).join(","),
      w.location,
      (w.description ?? "").slice(0, 2000),
    ].join("|"),
  );
}

export interface WorkoutSeoResult {
  status: "ok" | "skipped" | "paused" | "failed";
  optimized: number;
  remaining: number;
  failures: string[];
  summary: string;
}

export async function optimizeSharedWorkouts(
  db: DB,
  options: { limit?: number } = {},
): Promise<WorkoutSeoResult> {
  const failures: string[] = [];
  const now = new Date();

  const { data: state } = await db
    .from("seo_state")
    .select("lease_until, paused_reason")
    .eq("key", LEASE_KEY)
    .maybeSingle();
  if (state?.lease_until && new Date(state.lease_until) > now) {
    return {
      status: "skipped",
      optimized: 0,
      remaining: 0,
      failures: [],
      summary: "Another shared-workout optimization run is still in progress.",
    };
  }
  const paused = state?.paused_reason ?? null;
  const limit = paused ? 1 : (options.limit ?? WORKOUT_BATCH_SIZE);
  await db.from("seo_state").upsert(
    { key: LEASE_KEY, lease_until: new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString() },
    { onConflict: "key" },
  );

  try {
    const { data, error } = await db
      .from("community_workouts_public")
      .select(
        "id, name, category, format, focus, difficulty_stars, duration_min, equipment, location, description",
      )
      .order("shared_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as WorkoutRow[];
    if (!rows.length) {
      return {
        status: "ok",
        optimized: 0,
        remaining: 0,
        failures: [],
        summary: "No shared workouts to optimize yet.",
      };
    }

    const { data: existing } = await db
      .from("workout_seo")
      .select("workout_id, content_hash")
      .in(
        "workout_id",
        rows.map((r) => r.id),
      );
    const known = new Map(
      ((existing ?? []) as { workout_id: string; content_hash: string | null }[]).map((e) => [
        e.workout_id,
        e.content_hash,
      ]),
    );

    const pending = rows.filter((r) => known.get(r.id) !== workoutHash(r));
    const batch = pending.slice(0, limit);
    let optimized = 0;

    for (const workout of batch) {
      try {
        const payload = await generateSeoJson<{
          seo_title: string;
          seo_description: string;
          seo_keywords: string[];
        }>({
          instructions: INSTRUCTIONS,
          schema: SCHEMA as unknown as { name: string; schema: Record<string, unknown> },
          input: [
            `Name: ${workout.name}`,
            `Category: ${workout.category ?? "-"}`,
            `Format: ${workout.format ?? "-"}`,
            `Focus: ${workout.focus ?? "-"}`,
            `Difficulty: ${workout.difficulty_stars ?? "-"} of 5`,
            `Duration: ${workout.duration_min ?? "-"} minutes`,
            `Location: ${workout.location ?? "-"}`,
            `Equipment: ${(workout.equipment ?? []).join(", ") || "none"}`,
            `Description: ${(workout.description ?? "").slice(0, 1200)}`,
          ].join("\n"),
        });

        const { error: upsertError } = await db.from("workout_seo").upsert(
          {
            workout_id: workout.id,
            seo_title: payload.seo_title.slice(0, 70),
            seo_description: payload.seo_description.slice(0, 175),
            seo_keywords: (payload.seo_keywords ?? []).slice(0, 12),
            content_hash: workoutHash(workout),
            optimized_at: new Date().toISOString(),
          },
          { onConflict: "workout_id" },
        );
        if (upsertError) throw new Error(upsertError.message);
        optimized += 1;
        if (paused) {
          await db
            .from("seo_state")
            .upsert({ key: LEASE_KEY, paused_reason: null }, { onConflict: "key" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push(`${workout.name}: ${message}`);
        if (err instanceof AiTerminalError && (err.status === 402 || err.status === 403)) {
          await db
            .from("seo_state")
            .upsert(
              { key: LEASE_KEY, lease_until: null, paused_reason: message },
              { onConflict: "key" },
            );
          return {
            status: "paused",
            optimized,
            remaining: pending.length - optimized,
            failures,
            summary: `Shared-workout optimization paused: ${message}`,
          };
        }
        break;
      }
    }

    const remaining = Math.max(pending.length - optimized, 0);
    return {
      status: failures.length && !optimized ? "failed" : "ok",
      optimized,
      remaining,
      failures,
      summary: optimized
        ? `Optimized ${optimized} shared workout${optimized === 1 ? "" : "s"}${remaining ? `, ${remaining} still queued` : ""}.`
        : remaining
          ? `Nothing optimized, ${remaining} shared workout(s) still queued.`
          : "Every shared workout is already optimized.",
    };
  } finally {
    await db.from("seo_state").upsert({ key: LEASE_KEY, lease_until: null }, { onConflict: "key" });
  }
}
