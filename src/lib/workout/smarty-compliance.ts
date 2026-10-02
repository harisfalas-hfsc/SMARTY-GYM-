// Deterministic rule compliance for ready-made Smarty Workouts.
// Audits a stored workout against the same doctrine the engine enforces and,
// when it breaks a rule, swaps exercises only (dose, sections and text stay).
import * as D from "./doctrine";
import { parseWorkoutSteps } from "./parse-steps";
import { priorityIds, priorityShareViolation } from "./priority";
import { classify, isRelated, replacementConfidence, variationTier, type Confidence } from "./movement";
import { prepTokens, prepAllowed, ACTIVATION_NAMES, activationDoseViolation, clampActivationDoses } from "./prep-vocabulary";
import { isLegalExercise, isTimedPosition, isPassiveStretch, activationRuleBreak, isCardioRhythm, doseRuleBreak, exerciseRuleBreaks, holdDoseViolation, workoutRuleBreaks, type ExerciseRuleContext } from "./rules";
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
    if (cat === "CARDIO") n += Math.max(0, block.filter((e) => !isCardioRhythm(e.name)).length - 1);
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
  for (const st of steps.filter((x) => x.section === "Activation" || x.section === "Warm-up"))
    if (activationDoseViolation(lib.get(st.exerciseId)?.name ?? st.name, st.prescription)) s.add("Activation dose above 10 reps / 30 sec or in sets");
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
    const legal = library.filter((e) => isLegalExercise(e, { category: cat as never, format: (w.format ?? "REPS & SETS") as never }));
    if (priorityShareViolation(rows.map((r) => r.id), legal)) s.add("Too few priority exercises");
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

/** Swaps rejected by the coach: Crab Walk is never auto-swapped to Bear Crawl, and an advanced pistol squat is never introduced as a substitute. */
function bannedSwap(from: ComplianceExercise, to: ComplianceExercise, _w: ComplianceWorkout): boolean {
  if (/crab walk/i.test(from.name) && /bear/i.test(to.name)) return true;
  if (/pistol|one[- ]leg squat/i.test(to.name) && !/pistol|one[- ]leg squat/i.test(from.name)) return true;
  if (/advanced/i.test(to.difficulty ?? "") && !/advanced/i.test(from.difficulty ?? "")) return true;
  return false;
}

/** Preferences, not hard rules: reported, but they never block publishing or force a swap. */
export const PREFERENCE_ISSUES = new Set(["Too few priority exercises"]);
export const hardIssues = (issues: string[]) => issues.filter((i) => !PREFERENCE_ISSUES.has(i));

export type Role = "Activation" | "Main Workout" | "Finisher" | "Cool Down";
export type MigrationChange = {
  kind: "dose" | "reorder" | "replace";
  role?: Role;
  from?: string; fromId?: string;
  to?: string; toId?: string;
  reason: string;
  rule: string;
  confidence: Confidence | "N/A";
  applied: boolean;
};
export type MigrationPlan = {
  id: string; name: string; category: string; format: string | null;
  before: string[]; after: string[];
  html: string;
  changes: MigrationChange[];
  /** pass = already compliant · fixed = only safe changes · review = needs a MEDIUM swap approved · manual = needs a coaching decision */
  status: "pass" | "fixed" | "review" | "manual";
  /** Priority share left below target because no equivalent priority movement exists. */
  priorityKept: boolean;
};

/** One ul/li block per exercise inside a section — the unit that is reordered. */
function sectionBlocks(html: string, start: RegExp, end: RegExp) {
  const a = html.search(start); if (a < 0) return null;
  const restIdx = html.slice(a + 5).search(end);
  const b = restIdx < 0 ? html.length : a + 5 + restIdx;
  const body = html.slice(a, b);
  const blocks: { s: number; e: number; id: string }[] = [];
  const re = /<ul\b[^>]*>(?:(?!<\/ul>)[\s\S])*?\{\{exercise:([A-Za-z0-9_-]+):[^}]*\}\}(?:(?!<\/ul>)[\s\S])*?<\/ul>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) blocks.push({ s: a + m.index, e: a + m.index + m[0].length, id: m[1]! });
  return blocks;
}

/** Reorder a section so every equipment family is one contiguous block (first-appearance order, stable). */
function groupByFamily(html: string, start: RegExp, end: RegExp, lib: Map<string, ComplianceExercise>): string {
  const blocks = sectionBlocks(html, start, end);
  if (!blocks || blocks.length < 3) return html;
  const famOf = (id: string) => { const r = lib.get(id); return r ? fam(r) : "bodyweight"; };
  const order: string[] = [];
  for (const b of blocks) { const f = famOf(b.id); if (!order.includes(f)) order.push(f); }
  const sorted = [...blocks].sort((x, y) => order.indexOf(famOf(x.id)) - order.indexOf(famOf(y.id)) || blocks.indexOf(x) - blocks.indexOf(y));
  if (sorted.every((b, i) => b === blocks[i])) return html;
  const texts = sorted.map((b) => html.slice(b.s, b.e));
  let out = html;
  for (let i = blocks.length - 1; i >= 0; i--) out = out.slice(0, blocks[i]!.s) + texts[i] + out.slice(blocks[i]!.e);
  return out;
}

const roleOfIndex = (html: string, index: number): Role => {
  const fin = html.search(/⚡/), cd = html.search(/🧘|Cool[\s-]?Down/i), main = html.search(/Main Workout/i);
  if (cd >= 0 && index > cd) return "Cool Down";
  if (fin >= 0 && index > fin) return "Finisher";
  if (main >= 0 && index > main) return "Main Workout";
  return "Activation";
};

function replaceToken(html: string, index: number, raw: string, to: ComplianceExercise) {
  return html.slice(0, index) + `{{exercise:${to.id}:${to.name}}}` + html.slice(index + raw.length);
}

const allTokens = (html: string) => [...html.matchAll(/\{\{exercise:([A-Za-z0-9_-]+):([^}]*)\}\}/g)].map((m) => ({ id: m[1]!, raw: m[0], index: m.index! }));

/**
 * Coaching-aware migration plan for one stored workout.
 * Order: dose-only repairs → reordering → replacements. Every replacement keeps
 * the exercise's role, movement pattern, objective and equipment family and is
 * scored HIGH / MEDIUM / LOW; only HIGH is applied. Priority share is a
 * preference: a non-priority exercise is only swapped for an equivalent (HIGH) one.
 */
export function planMigration(w: ComplianceWorkout, library: ComplianceExercise[], mode: { resolve?: boolean } = {}): MigrationPlan {
  const lib = new Map(library.map((e) => [e.id, e]));
  const prio = priorityIds(library);
  const cat = w.category as Category;
  const ctx = ctxOf(w);
  const orig = w.main_workout ?? "";
  const issues = (h: string) => complianceIssues({ ...w, main_workout: h }, library, lib);
  const hardCount = (h: string) => hardIssues(issues(h)).length;
  const before = issues(orig);
  const changes: MigrationChange[] = [];
  const base = { id: w.id, name: w.name, category: w.category, format: w.format };
  if (!before.length) return { ...base, before, after: before, html: orig, changes, status: "pass", priorityKept: false };

  // 1. Dose-only repairs (exercises untouched).
  let html = orig;
  const doseSteps: Array<[string, (h: string) => string]> = [
    ["Activation dose above 10 reps / 30 sec or in sets", (h) => clampActivationDoses(h, isTimedPosition)],
    ["Hold or stretch dosed in reps", (h) => fixHoldDoses(h, lib)],
    ["Too many sets for a light category", (h) => capLightSets(h, cat)],
    ["Work time exceeds the advertised duration", (h) => fitDuration({ ...w, main_workout: h }, library, lib)],
  ];
  for (const [rule, fn] of doseSteps) {
    if (!before.includes(rule) && !before.some((b) => /too long/.test(b))) continue;
    const next = fn(html);
    if (next !== html && hardCount(next) <= hardCount(html)) { html = next; changes.push({ kind: "dose", reason: "Dose adjusted, exercises unchanged", rule, confidence: "N/A", applied: true }); }
  }

  // 2. Reorder before replacing: group each implement into one block.
  for (const [role, start, end] of [["Main Workout", /Main Workout/i, /⚡|🧘|Cool/], ["Finisher", /⚡/, /🧘|Cool/]] as const) {
    const cur = issues(html);
    if (!cur.some((i) => /station|picks the same equipment back up/i.test(i) && i.includes(role === "Main Workout" ? "Main" : "Finisher"))) continue;
    const next = groupByFamily(html, start, end, lib);
    if (next !== html && hardCount(next) < hardCount(html) && issues(next).every((i) => cur.includes(i))) {
      html = next;
      changes.push({ kind: "reorder", role, reason: "Exercises regrouped so each implement is one contiguous block", rule: "Equipment flow", confidence: "N/A", applied: true });
    }
  }

  // 3. Replacements.
  const usable = library.filter((e) => e.is_active !== false && Boolean(e.gif_path?.trim()));
  const pickFor = (fromRow: ComplianceExercise, role: Role, allowed: (c: ComplianceExercise) => boolean, opts: { allowFamilyChange?: boolean; wantPriority?: boolean; anyPattern?: boolean }) => {
    const present = new Set(allTokens(html).map((t) => t.id));
    const ranked = usable
      .filter((c) => !present.has(c.id) && !bannedSwap(fromRow, c, w) && (opts.anyPattern || isRelated(classify(fromRow).primary, classify(c).primary)) && allowed(c))
      .map((c) => ({ c, conf: replacementConfidence(fromRow, c, opts) }))
      .filter((x) => x.conf !== "LOW" || opts.anyPattern)
      .sort((x, y) =>
        Number(y.conf === "HIGH") - Number(x.conf === "HIGH") ||
        Number(opts.wantPriority ? prio.has(y.c.id) : 0) - Number(opts.wantPriority ? prio.has(x.c.id) : 0) ||
        Number(sameTarget(y.c, fromRow)) - Number(sameTarget(x.c, fromRow)) ||
        Math.abs(variationTier(x.c.name) - variationTier(fromRow.name)) - Math.abs(variationTier(y.c.name) - variationTier(fromRow.name)) ||
        Number(D.regionOf(y.c) === D.regionOf(fromRow)) - Number(D.regionOf(x.c) === D.regionOf(fromRow)) ||
        Number(prio.has(y.c.id)) - Number(prio.has(x.c.id)) ||
        x.c.name.localeCompare(y.c.name));
    void role;
    return ranked;
  };
  const sameTarget = (a: ComplianceExercise, b: ComplianceExercise) => Boolean(a.target_muscle) && (a.target_muscle ?? "").toLowerCase() === (b.target_muscle ?? "").toLowerCase();
  const workLegal = (c: ComplianceExercise) => !perExerciseBad(c, w);
  const tryApply = (index: number, raw: string, fromRow: ComplianceExercise, role: Role, reason: string, rule: string, allowed: (c: ComplianceExercise) => boolean, opts: { allowFamilyChange?: boolean; wantPriority?: boolean; anyPattern?: boolean; mandatory: boolean }) => {
    const curIssues = issues(html);
    for (const { c, conf } of pickFor(fromRow, role, allowed, opts).slice(0, 12)) {
      const next = replaceToken(html, index, raw, c);
      const ni = issues(next);
      const noNew = ni.every((i) => curIssues.includes(i));
      const better = hardIssues(ni).length < hardIssues(curIssues).length || (opts.wantPriority && ni.length < curIssues.length) || (opts.mandatory && noNew && hardCount(next) <= hardCount(html));
      if (!noNew || !better) continue;
      if (conf === "HIGH") { html = next; changes.push({ kind: "replace", role, from: fromRow.name, fromId: fromRow.id, to: c.name, toId: c.id, reason, rule, confidence: "HIGH", applied: true }); return "applied"; }
      if (opts.mandatory && mode.resolve) { html = next; changes.push({ kind: "replace", role, from: fromRow.name, fromId: fromRow.id, to: c.name, toId: c.id, reason: `${reason} — closest legal coaching equivalent`, rule, confidence: conf, applied: true }); return "applied"; }
      if (opts.mandatory) { changes.push({ kind: "replace", role, from: fromRow.name, fromId: fromRow.id, to: c.name, toId: c.id, reason, rule, confidence: "MEDIUM", applied: false }); return "review"; }
      return "none";
    }
    if (opts.mandatory) changes.push({ kind: "replace", role, from: fromRow.name, fromId: fromRow.id, reason: `${reason} — no equivalent legal exercise in the library`, rule, confidence: "LOW", applied: false });
    return "none";
  };

  /**
   * Coaching decisions for what the one-to-one planner could not solve:
   * a Finisher keeps the session's equipment (bodyweight conversion, else the
   * extra movement is dropped); a work row breaking a rule takes the closest
   * legal movement of the same objective; a prep row takes legal prep vocabulary.
   */
  function resolveRemaining() {
    const mainFams = () => new Set(rowsIn(html, lib, "Main Workout").map(fam));
    for (let pass = 0; pass < 3 && hardIssues(issues(html)).length; pass++) {
      for (const t of allTokens(html)) {
        const cur = allTokens(html).find((x) => x.index === t.index && x.id === t.id); if (!cur) continue;
        const row = lib.get(cur.id); if (!row) continue;
        const role = roleOfIndex(html, cur.index);
        if (role === "Finisher" && /Finisher introduces new equipment/.test(issues(html).join("|")) && !mainFams().has(fam(row)) && fam(row) !== "bodyweight") {
          const r = tryApply(cur.index, cur.raw, row, role, "Finisher converted to the session's equipment / bodyweight", "Equipment flow", (c) => workLegal(c) && (mainFams().has(fam(c)) || fam(c) === "bodyweight"), { allowFamilyChange: true, anyPattern: true, mandatory: true });
          if (r !== "applied") dropBlock(cur.index, row, role, "Finisher simplified: movement needing new equipment removed");
          continue;
        }
        if ((role === "Main Workout" || role === "Finisher") && exerciseRuleBreaks(row, ctx).length) {
          const r = tryApply(cur.index, cur.raw, row, role, exerciseRuleBreaks(row, ctx)[0]!, ruleLabel(exerciseRuleBreaks(row, ctx)[0]!), workLegal, { allowFamilyChange: true, anyPattern: true, mandatory: true });
          if (r !== "applied") dropBlock(cur.index, row, role, "Movement removed: no legal equivalent for this category");
        }
      }
      // Remaining flow/structure issues: try regrouping again after swaps.
      for (const [start, end] of [[/Main Workout/i, /⚡|🧘|Cool/], [/⚡/, /🧘|Cool/]] as const) {
        const next = groupByFamily(html, start, end, lib);
        if (next !== html && hardCount(next) < hardCount(html)) { html = next; changes.push({ kind: "reorder", reason: "Regrouped after replacements", rule: "Equipment flow", confidence: "N/A", applied: true }); }
      }
    }
  }
  function dropBlock(index: number, row: ComplianceExercise, role: Role, reason: string) {
    const sec = role === "Finisher" ? sectionBlocks(html, /⚡/, /🧘|Cool/) : sectionBlocks(html, /Main Workout/i, /⚡|🧘|Cool/);
    if (!sec || sec.length < 3) return;
    const b = sec.find((x) => x.s <= index && index < x.e); if (!b) return;
    const next = html.slice(0, b.s) + html.slice(b.e);
    if (hardCount(next) < hardCount(html)) { html = next; changes.push({ kind: "replace", role, from: row.name, fromId: row.id, to: "(removed)", reason, rule: "Coaching redesign", confidence: "N/A", applied: true }); }
  }

  // 3a. Mandatory: work rows that break a hard rule.
  for (const t of allTokens(html)) {
    const role = roleOfIndex(html, t.index);
    if (role !== "Main Workout" && role !== "Finisher") continue;
    const row = lib.get(t.id); if (!row) continue;
    const breaks = exerciseRuleBreaks(row, ctx);
    if (!breaks.length) continue;
    const cur = allTokens(html).find((x) => x.index === t.index && x.id === t.id);
    if (!cur) continue;
    tryApply(cur.index, cur.raw, row, role, breaks[0]!, ruleLabel(breaks[0]!), workLegal, { mandatory: true });
  }

  // 3b. Mandatory: a Finisher that brings in new equipment — same movement on the Main Workout's equipment.
  if (issues(html).some((i) => /Finisher introduces new equipment/.test(i))) {
    const mainFams = new Set(rowsIn(html, lib, "Main Workout").map(fam));
    for (const t of allTokens(html)) {
      if (roleOfIndex(html, t.index) !== "Finisher") continue;
      const row = lib.get(t.id); if (!row || mainFams.has(fam(row)) || fam(row) === "bodyweight") continue;
      const cur = allTokens(html).find((x) => x.index === t.index); if (!cur) continue;
      tryApply(cur.index, cur.raw, row, "Finisher", "Finisher must keep the Main Workout's equipment", "Equipment flow", (c) => workLegal(c) && (mainFams.has(fam(c)) || fam(c) === "bodyweight"), { allowFamilyChange: true, mandatory: true });
    }
  }

  // 3c. Mandatory: Activation / Cool Down tokens outside the prep vocabulary (and excess passive stretches in Activation).
  {
    const prep = prepTokens(html);
    let keptStretch = false;
    for (const t of prep) {
      const row = lib.get(t.id); if (!row) continue;
      const illegal = !prepAllowed(row.name, t.section);
      const excessStretch = t.section === "activation" && isPassiveStretch(row.name) && (keptStretch || ((keptStretch = true), false));
      if (!illegal && !excessStretch) continue;
      const role: Role = t.section === "activation" ? "Activation" : "Cool Down";
      const cur = allTokens(html).find((x) => x.index === t.index); if (!cur) continue;
      tryApply(cur.index, cur.raw, row, role, illegal ? `Not a ${role} movement` : "Activation must be active mobility, not a second passive stretch", illegal ? `${role} vocabulary` : "Activation mostly passive stretches",
        (c) => prepAllowed(c.name, t.section) && (t.section !== "activation" || !isPassiveStretch(c.name)), { allowFamilyChange: true, mandatory: true });
    }
  }

  // 3d. Preference: priority share — only genuinely equivalent (HIGH) priority swaps, never MEDIUM.
  if (!NO_PRIORITY.has(cat)) {
    for (const t of allTokens(html)) {
      if (!issues(html).includes("Too few priority exercises")) break;
      const role = roleOfIndex(html, t.index);
      if (role !== "Main Workout" && role !== "Finisher") continue;
      const row = lib.get(t.id); if (!row || prio.has(row.id)) continue;
      const cur = allTokens(html).find((x) => x.index === t.index); if (!cur) continue;
      tryApply(cur.index, cur.raw, row, role, "Equivalent coach priority exercise", "Too few priority exercises", (c) => prio.has(c.id) && workLegal(c), { wantPriority: true, mandatory: false });
    }
  }

  if (mode.resolve && hardIssues(issues(html)).length) resolveRemaining();

  const after = issues(html);
  const hardAfter = hardIssues(after);
  const priorityKept = after.includes("Too few priority exercises");
  const status: MigrationPlan["status"] = !hardAfter.length
    ? "fixed"
    : changes.some((c) => !c.applied && c.confidence === "MEDIUM") && !changes.some((c) => !c.applied && c.confidence === "LOW") && !hardAfter.some((i) => /station|equipment|back up/i.test(i) && !changes.some((c) => c.rule === "Equipment flow" && c.confidence === "MEDIUM"))
      ? "review"
      : "manual";
  return { ...base, before, after, html, changes, status, priorityKept };
}

/** Applies only safe (HIGH / dose / reorder) changes — kept for callers of the old API. */
export function remediate(w: ComplianceWorkout, library: ComplianceExercise[]): { html: string; swaps: Array<{ from: string; to: string }>; before: string[]; after: string[] } {
  const p = planMigration(w, library);
  return { html: p.html, swaps: p.changes.filter((c) => c.kind === "replace" && c.applied).map((c) => ({ from: c.from!, to: c.to! })), before: p.before, after: p.after };
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
