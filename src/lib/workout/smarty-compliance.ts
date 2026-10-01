// Deterministic rule compliance for ready-made Smarty Workouts.
// Audits a stored workout against the same doctrine the engine enforces and,
// when it breaks a rule, swaps exercises only (dose, sections and text stay).
import * as D from "./doctrine";
import { parseWorkoutSteps } from "./parse-steps";
import { priorityIds } from "./priority";
import type { PoolExercise } from "./pool.server";
import type { Category, DifficultyLevel, Format } from "./spec";

export type ComplianceWorkout = { id: string; name: string; category: string; format: string | null; difficulty_stars: number; main_workout: string | null };
export type ComplianceExercise = PoolExercise & { is_active?: boolean; gif_path?: string | null };

const LEVELS: DifficultyLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as DifficultyLevel[];

function workRows(html: string, lib: Map<string, ComplianceExercise>) {
  return parseWorkoutSteps(html)
    .filter((s) => s.section === "Main Workout" || s.section === "Finisher")
    .map((s) => lib.get(s.exerciseId))
    .filter((e): e is ComplianceExercise => Boolean(e));
}

export function complianceIssues(w: ComplianceWorkout, library: ComplianceExercise[], lib = new Map(library.map((e) => [e.id, e]))): string[] {
  const html = w.main_workout ?? "";
  const cat = w.category as Category;
  const fmt = (w.format ?? "") as Format;
  const s = new Set<string>();
  const steps = parseWorkoutSteps(html);
  const rows = workRows(html, lib);
  if (D.categoryFormatViolation(cat, fmt)) s.add("Format not allowed for category");
  if (!D.categoryAllowsFinisher(cat) && steps.some((x) => x.section === "Finisher")) s.add("Finisher in a category that never has one");
  for (const r of rows) {
    if (D.categoryExerciseViolation(r, cat)) s.add("Exercise outside category vocabulary");
    if (D.humanRealismViolation(r)) s.add("Unrealistic exercise");
    if (D.dynamicExerciseViolation(r, cat, fmt)) s.add("Setup-heavy exercise in a timed format");
    if (D.flowSpecialtyViolation(r, cat, fmt)) s.add("Balance tool/isolation machine in flow/timed format");
  }
  if (cat === "CHALLENGE" && D.challengeBalanceViolation(rows, LEVELS[w.difficulty_stars - 1] ?? LEVELS[1]!)) s.add("Challenge not full-body/majority bodyweight");
  if (rows.length && D.equipmentFamilyViolation(rows, cat, fmt)) s.add("Too many equipment families");
  if (rows.length && D.sequenceViolation(rows, fmt)) s.add("Technical move right after high-fatigue move");
  if (D.cardioDominanceViolation(rows, cat)) s.add("Cardio turned metabolic");
  if (cat !== "RECOVERY" && rows.length) {
    const prio = priorityIds(library);
    const hits = rows.filter((r) => prio.has(r.id)).length;
    if (hits / rows.length < 0.7) s.add("Too few priority exercises");
  }
  return [...s];
}

function perExerciseBad(r: ComplianceExercise, cat: Category, fmt: Format): boolean {
  return Boolean(D.categoryExerciseViolation(r, cat) || D.humanRealismViolation(r) || D.dynamicExerciseViolation(r, cat, fmt) || D.flowSpecialtyViolation(r, cat, fmt));
}

/** Work-section token spans (Main Workout → Cool Down), in order. */
function workTokens(html: string) {
  const start = html.search(/Main Workout/i);
  if (start < 0) return [];
  const rest = html.slice(start);
  const end = rest.search(/Cool[\s-]?Down/i);
  const stop = end > 0 ? start + end : html.length;
  const re = /\{\{exercise:([A-Za-z0-9_-]+):([^}]*)\}\}/g;
  const out: { id: string; index: number; raw: string }[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = start;
  while ((m = re.exec(html)) && m.index < stop) out.push({ id: m[1]!, index: m.index, raw: m[0] });
  return out;
}

function replaceId(html: string, from: string, to: ComplianceExercise): string {
  const start = html.search(/Main Workout/i);
  const head = html.slice(0, start), tail = html.slice(start);
  const end = tail.search(/Cool[\s-]?Down/i);
  const work = end > 0 ? tail.slice(0, end) : tail;
  const after = end > 0 ? tail.slice(end) : "";
  const re = new RegExp(`\\{\\{exercise:${from.replace(/[-]/g, "\\-")}:[^}]*\\}\\}`, "g");
  return head + work.replace(re, `{{exercise:${to.id}:${to.name}}}`) + after;
}

const fam = (e: ComplianceExercise) => D.equipmentFamilyOf(e.equipment);

const PATTERNS: Array<[string, RegExp]> = [
  ["stretch", /stretch|mobility|circles?\b|release/i],
  ["lunge", /lunge|split squat|step[- ]?up|bulgarian/i],
  ["squat", /squat|leg press|thruster|wall sit|march sit/i],
  ["hinge", /deadlift|swing|hip thrust|glute bridge|bridge|good morning|hamstring|clean|snatch|hyperextension/i],
  ["pull", /row|pull[- ]?up|chin|pulldown|pull down|face pull|pullover/i],
  ["arms", /curl|triceps|extension|kickback/i],
  ["push", /press|push[- ]?up|dip|fly|bench/i],
  ["calf", /calf/i],
  ["core", /plank|crunch|dead bug|bird dog|hollow|leg raise|knee raise|rollout|twist|pallof|sit[- ]?up|v[- ]?up|chop|ab\b|oblique/i],
  ["conditioning", /burpee|jump|climber|jack|knees|skater|sprint|slam|run|crawl|skip|shuffle|hop|march|step/i],
];
const patternKey = (e: { name: string }) => PATTERNS.find(([, re]) => re.test(e.name))?.[0] ?? "other";

/** Swap exercises (only) until the workout complies, accepting a swap only when it reduces the issue count. */
export function remediate(w: ComplianceWorkout, library: ComplianceExercise[]): { html: string; swaps: Array<{ from: string; to: string }>; before: string[]; after: string[] } {
  const lib = new Map(library.map((e) => [e.id, e]));
  const prio = priorityIds(library);
  const cat = w.category as Category;
  const fmt = (w.format ?? "") as Format;
  let html = w.main_workout ?? "";
  const before = complianceIssues(w, library, lib);
  const swaps: Array<{ from: string; to: string }> = [];
  if (!before.length) return { html, swaps, before, after: before };

  // Finisher removal (non-finisher categories): drop the ⚡ block up to Cool Down.
  if (before.includes("Finisher in a category that never has one")) {
    html = html.replace(/<h[1-4][^>]*>\s*⚡[\s\S]*?(?=<h[1-4][^>]*>\s*🧘)/u, "");
  }

  const candidates = library.filter((e) => prio.has(e.id) && e.is_active !== false && Boolean(e.gif_path?.trim()) && !perExerciseBad(e, cat, fmt));
  const score = (h: string) => complianceIssues({ ...w, main_workout: h }, library, lib).length;
  let current = score(html);

  for (let pass = 0; pass < 3 && current > 0; pass++) {
    const tokens = workTokens(html);
    const present = new Set(tokens.map((t) => t.id));
    const rows = workRows(html, lib);
    const families = new Map<string, number>();
    for (const r of rows) families.set(fam(r), (families.get(fam(r)) ?? 0) + 1);
    const mainFamily = [...families.entries()].filter(([f]) => f !== "bodyweight").sort((a, b) => b[1] - a[1])[0]?.[0];
    const seen = new Set<string>();
    // Worst offenders first: rule-breaking rows, then non-priority rows.
    const order = tokens.map((t) => lib.get(t.id)).filter((e): e is ComplianceExercise => Boolean(e) && !seen.has(e!.id) && (seen.add(e!.id), true));
    order.sort((a, b) => Number(perExerciseBad(b, cat, fmt)) - Number(perExerciseBad(a, cat, fmt)) || Number(prio.has(a.id)) - Number(prio.has(b.id)));
    for (const ex of order) {
      if (current === 0) break;
      if (prio.has(ex.id) && !perExerciseBad(ex, cat, fmt) && cat !== "CHALLENGE" && cat !== "CARDIO" && !before.includes("Too many equipment families")) continue;
      const wantBw = cat === "CHALLENGE" || fam(ex) === "bodyweight";
      const pool = candidates.filter((c) => !present.has(c.id) && c.id !== ex.id);
      const ranked = pool
        .map((c) => {
          let s = 0;
          const pe = patternKey(ex), pc = patternKey(c);
          if (pc === pe || (pe === "arms" && (pc === "push" || pc === "pull"))) s += 4;
          else if (pe !== "stretch" && pe !== "other") s -= 6;
          if (D.regionOf(c) === D.regionOf(ex)) s += 3;
          if (wantBw ? fam(c) === "bodyweight" : fam(c) === fam(ex) || fam(c) === mainFamily) s += 5;
          else if (fam(c) !== "bodyweight") s -= 3;
          return { c, s };
        })
        .filter((x) => x.s >= 7)
        .sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name))
        .slice(0, 6);
      for (const { c } of ranked) {
        const next = replaceId(html, ex.id, c);
        const sc = score(next);
        if (sc < current || (sc === current && !prio.has(ex.id) && current > 0 && complianceIssues({ ...w, main_workout: next }, library, lib).includes("Too few priority exercises"))) {
          // accept strict improvements, or progress toward the 70% priority share
          if (sc > current) continue;
          html = next; current = sc; present.add(c.id); present.delete(ex.id);
          swaps.push({ from: ex.name, to: c.name });
          break;
        }
      }
    }
  }
  const after = complianceIssues({ ...w, main_workout: html }, library, lib);
  if (after.length >= before.length && after.every((a) => before.includes(a)) && after.length === before.length && swaps.length === 0) return { html: w.main_workout ?? "", swaps, before, after: before };
  return { html, swaps, before, after };
}
