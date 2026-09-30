import { LEGAL_FORMATS } from "./doctrine";
import { extractSoftTissue, parseWorkoutSteps } from "./parse-steps";
import { canonicalSection, type Category, type Format } from "./spec";
import { findTokens } from "./tokens";

export type TransferWorkout = { id: string; legacy_id: string | null; name: string; category: string; format: string | null; difficulty_stars: number; duration_min: number; equipment: string[]; image_url: string | null; description_html: string | null; instructions_html: string | null; tips_html: string | null; main_workout: string | null; is_visible: boolean };
export type TransferExercise = { id: string; name: string; description: string | null; instructions: string[] | null; gif_path: string | null; is_active: boolean };
export type TransferAuditReport = { total: number; clean: number; visible: number; ready: boolean; referencedExercises: number; visualDemonstrations: number; guidedDemonstrations: number; missingDemonstrations: number; workouts: Array<{ id: string; name: string; issues: string[] }> };

const EXPECTED = ["Soft Tissue Preparation", "Activation", "Main Workout", "Cool-down"] as const;
const strip = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export function sectionSequence(html: string): string[] {
  const sections: string[] = [];
  for (const match of html.matchAll(/<(h[1-4]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = (match[1] ?? "").toLowerCase();
    const text = strip(match[2] ?? "");
    const looksLikeHeading = tag.startsWith("h") || /^[🧽🔥💪⚡🧘]/u.test(text) || /^(soft tissue preparation|activation|main workout|finisher|cool[- ]?down)\s*:?$/i.test(text);
    const section = looksLikeHeading ? canonicalSection(text) : null;
    if (section && section !== "Warm-up") sections.push(section);
  }
  return sections;
}

export function hasExerciseDemonstration(exercise: TransferExercise): boolean {
  return Boolean(exercise.gif_path?.trim()) || Boolean(exercise.description?.trim() && (exercise.instructions?.length ?? 0) >= 3);
}

export function auditTransferredWorkouts(rows: TransferWorkout[], exercises: TransferExercise[]): TransferAuditReport {
  const imported = rows.filter((row) => Boolean(row.legacy_id));
  const library = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const duplicateLegacy = new Set<string>();
  const seenLegacy = new Set<string>();
  for (const row of imported) {
    const legacyId = row.legacy_id ?? "";
    if (seenLegacy.has(legacyId)) duplicateLegacy.add(legacyId);
    seenLegacy.add(legacyId);
  }
  const referenced = new Set<string>();
  const workouts: TransferAuditReport["workouts"] = [];
  for (const row of imported) {
    const issues: string[] = [];
    const html = row.main_workout ?? "";
    const legal = LEGAL_FORMATS[row.category as Category] ?? [];
    if (!row.format || !legal.includes(row.format as Format)) issues.push("Invalid category or format");
    if (row.difficulty_stars < 1 || row.difficulty_stars > 3) issues.push("Invalid difficulty");
    if (row.duration_min < 1 || row.duration_min > 180) issues.push("Invalid duration");
    if (!row.name.trim() || !row.description_html?.trim() || !row.instructions_html?.trim() || !row.tips_html?.trim()) issues.push("Missing workout information");
    if (!row.image_url?.trim()) issues.push("Missing cover picture");
    if (duplicateLegacy.has(row.legacy_id ?? "")) issues.push("Duplicate transferred workout");
    const sections = sectionSequence(html);
    const positions = EXPECTED.map((section) => sections.indexOf(section));
    if (positions.some((position) => position < 0) || positions.some((position, index) => index > 0 && position <= positions[index - 1]!)) issues.push("Required sections are missing or out of order");
    if (extractSoftTissue(html).length === 0) issues.push("Soft Tissue Preparation is empty");
    if (parseWorkoutSteps(html).length === 0) issues.push("Player has no exercise steps");
    for (const id of new Set(findTokens(html).map((token) => token.id))) {
      referenced.add(id);
      const exercise = library.get(id);
      if (!exercise || !exercise.is_active) issues.push(`Exercise ${id} is missing or inactive`);
      else if (!hasExerciseDemonstration(exercise)) issues.push(`Exercise ${exercise.name} has no demonstration`);
    }
    if (issues.length) workouts.push({ id: row.id, name: row.name, issues: [...new Set(issues)] });
  }
  let visualDemonstrations = 0, guidedDemonstrations = 0, missingDemonstrations = 0;
  for (const id of referenced) {
    const exercise = library.get(id);
    if (exercise?.gif_path?.trim()) visualDemonstrations += 1;
    else if (exercise && hasExerciseDemonstration(exercise)) guidedDemonstrations += 1;
    else missingDemonstrations += 1;
  }
  return { total: imported.length, clean: imported.length - workouts.length, visible: imported.filter((row) => row.is_visible).length, ready: imported.length > 0 && workouts.length === 0, referencedExercises: referenced.size, visualDemonstrations, guidedDemonstrations, missingDemonstrations, workouts };
}