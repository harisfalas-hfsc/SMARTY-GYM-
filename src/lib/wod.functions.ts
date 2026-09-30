import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getDayIn84Cycle, localDateISO, PERIODIZATION_84DAY } from "@/lib/wod-cycle";
import type { WodSlot } from "@/lib/wod/rules";

/** Shared Workout of the Day — one pair for everyone, picked from Smarty Workouts. */

export type WodCard = {
  slot: WodSlot;
  source: string;
  workout: {
    id: string;
    name: string;
    category: string;
    format: string | null;
    focus: string | null;
    difficulty_stars: number;
    duration_min: number;
    equipment: string[];
    location: string | null;
    image_url: string | null;
  };
};

export type WodDay = {
  date: string;
  cycleDay: number;
  category: string;
  difficulty: string | null;
  focus: string | null;
  cards: WodCard[];
};

const CARD = "id,name,category,format,focus,difficulty_stars,duration_min,equipment,location,image_url";
const SLOT_ORDER: Record<string, number> = { BODYWEIGHT: 0, EQUIPMENT: 1, RECOVERY: 2 };

function shift(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function readDays(db: any, dates: string[]): Promise<WodDay[]> {
  const { resolveCycleDay } = await import("@/lib/settings.server");
  const { data, error } = await db
    .from("wod_schedule")
    .select(`wod_date,slot,source,smarty_workouts(${CARD})`)
    .in("wod_date", dates);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { wod_date: string; slot: WodSlot; source: string; smarty_workouts: WodCard["workout"] | null }[];
  return Promise.all(
    dates.map(async (date) => {
      const day = await resolveCycleDay(date);
      return {
        date,
        cycleDay: getDayIn84Cycle(date),
        category: day.category,
        difficulty: day.difficulty,
        focus: day.strengthFocus ?? null,
        cards: rows
          .filter((r) => r.wod_date === date && r.smarty_workouts)
          .sort((a, b) => (SLOT_ORDER[a.slot] ?? 9) - (SLOT_ORDER[b.slot] ?? 9))
          .map((r) => ({ slot: r.slot, source: r.source, workout: r.smarty_workouts! })),
      };
    }),
  );
}

/** Public: today's Workout of the Day cards (visible to everyone; opening needs Premium). */
export const getTodayWod = createServerFn({ method: "GET" }).handler(async (): Promise<{ today: WodDay; tomorrow: WodDay } | { error: string }> => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = localDateISO(new Date());
    let [day] = await readDays(supabaseAdmin, [today]);
    // Safety net: if tonight's pick has not run yet, fill today's missing slots now.
    const { slotsForDay } = await import("@/lib/wod/rules");
    const { resolveCycleDay } = await import("@/lib/settings.server");
    if (day && day.cards.length < slotsForDay(await resolveCycleDay(today)).length) {
      const { selectWodForDate } = await import("@/lib/wod/select.server");
      await selectWodForDate(supabaseAdmin as never, today);
      [day] = await readDays(supabaseAdmin, [today]);
    }
    const [tomorrow] = await readDays(supabaseAdmin, [shift(today, 1)]);
    // Tomorrow is shown only as the plan (category / level) — never its workouts.
    return { today: day!, tomorrow: { ...tomorrow!, cards: [] } };
  } catch (e) {
    console.error("getTodayWod", e);
    return { error: "Workout of the Day is unavailable right now." };
  }
});

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
}

export type WodAdminDay = WodDay & { expected: WodSlot[]; available: Partial<Record<WodSlot, number>> };

/** Admin: schedule window (past history + upcoming days) with coverage counts. */
export const adminWodOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from?: string; days?: number }) =>
    z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), days: z.number().int().min(1).max(84).optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ today: string; days: WodAdminDay[] } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { eligibleForSlot, slotsForDay } = await import("@/lib/wod/rules");
      const { resolveCycleDay } = await import("@/lib/settings.server");
      const today = localDateISO(new Date());
      const from = data.from ?? shift(today, -7);
      const n = data.days ?? 22;
      const dates = Array.from({ length: n }, (_, i) => shift(from, i));
      const days = await readDays(supabaseAdmin, dates);
      const { data: pool } = await supabaseAdmin
        .from("smarty_workouts")
        .select("id,name,category,difficulty_stars,location,focus,is_visible,image_url,main_workout")
        .eq("is_visible", true);
      const out: WodAdminDay[] = [];
      for (const d of days) {
        const cycle = await resolveCycleDay(d.date);
        const expected = slotsForDay(cycle);
        const available: Partial<Record<WodSlot, number>> = {};
        for (const s of expected) available[s] = eligibleForSlot((pool ?? []) as never, cycle, s).length;
        out.push({ ...d, expected, available });
      }
      return { today, days: out };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load schedule" };
    }
  });

/** Admin: every workout that fits a slot for a date (for Swap / Override). */
export const adminWodCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string; slot: WodSlot; any?: boolean }) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(["BODYWEIGHT", "EQUIPMENT", "RECOVERY"]), any: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { eligibleForSlot, slotForWorkout } = await import("@/lib/wod/rules");
      const { resolveCycleDay } = await import("@/lib/settings.server");
      const day = await resolveCycleDay(data.date);
      const { data: pool, error } = await supabaseAdmin
        .from("smarty_workouts")
        .select("id,name,category,difficulty_stars,location,focus,is_visible,image_url,main_workout,duration_min")
        .eq("is_visible", true)
        .order("name");
      if (error) return { error: error.message };
      const all = (pool ?? []) as any[];
      const list = data.any ? all.filter((w) => slotForWorkout(w) === data.slot) : eligibleForSlot(all, day, data.slot);
      const { data: used } = await supabaseAdmin.from("wod_selection_ledger").select("smarty_workout_id,selected_for_date");
      const last = new Map<string, string>();
      for (const u of (used ?? []) as { smarty_workout_id: string; selected_for_date: string }[]) {
        if ((last.get(u.smarty_workout_id) ?? "") < u.selected_for_date) last.set(u.smarty_workout_id, u.selected_for_date);
      }
      return {
        workouts: list.map((w) => ({
          id: w.id as string,
          name: w.name as string,
          category: w.category as string,
          difficulty_stars: w.difficulty_stars as number,
          focus: (w.focus ?? null) as string | null,
          duration_min: w.duration_min as number,
          lastUsed: last.get(w.id) ?? null,
        })),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Admin: override one slot with a chosen workout. */
export const adminWodAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string; slot: WodSlot; workoutId: string }) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(["BODYWEIGHT", "EQUIPMENT", "RECOVERY"]), workoutId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { assignSlot, loadCycleDay } = await import("@/lib/wod/select.server");
      const { data: w } = await supabaseAdmin.from("smarty_workouts").select("id,is_visible").eq("id", data.workoutId).maybeSingle();
      if (!w || !(w as { is_visible: boolean }).is_visible) return { error: "Only visible Smarty Workouts can be Workout of the Day." };
      await assignSlot(supabaseAdmin as never, data.date, await loadCycleDay(data.date), data.slot, data.workoutId, "override");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Admin: re-pick a date (one slot or all) with the automatic rules; clears overrides too. */
export const adminWodRepick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string; slot?: WodSlot; fillOnly?: boolean }) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(["BODYWEIGHT", "EQUIPMENT", "RECOVERY"]).optional(), fillOnly: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { selectWodForDate } = await import("@/lib/wod/select.server");
      const r = await selectWodForDate(supabaseAdmin as never, data.date, {
        replace: !data.fillOnly,
        replaceOverrides: true,
        ...(data.slot ? { slots: [data.slot] } : {}),
      });
      return { filled: r.filled.length, missing: r.missing };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Admin: the full 84-day plan with any day edits applied. */
export const adminWodPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context.supabase, context.userId);
      const { resolveFullCycle } = await import("@/lib/settings.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { eligibleForSlot, slotsForDay } = await import("@/lib/wod/rules");
      const { data: pool } = await supabaseAdmin
        .from("smarty_workouts")
        .select("id,name,category,difficulty_stars,location,focus,is_visible,image_url,main_workout")
        .eq("is_visible", true);
      const cycle = await resolveFullCycle();
      return {
        todayDay: getDayIn84Cycle(localDateISO(new Date())),
        days: cycle.map((d, i) => ({
          day: i + 1,
          category: d.category,
          difficulty: d.difficulty,
          focus: d.strengthFocus ?? null,
          edited: JSON.stringify(d) !== JSON.stringify(PERIODIZATION_84DAY[i]),
          available: slotsForDay(d).map((s) => ({ slot: s, count: eligibleForSlot((pool ?? []) as never, d, s).length })),
        })),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });
