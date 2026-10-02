// Deterministic rule compliance for ready-made Smarty Workouts.
// Audits a stored workout against the same doctrine the engine enforces and,
// when it breaks a rule, swaps exercises only (dose, sections and text stay).
import * as D from "./doctrine";
import { parseWorkoutSteps } from "./parse-steps";
import { priorityIds } from "./priority";
import { prepTokens, prepAllowed, ACTIVATION_NAMES } from "./prep-vocabulary";
import { isTimedPosition, isPassiveStretch, activationRuleBreak, isCardioRhythm, doseRuleBreak, exerciseRuleBreaks, holdDoseViolation, workoutRuleBreaks, type ExerciseRuleContext } from "./rules";
import { estimateActivationMinutes, estimateCooldownMinutes, estimateWorkMinutes } from "./enforce.server";
import type { PoolExercise } from "./pool.server";
import type { Category, DifficultyLevel, Format } from "./spec";

export type ComplianceWorkout = { id: string; name: string; category: string; format: string | null; difficulty_stars: number; main_workout: string | null; duration_min?: number | null; equipment?: string[] | null };
export type ComplianceExercise = PoolExercise & { is_active?: boolean; gif_path?: string | null };

const NO_PRIORITY = new Set<string>(["RECOVERY", "MOBILITY & STABILITY", "PILATES"]);
const LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

function workRows(html: string, lib: Map<string, ComplianceExercise>) {
  return parseWorkoutSteps(html)
    .filter((s) => s.section === "Main Workout" || s.section === "Finisher")
    .map((s) => lib.get(s.exerciseId))
    .filter((e): e is ComplianceExercise => Boolean(e));
}

const rowsIn = (html: string, lib: Map<string, ComplianceExercise>, section: string) =>
  parseWorkoutSteps(html).filter((s) => s.section === section).map((s) => lib.get(s.exerciseId)).filter((e): e is ComplianceExercise => Boolean(e));
const finisherRows = (html: string, lib: Map<string, ComplianceExercise>) => rowsIn(html, lib, "Finisher");

/** How far a workout is from the block-share rules (Cardio rhythm, Challenge core cap). */
function blockShortfall(html: string, lib: Map<string, ComplianceExercise>, cat: string): number {
  let n = 0;
  for (const block of [rowsIn(html, lib, "Main Workout"), finisherRows(html, lib)]) {
    if (!block.length) continue;
    if (cat === "CARDIO") n += Math.max(0, Math.ceil(block.length * 0.6) - block.filter((e) => isCardioRhythm(e.name)).length);
  }
  return n;
}

const isBodyweightWorkout = (w: ComplianceWorkout) =>
  Array.isArray(w.equipment) && (w.equipment.length === 0 || w.equipment.every((i) => /body ?weight/i.test(i)));

function ctxOf(w: ComplianceWorkout): ExerciseRuleContext {
  return { category: w.category as Category, format: (w.format ?? "") as Format, level: LEVELS[w.difficulty_stars - 1] ?? LEVELS[1]!, section: "work", bodyweightOnly: isBodyweightWorkout(w) };
}

/** Every rule break of a stored workout — all decided by the one rule engine (rules.ts). */
export function complianceIssues(w: ComplianceWorkout, library: ComplianceExercise[], lib = new Map(library.map((e) => [e.id, e]))): string[] {
  const html = w.main_workout ?? "";
  const ctx = ctxOf(w);
  const cat = ctx.category, fmt = ctx.format, level = ctx.level!;
  const s = new Set<string>();
  const steps = parseWorkoutSteps(html);
  const workSteps = steps.filter((x) => x.section === "Main Workout" || x.section === "Finisher");
  const rows = workRows(html, lib);
  const mainRows = steps.filter((x) => x.section === "Main Workout").map((x) => lib.get(x.exerciseId)).filter((e): e is ComplianceExercise => Boolean(e));
  if (!D.categoryAllowsFinisher(cat) && steps.some((x) => x.section === "Finisher")) s.add("Finisher in a category that never has one");
  if (mainRows.length < 3) s.add("Main Workout has fewer than 3 exercises");
  for (const r of rows) for (const v of exerciseRuleBreaks(r, ctx)) s.add(ruleLabel(v));
  const finRows = finisherRows(html, lib);
  for (const v of workoutRuleBreaks(rows, mainRows, { category: cat, format: fmt, level }, finRows)) s.add(ruleLabel(v));
  for (const st of workSteps) {
    if (!/\d/.test(st.prescription)) s.add("Exercise without a dose");
    if (doseRuleBreak(cat, st.prescription)) s.add("Too many sets for a light category");
  }
  for (const st of steps) if (holdDoseViolation(lib.get(st.exerciseId)?.name ?? st.name, st.prescription)) s.add("Hold or stretch dosed in reps");
  const prep = prepTokens(html);
  for (const t of prep) {
    const name = lib.get(t.id)?.name ?? t.name;
    if (exerciseRuleBreaks({ name, equipment: null, body_part: null, target_muscle: null } as never, { ...ctx, section: t.section }).length)
      s.add(t.section === "activation" ? "Activation not mobility/stability" : "Cool Down not stretch/mobility");
  }
  if (activationRuleBreak(prep.filter((t) => t.section === "activation").map((t) => lib.get(t.id)?.name ?? t.name))) s.add("Activation mostly passive stretches");
  for (const sec of ["activation", "cooldown"] as const) {
    const ids = prep.filter((t) => t.section === sec).map((t) => t.id);
    if (ids.length < 2) s.add(sec === "activation" ? "Activation has fewer than 2 movements" : "Cool Down has fewer than 2 movements");
    if (new Set(ids).size < ids.length) s.add("Repeated exercise in Activation/Cool Down");
  }
  if (w.duration_min) {
    const t = w.duration_min;
    if (D.durationOverflowViolation(estimateWorkMinutes(html), t)) s.add("Work time exceeds the advertised duration");
    if (D.activationOverflowViolation(estimateActivationMinutes(html), t)) s.add("Activation too long");
    if (D.cooldownOverflowViolation(estimateCooldownMinutes(html), t)) s.add("Cool Down too long");
  }
  if (!NO_PRIORITY.has(cat) && rows.length) {
    const prio = priorityIds(library);
    const hits = rows.filter((r) => prio.has(r.id)).length;
    if (hits / rows.length < 0.7) s.add("Too few priority exercises");
  }
  return [...s];
}

/** Stable category label for a rule message (exercise names stripped). */
function ruleLabel(v: string): string {
  if (/static hold/.test(v)) return "Static hold in a flow category";
  if (/advanced material/.test(v)) return "Advanced exercise in a Beginner workout";
  if (/not a bodyweight/.test(v)) return "Equipment exercise in a bodyweight workout";
  if (/stretching or mobility work/.test(v)) return "Stretch/mobility move in Challenge work";
  if (/Pilates|Mobility & Stability never|Recovery session|Micro Workout|micro-workout/.test(v)) return "Exercise outside category vocabulary";
  if (/legal format|must be programmed/.test(v)) return "Format not allowed for category";
  if (/passive stretch/.test(v)) return "Passive stretch in Mobility & Stability work";
  if (/rhythmic aerobic/.test(v)) return "Cardio block not mostly aerobic";
  if (/isolated core work/.test(v)) return "Isolated core work in Cardio/Challenge";
  if (/plyometric or cardio drill/.test(v)) return "Plyometric/cardio drill in Strength work";
  return v.replace(/"[^"]*"/g, "X").slice(0, 90);
}

function perExerciseBad(r: ComplianceExercise, w: ComplianceWorkout): boolean {
  return exerciseRuleBreaks(r, ctxOf(w)).length > 0;
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
    html = html.replace(/<(h[1-4]|p|div)\b[^>]*>(?:(?!<\/?\1)[\s\S])*?⚡[\s\S]*?(?=<(?:h[1-4]|p|div)\b[^>]*>(?:(?!<\/?(?:h[1-4]|p|div))[\s\S])*?🧘)/u, "");
  }

  const candidates = library.filter((e) => (NO_PRIORITY.has(cat) || prio.has(e.id)) && e.is_active !== false && Boolean(e.gif_path?.trim()) && !perExerciseBad(e, w));
  // Instance-weighted: every rule type counts 10, every still-illegal row 1.
  const score = (h: string) => complianceIssues({ ...w, main_workout: h }, library, lib).length * 10 + workRows(h, lib).filter((r) => perExerciseBad(r, w)).length + blockShortfall(h, lib, cat);
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
    order.sort((a, b) => Number(perExerciseBad(b, w)) - Number(perExerciseBad(a, w)) || Number(prio.has(a.id)) - Number(prio.has(b.id)));
    for (const ex of order) {
      if (current === 0) break;
      if (prio.has(ex.id) && !perExerciseBad(ex, w) && cat !== "CHALLENGE" && cat !== "CARDIO" && !before.includes("Too many equipment families")) continue;
      const bad = perExerciseBad(ex, w);
      const wantBw = cat === "CHALLENGE" || fam(ex) === "bodyweight";
      const pool = candidates.filter((c) => !present.has(c.id) && c.id !== ex.id);
      const ranked = pool
        .map((c) => {
          let s = 0;
          const pe = patternKey(ex), pc = patternKey(c);
          if (pc === pe || (pe === "arms" && (pc === "push" || pc === "pull"))) s += 4;
          else if (pe !== "stretch" && pe !== "other" && !(bad && (pe === "calf" || pe === "arms" || cat === "RECOVERY" || cat === "MOBILITY & STABILITY"))) s -= 6;
          if (cat === "CARDIO" && !isCardioRhythm(ex.name) && isCardioRhythm(c.name)) s += 12;
          if (cat === "CHALLENGE" && D.CORE_ISOLATION_RE.test(ex.name) && patternKey(c) === "conditioning") s += 12;
          if ((cat === "STRENGTH" || cat === "MUSCLE BUILDING") && bad && patternKey(ex) === "conditioning" && ["squat", "lunge", "hinge", "push", "pull"].includes(patternKey(c))) s += 10;
          if (cat === "MOBILITY & STABILITY" && prepAllowed(c.name, "activation")) s += 5;
          if (cat === "RECOVERY" && (prepAllowed(c.name, "activation") || prepAllowed(c.name, "cooldown"))) s += 5;
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
  html = fixActivation(html, library, lib);
  html = fixHoldDoses(html, lib);
  html = capLightSets(html, cat);
  html = fitDuration({ ...w, main_workout: html }, library, lib);
  const after = complianceIssues({ ...w, main_workout: html }, library, lib);
  if (after.length >= before.length && after.every((a) => before.includes(a)) && after.length === before.length && swaps.length === 0 && html === (w.main_workout ?? "")) return { html: w.main_workout ?? "", swaps, before, after: before };
  return { html, swaps, before, after };
}

/** Activation keeps one passive stretch at most; the rest become active mobility / stability moves. */
function fixActivation(html: string, library: ComplianceExercise[], lib: Map<string, ComplianceExercise>): string {
  const act = prepTokens(html).filter((t) => t.section === "activation");
  const names = act.map((t) => lib.get(t.id)?.name ?? t.name);
  if (!activationRuleBreak(names)) return html;
  const used = new Set(prepTokens(html).map((t) => t.id));
  const byName = new Map(library.filter((e) => e.is_active !== false && e.gif_path?.trim()).map((e) => [e.name.toLowerCase(), e]));
  const pool = ACTIVATION_NAMES.map((n) => byName.get(n)).filter((e): e is ComplianceExercise => Boolean(e) && !isPassiveStretch(e!.name));
  const main = workRows(html, lib);
  const lower = main.filter((r) => D.regionOf(r) === "lower").length >= main.length / 2;
  pool.sort((a, b) => Number((D.regionOf(b) === "lower") === lower) - Number((D.regionOf(a) === "lower") === lower));
  let keptStretch = false;
  const plan: Array<{ index: number; raw: string; to: ComplianceExercise }> = [];
  for (let i = 0; i < act.length; i++) {
    if (!isPassiveStretch(names[i]!)) continue;
    if (!keptStretch) { keptStretch = true; continue; }
    const to = pool.find((c) => !used.has(c.id));
    if (!to) break;
    used.add(to.id);
    plan.push({ index: act[i]!.index, raw: act[i]!.raw, to });
  }
  for (const p of plan.reverse()) html = html.slice(0, p.index) + `{{exercise:${p.to.id}:${p.to.name}}}` + html.slice(p.index + p.raw.length);
  // A swapped-in movement is dosed in reps, not stretch seconds.
  for (const p of plan) html = html.replace(new RegExp(`\\b30 sec(\\s*\\{\\{exercise:${p.to.id.replace(/-/g, "\\-")}:)`), "8 reps$1");
  return html;
}

/** Recovery / Mobility & Stability: set ladders capped at the light-category maximum. */
function capLightSets(html: string, cat: Category): string {
  if (!doseRuleBreak(cat, "9 sets")) return html;
  const a = html.search(/Main Workout/i); if (a < 0) return html;
  const rest = html.slice(a); const b = rest.search(/🧘|Cool[\s-]?Down/i);
  const end = b < 0 ? html.length : a + b;
  const body = html.slice(a, end).replace(/\b(\d+)(\s*sets?)\b/gi, (m, n: string, t: string) => (doseRuleBreak(cat, m) ? `4${t}` : m));
  return html.slice(0, a) + body + html.slice(end);
}

/** A hold left in a non-flow category keeps its place but is dosed in time. */
function fixHoldDoses(html: string, lib: Map<string, ComplianceExercise>): string {
  return html.replace(/(<(li|p)\b[^>]*>(?:(?!<\/\2>)[\s\S])*?)\b(\d+)\s*reps?\b((?:(?!<\/\2>)[\s\S])*?\{\{exercise:([A-Za-z0-9_-]+):[^}]*\}\})/g, (m, pre, _t, _n, mid, id) => {
    const name = lib.get(id)?.name ?? "";
    return isTimedPosition(name) ? `${pre}30 sec${mid}` : m;
  });
}

/**
 * Brings Main + Finisher inside the advertised duration by trimming the
 * declared clock / rounds / sets — exercises and text stay untouched.
 */
function fitDuration(w: ComplianceWorkout, library: ComplianceExercise[], lib: Map<string, ComplianceExercise>): string {
  let html = w.main_workout ?? "";
  const t = w.duration_min;
  if (!t) return html;
  const over = (h: string) => Boolean(D.durationOverflowViolation(estimateWorkMinutes(h), t));
  const sectionSlice = (h: string, start: RegExp, end: RegExp) => {
    const a = h.search(start); if (a < 0) return null;
    const rest = h.slice(a + 5); const b = rest.search(end);
    return [a, b < 0 ? h.length : a + 5 + b] as const;
  };
  const trim = (h: string, start: RegExp, end: RegExp, re: RegExp, min: number): string | null => {
    const r = sectionSlice(h, start, end); if (!r) return null;
    const body = h.slice(r[0], r[1]); let changed = false;
    const nb = body.replace(re, (m: string, n: string) => { const v = Number(n); if (v <= min) return m; changed = true; return m.replace(n, String(v - 1)); });
    return changed ? h.slice(0, r[0]) + nb + h.slice(r[1]) : null;
  };
  const MAIN = /Main Workout/i, FIN = /⚡|Finisher/, END_MAIN = /⚡|🧘|Cool/, END_FIN = /🧘|Cool/;
  const steps: Array<() => string | null> = [
    () => trim(html, FIN, END_FIN, /\b(\d{1,2})\s*rounds?\b/gi, 2),
    () => trim(html, MAIN, END_MAIN, /\b(\d{1,3})\s*(?:-\s*)?(?:min|mins|minute|minutes)\b/gi, 10),
    () => trim(html, MAIN, END_MAIN, /\b(\d{1,2})\s*rounds?\b/gi, 2),
    () => trim(html, MAIN, END_MAIN, /\b(\d)\s*sets?\b/gi, 2),
  ];
  for (let guard = 0; guard < 120 && over(html); guard++) {
    let progressed = false;
    const cur = estimateWorkMinutes(html);
    for (const step of steps) { const n = step(); if (n && estimateWorkMinutes(n) < cur) { html = n; progressed = true; break; } }
    if (!progressed) break;
  }
  // Prep allowances: shorten timed Activation / Cool Down lines (never below 20 sec).
  const prepOver = (h: string) => Boolean(D.activationOverflowViolation(estimateActivationMinutes(h), t) || D.cooldownOverflowViolation(estimateCooldownMinutes(h), t));
  const prepSteps: Array<() => string | null> = [
    () => trim(html, /🔥|Activation/, /💪|Main Workout/, /\b(\d{2,3})\s*(?:sec|s)\b/gi, 20),
    () => trim(html, /🔥|Activation/, /💪|Main Workout/, /\b(\d{1,2})\s*reps?\b/gi, 6),
    () => trim(html, /🔥|Activation/, /💪|Main Workout/, /\b(\d)\s*(?:sets?|rounds?)\b/gi, 1),
    () => trim(html, /🧘|Cool/, /$^/, /\b(\d{2,3})\s*(?:sec|s)\b/gi, 20),
    () => trim(html, /🧘|Cool/, /$^/, /\b(\d)\s*(?:sets?|rounds?|min|mins|minutes?)\b/gi, 1),
  ];
  for (let guard = 0; guard < 200 && prepOver(html); guard++) {
    const cur = estimateActivationMinutes(html) + estimateCooldownMinutes(html);
    let progressed = false;
    for (const step of prepSteps) { const n = step(); if (n && estimateActivationMinutes(n) + estimateCooldownMinutes(n) < cur) { html = n; progressed = true; break; } }
    if (!progressed) break;
  }
  void library; void lib;
  return html;
}
