// Publishing gate for Smarty Workouts: a workout (AI-built or written by hand
// in "Create it myself") can only be visible when it passes the same hard rules
// the generator obeys — complianceIssues() is built on the one rule engine.
import { complianceIssues, hardIssues, type ComplianceExercise, type ComplianceWorkout } from "@/lib/workout/smarty-compliance";
import { publicationRuleReports } from "@/lib/workout/publication-report";

async function loadRuleLibrary(db: any): Promise<ComplianceExercise[]> {
  const out: ComplianceExercise[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("exercises").select("*").eq("is_active", true).range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const COLS = "id,name,category,format,difficulty_stars,duration_min,equipment,main_workout,is_visible";

/** Rule breaks that block publishing this workout after `patch` is applied (empty = may publish). */
export async function publishRuleBreaks(db: any, id: string, patch: Record<string, unknown>): Promise<string[]> {
  const { data: row, error } = await db.from("smarty_workouts").select(COLS).eq("id", id).single();
  if (error || !row) throw new Error(error?.message ?? "Workout not found");
  const next = { ...row, ...patch } as ComplianceWorkout & { is_visible: boolean };
  if (!next.is_visible) return [];
  const library = await loadRuleLibrary(db);
  const breaks = hardIssues(complianceIssues(next, library));
  return publicationRuleReports(next, library, breaks);
}

/** Ids of every workout that breaks the hard rules (used by Show all). */
export async function ruleFailingIds(db: any): Promise<string[]> {
  const lib = await loadRuleLibrary(db);
  const map = new Map(lib.map((e) => [e.id, e]));
  const out: string[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db.from("smarty_workouts").select(COLS).range(from, from + 499);
    if (error) throw new Error(error.message);
    for (const w of data ?? []) if (hardIssues(complianceIssues(w, lib, map)).length) out.push(w.id);
    if (!data || data.length < 500) break;
  }
  return out;
}
