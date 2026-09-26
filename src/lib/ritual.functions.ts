import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cyprusToday, datesForPosition, positionForDate } from "@/lib/ritual-schedule";

export type Ritual = {
  id: string;
  position: number;
  morning_content: string;
  midday_content: string;
  evening_content: string;
};

async function loadAnchor(admin: any): Promise<string> {
  const { data } = await admin.from("app_settings").select("value").eq("key", "ritual_anchor_date").maybeSingle();
  return typeof data?.value === "string" ? data.value : cyprusToday();
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
  return supabaseAdmin as any;
}

export const getTodaysRitual = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAccessStateForUser } = await import("@/lib/eligibility.server");
    const access = await getAccessStateForUser(context.supabase as never, context.userId);
    const today = cyprusToday();
    if (!access.premium) return { locked: true as const, today, ritual: null, total: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { count } = await admin.from("smarty_rituals").select("id", { count: "exact", head: true });
    const total = count ?? 0;
    if (!total) return { locked: false as const, today, ritual: null, total };
    const anchor = await loadAnchor(admin);
    const position = positionForDate(anchor, today, total);
    const { data } = await admin
      .from("smarty_rituals")
      .select("id, position, morning_content, midday_content, evening_content")
      .order("position")
      .range(position - 1, position - 1);
    return { locked: false as const, today, ritual: (data?.[0] ?? null) as Ritual | null, total };
  });

export const adminListRituals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context.userId);
    const { data, error } = await admin
      .from("smarty_rituals")
      .select("id, position, morning_content, midday_content, evening_content")
      .order("position");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Ritual[];
    const anchor = await loadAnchor(admin);
    const today = cyprusToday();
    const total = rows.length;
    return {
      today,
      rituals: rows.map((r, i) => ({
        ...r,
        number: i + 1,
        ...datesForPosition(anchor, today, i + 1, total),
      })),
    };
  });

export const adminUpdateRitual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      morning_content: z.string().max(50000),
      midday_content: z.string().max(50000),
      evening_content: z.string().max(50000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const { error } = await admin.from("smarty_rituals").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
