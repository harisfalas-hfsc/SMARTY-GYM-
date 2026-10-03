// Logbook derivations, kept out of the route so they can be tested.
// The route is composition only: it must not decide what "planned" means.

import { scheduleTone } from "@/lib/date-format";

export type LogbookRow = {
  id: string;
  name: string;
  status: string;
  category?: string | null;
  is_favorite: boolean | null;
  is_wod: boolean | null;
  created_by: string | null;
  equipment: string[] | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type LogbookFilter = "completed" | "planned" | "favorites" | "scheduled";

export const LOGBOOK_FILTERS: { id: LogbookFilter; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "planned", label: "Not done" },
  { id: "scheduled", label: "Scheduled" },
  { id: "favorites", label: "Favourites" },
];

export const LOGBOOK_FILTER_IDS = LOGBOOK_FILTERS.map((f) => f.id) as string[];

export function parseFilters(value: string | null | undefined): LogbookFilter[] {
  return String(value ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter((f) => LOGBOOK_FILTER_IDS.includes(f)) as LogbookFilter[];
}

export function matchesFilter(row: LogbookRow, filter: LogbookFilter): boolean {
  if (filter === "completed") return row.status === "completed";
  if (filter === "planned") return row.status !== "completed";
  if (filter === "favorites") return Boolean(row.is_favorite);
  return Boolean(row.scheduled_at);
}

export type LogbookSource = "smarty" | "coach" | "own";

export const LOGBOOK_SOURCES: { id: LogbookSource; label: string }[] = [
  { id: "smarty", label: "Smarty Workouts" },
  { id: "coach", label: "Smarty Coach" },
  { id: "own", label: "My Own Workouts" },
];

export const LOGBOOK_SOURCE_IDS = LOGBOOK_SOURCES.map((s) => s.id) as string[];

export function parseSources(value: string | null | undefined): LogbookSource[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => LOGBOOK_SOURCE_IDS.includes(s)) as LogbookSource[];
}

/** Where a logbook workout came from. Community copies stay visible under "All". */
export function workoutSource(row: LogbookRow): LogbookSource | "community" {
  if (row.is_wod || String(row.created_by ?? "").startsWith("smarty:")) return "smarty";
  if (row.created_by === "member" || row.created_by === "community") return "community";
  if (row.category === "MY OWN WORKOUT") return "own";
  return "coach";
}

/** Status filters combine as "any of"; source and equipment narrow the result. */
export function filterRows<T extends LogbookRow>(
  rows: readonly T[],
  options: { filters: LogbookFilter[]; sources?: LogbookSource[]; equipment?: string },
): T[] {
  const byStatus = options.filters.length
    ? rows.filter((r) => options.filters.some((f) => matchesFilter(r, f)))
    : [...rows];
  const bySource = options.sources?.length
    ? byStatus.filter((r) => options.sources!.includes(workoutSource(r) as LogbookSource))
    : byStatus;
  const equip = options.equipment ?? "all";
  return equip === "all" ? bySource : bySource.filter((r) => (r.equipment ?? []).includes(equip));
}

export function equipmentOptions(rows: readonly LogbookRow[]): string[] {
  return Array.from(new Set(rows.flatMap((r) => r.equipment ?? []).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Which calendar day a workout belongs to: when you plan it, else when it happened. */
export function anchorDate(row: LogbookRow): Date {
  return new Date(row.scheduled_at ?? row.completed_at ?? row.created_at);
}

export function sourceLabel(row: LogbookRow): string {
  if (row.is_wod) return "Workout of the Day";
  if (row.created_by === "member" || row.created_by === "community") return "Community copy";
  if (String(row.created_by ?? "").startsWith("smarty:")) return "Smarty Workout";
  if (row.category === "MY OWN WORKOUT") return "Created by me";
  return "Created by Smarty Coach";
}

/**
 * Smarty Workouts are general workouts. Opening one creates a private copy,
 * but it only belongs in the logbook once the member does something with it:
 * completes, favourites, schedules or starts it.
 */
export function belongsInLogbook(row: Pick<LogbookRow, "created_by" | "status" | "is_favorite" | "scheduled_at">): boolean {
  if (!String(row.created_by ?? "").startsWith("smarty:")) return true;
  return (
    row.status === "completed" ||
    Boolean(row.is_favorite) ||
    Boolean(row.scheduled_at) ||
    (row.status !== "created" && row.status !== "ready")
  );
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Colour of the dot a workout gets in the calendar. */
export function dotClass(row: LogbookRow): string {
  if (row.status === "completed") return "bg-primary";
  const tone = scheduleTone(row.scheduled_at, false);
  if (tone === "missed") return "bg-red-500";
  if (tone === "today") return "bg-blue-500";
  if (tone === "upcoming") return "bg-emerald-500";
  return "bg-muted-foreground/50";
}

export function filterMenuLabel(filters: LogbookFilter[], equipment: string): string {
  const base =
    filters.length === 0
      ? "All workouts"
      : filters.length === 1
        ? (LOGBOOK_FILTERS.find((f) => f.id === filters[0])?.label ?? "All workouts")
        : `${filters.length} filters`;
  return equipment === "all" ? base : `${base} · ${equipment}`;
}
