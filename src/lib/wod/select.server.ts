import type { SupabaseClient } from "@supabase/supabase-js";
import { getDayIn84Cycle, type CycleDay } from "@/lib/wod-cycle";
import { candidatesForSlot, slotsForDay, type WodCandidate, type WodSlot } from "@/lib/wod/rules";

/**
 * Shared Workout of the Day picker — same behaviour as the old SMARTY GYM
 * `select-wod-from-library`: reads the 84-day periodization for the date and
 * fills only the missing slots (BODYWEIGHT + EQUIPMENT, or one RECOVERY) from
 * the visible Smarty Workouts. Exhaustion-first rotation: never-used workouts
 * first, then the least-recently used.
 */
type DB = SupabaseClient;

export type SelectResult = {
  date: string;
  cycleDay: number;
  category: string;
  filled: { slot: WodSlot; id: string; name: string }[];
  missing: WodSlot[];
  skipped: boolean;
};

const CARD_COLUMNS = "id,name,category,difficulty_stars,location,focus,is_visible,image_url,main_workout";

export async function loadCycleDay(date: string): Promise<CycleDay> {
  const { resolveCycleDay } = await import("@/lib/settings.server");
  return resolveCycleDay(date);
}

async function loadPool(db: DB, category: string): Promise<WodCandidate[]> {
  const { data, error } = await db.from("smarty_workouts").select(CARD_COLUMNS).eq("category", category).eq("is_visible", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as WodCandidate[];
}

async function loadLedger(db: DB): Promise<Map<string, string>> {
  const last = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("wod_selection_ledger")
      .select("smarty_workout_id,selected_for_date")
      .order("selected_for_date", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as { smarty_workout_id: string; selected_for_date: string }[]) last.set(r.smarty_workout_id, r.selected_for_date);
    if (!data || data.length < 1000) break;
  }
  return last;
}

/** Puts one workout into a slot for a date (auto pick or admin override). */
export async function assignSlot(db: DB, date: string, day: CycleDay, slot: WodSlot, workoutId: string, source: "auto" | "override") {
  const row = {
    wod_date: date,
    slot,
    smarty_workout_id: workoutId,
    cycle_day: getDayIn84Cycle(date),
    category: day.category,
    difficulty: day.difficulty,
    strength_focus: day.strengthFocus ?? null,
    source,
  };
  const { error } = await db.from("wod_schedule").upsert(row as never, { onConflict: "wod_date,slot" });
  if (error) throw new Error(error.message);
  await db.from("wod_selection_ledger").upsert({ smarty_workout_id: workoutId, selected_for_date: date, slot } as never, { onConflict: "selected_for_date,slot" });
}

/**
 * Fills the missing slots for a date. `replace` clears existing auto picks first
 * (admin "Re-pick"); admin overrides are only replaced when `replaceOverrides` is set.
 */
export async function selectWodForDate(
  db: DB,
  date: string,
  opts: { replace?: boolean; replaceOverrides?: boolean; slots?: WodSlot[] } = {},
): Promise<SelectResult> {
  const day = await loadCycleDay(date);
  const wanted = slotsForDay(day).filter((s) => !opts.slots || opts.slots.includes(s));

  // A plan edit can change the slot set (e.g. a day turned into Recovery): drop stale slots.
  const allowed = slotsForDay(day);
  const { data: existingRows } = await db.from("wod_schedule").select("slot,source,smarty_workout_id").eq("wod_date", date);
  const existing = (existingRows ?? []) as { slot: WodSlot; source: string; smarty_workout_id: string }[];
  for (const r of existing) {
    const stale = !allowed.includes(r.slot);
    const clear = opts.replace && wanted.includes(r.slot) && (r.source !== "override" || opts.replaceOverrides);
    if (stale || clear) {
      await db.from("wod_schedule").delete().eq("wod_date", date).eq("slot", r.slot);
      await db.from("wod_selection_ledger").delete().eq("selected_for_date", date).eq("slot", r.slot);
    }
  }
  const { data: afterRows } = await db.from("wod_schedule").select("slot").eq("wod_date", date);
  const filledSlots = new Set(((afterRows ?? []) as { slot: string }[]).map((r) => r.slot));
  const need = wanted.filter((s) => !filledSlots.has(s));

  const result: SelectResult = { date, cycleDay: getDayIn84Cycle(date), category: day.category, filled: [], missing: [], skipped: need.length === 0 };
  if (!need.length) return result;

  const pool = await loadPool(db, day.category);
  const ledger = await loadLedger(db);
  for (const slot of need) {
    const ordered = candidatesForSlot(pool, day, slot, ledger);
    const pick = ordered[0];
    if (!pick) {
      result.missing.push(slot);
      continue;
    }
    await assignSlot(db, date, day, slot, pick.id, "auto");
    ledger.set(pick.id, date);
    result.filled.push({ slot, id: pick.id, name: pick.name });
  }
  return result;
}

/** YYYY-MM-DD `days` after the given date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
