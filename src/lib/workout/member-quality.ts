// Member-built workout quality rules (Coach Haris, Oct 2026). Pure helpers used
// by the pack builder while picking, and by the final check in generate.server.ts
// that rebuilds a session before the member ever sees it.
// These never widen a closed exercise list, the focus filter or safety rules —
// they only decide WHICH legal exercises are chosen and how many.
import { focusGroups } from "./strength-focus";
import { muscleBucket, muscleSpreadGap } from "./muscle-spread";
import type { DifficultyLevel, StrengthFocus } from "./spec";

export type QExercise = { id: string; name: string; equipment?: string | null; difficulty?: string | null; target_muscle?: string | null };

export const isBodyweightRow = (e: QExercise) => (e.equipment ?? "").toLowerCase().includes("body weight");

/** Glute work for the CORE & GLUTES focus (hip-dominant lower body). */
export const isGluteWork = (e: QExercise) =>
  /hip thrust|bridge|kickback|clamshell|hip extension|abduction|lunge|split squat|step[- ]?up|deadlift|romanian|\brdl\b|swing|goblet squat|sumo|good morning|donkey|fire hydrant/i.test(e.name) &&
  !/side bridge/i.test(e.name);
export const isCoreWork = (e: QExercise) => !isGluteWork(e) && focusGroups(e.name).includes("core");

/** Minimum Main Workout exercises by level (fewer only when the time can't fit them). */
export function levelMainMinimum(level: DifficultyLevel): number {
  return level === "beginner" ? 4 : level === "advanced" ? 6 : 5;
}

/** Minimum sets per exercise in a Reps & Sets main block. */
export function levelMinSets(level: DifficultyLevel): number {
  return level === "advanced" ? 3 : 2;
}

/** Single-muscle focuses (Coach Haris, 14 Oct 2026): every angle and implement is its own exercise (flat / incline / decline, dumbbell / barbell / machine, flies). */
const SINGLE_MUSCLE_FOCUS = /^(CHEST|SHOULDERS|ARMS|BACK|LEGS)$/;
const ANGLE_GRIP = /\b(incline|decline|flat|close[- ]?grip|wide[- ]?grip|reverse[- ]?grip|neutral[- ]?grip)\b/g;
export const isSingleMuscleFocus = (focus?: string | null) => SINGLE_MUSCLE_FOCUS.test((focus ?? "").trim().toUpperCase());

/**
 * Same movement under another listing ("inchworm", "inchworm v. 2"). Bench
 * angles and grips (flat / incline / decline / close-grip) are different
 * exercises; in a single-muscle focus every implement is too.
 */
export function movementKey(name: string, focus?: string | null): string {
  const base = name.toLowerCase().replace(/\(.*?\)/g, "").replace(/\bv\.?\s*\d+\b/g, "").replace(/[^a-z\s-]/g, " ").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (isSingleMuscleFocus(focus)) return words.join(" ");
  const angle = (base.match(ANGLE_GRIP) ?? []).map((a) => a.replace(/[- ]/g, ""));
  const tail = words.slice(-2);
  return [...angle.filter((a) => !tail.includes(a)), ...tail].join(" ");
}

export { muscleSpreadGap } from "./muscle-spread";

export function dedupeMovements<T extends QExercise>(list: T[], focus?: string | null): T[] {
  const seen = new Set<string>();
  return list.filter((e) => {
    const k = movementKey(e.name, focus);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export type QualityCtx = {
  level: DifficultyLevel;
  focus?: StrengthFocus | null;
  /** Specific muscle requested inside the focus (first priority; disables the spread). */
  muscle?: string | null;
  /** True when the member chose equipment beyond bodyweight and the pool holds equipment rows. */
  equipmentExpected: boolean;
  /** Legal pool the main block was drawn from (to know what was possible). */
  pool: QExercise[];
};

/** Focus requirement counts for a main block of n exercises. */
export function focusNeeds(focus: StrengthFocus | null | undefined, n: number): { glute: number; core: number } | null {
  if (focus !== "CORE & GLUTES") return null;
  if (n >= 4) return { glute: 2, core: 2 };
  return { glute: Math.max(1, n - 1), core: 1 };
}

/**
 * Re-orders/replaces picks so the main block honours focus coverage, selected
 * equipment, level-appropriate vocabulary and no repeated movement, using only
 * rows from the legal pool. Deterministic.
 */
export function improvePicks<T extends QExercise>(picks: T[], pool: T[], ctx: QualityCtx): T[] {
  const n = picks.length;
  let out = dedupeMovements(picks, ctx.focus);
  const keyOf = (e: T) => movementKey(e.name, ctx.focus);
  const usedKeys = () => new Set(out.map(keyOf));
  const spare = (pred: (e: T) => boolean) => pool.find((e) => pred(e) && !usedKeys().has(keyOf(e)) && !out.some((o) => o.id === e.id));
  // Top up after de-duplication.
  while (out.length < n) {
    const s = spare(() => true);
    if (!s) break;
    out.push(s);
  }
  // A tiny legal pool keeps the block full rather than delivering fewer exercises.
  if (out.length < n) return picks;
  const replace = (bad: (e: T) => boolean, want: (e: T) => boolean, protect: (e: T) => boolean = () => false) => {
    for (let i = out.length - 1; i >= 0; i--) {
      if (!bad(out[i]!) || protect(out[i]!)) continue;
      const s = spare(want);
      if (!s) return false;
      out[i] = s;
      return true;
    }
    return false;
  };
  const advancedOk = (e: T) => ctx.level !== "advanced" || (e.difficulty ?? "").toLowerCase() !== "beginner";

  // 1. Focus coverage.
  const needs = focusNeeds(ctx.focus, out.length);
  if (needs) {
    for (let g = 0; g < 12 && out.filter(isGluteWork).length < needs.glute; g++)
      if (!replace((e) => !isGluteWork(e) && (out.filter(isCoreWork).length > needs.core || !isCoreWork(e)), (e) => isGluteWork(e) && advancedOk(e)) &&
          !replace((e) => !isGluteWork(e) && (out.filter(isCoreWork).length > needs.core || !isCoreWork(e)), isGluteWork)) break;
    for (let g = 0; g < 12 && out.filter(isCoreWork).length < needs.core; g++)
      if (!replace((e) => !isCoreWork(e) && out.filter(isGluteWork).length > needs.glute, (e) => isCoreWork(e) && advancedOk(e)) &&
          !replace((e) => !isCoreWork(e) && out.filter(isGluteWork).length > needs.glute, isCoreWork)) break;
  }
  const focusRole = (e: T) => (isGluteWork(e) ? "glute" : isCoreWork(e) ? "core" : "other");
  const sameRole = (e: T) => (x: T) => !needs || focusRole(x) === focusRole(e);

  // 2. Selected equipment: at least half of the main block uses it.
  if (ctx.equipmentExpected) {
    const target = Math.ceil(out.length / 2);
    for (let g = 0; g < 12 && out.filter((e) => !isBodyweightRow(e)).length < target; g++) {
      let done = false;
      for (let i = out.length - 1; i >= 0 && !done; i--) {
        const cur = out[i]!;
        if (!isBodyweightRow(cur)) continue;
        const s = spare((e) => !isBodyweightRow(e) && sameRole(cur)(e)) ?? (needs ? undefined : spare((e) => !isBodyweightRow(e)));
        if (s) { out[i] = s; done = true; }
      }
      if (!done) break;
    }
  }

  // 3. Advanced: beginner-only rows replaced by a harder legal row of the same role and equipment kind.
  if (ctx.level === "advanced") {
    for (let i = 0; i < out.length; i++) {
      const cur = out[i]!;
      if (advancedOk(cur)) continue;
      const s = spare((e) => advancedOk(e) && sameRole(cur)(e) && (isBodyweightRow(e) === isBodyweightRow(cur) || !isBodyweightRow(e)));
      if (s) out[i] = s;
    }
  }

  // 4. Muscle spread: every muscle of a broad focus gets one exercise before any muscle repeats.
  for (let g = 0; g < 8; g++) {
    const { over, missing } = muscleSpreadGap(out, pool, ctx.focus, ctx.muscle);
    if (!over.length) break;
    let done = false;
    for (let i = out.length - 1; i >= 0 && !done; i--) {
      const cur = out[i]!;
      const b = muscleBucket(cur, ctx.focus);
      if (!b || !over.includes(b) || out.filter((o) => muscleBucket(o, ctx.focus) === b).length < 2) continue;
      if (needs && focusRole(cur) !== "other") continue;
      const fits = (e: T) => missing.includes(muscleBucket(e, ctx.focus) ?? "") && advancedOk(e);
      const s = spare((e) => fits(e) && (!ctx.equipmentExpected || !isBodyweightRow(e) || isBodyweightRow(cur))) ?? spare(fits);
      if (s) { out[i] = s; done = true; }
    }
    if (!done) break;
  }
  return out;
}

/** Final check before a member sees the workout. Empty = passes. */
export function memberQualityIssues(main: QExercise[], ctx: QualityCtx & { minutesFitCount: number }): string[] {
  const issues: string[] = [];
  const keys = main.map((e) => movementKey(e.name, ctx.focus));
  if (new Set(keys).size !== keys.length) issues.push("An exercise is repeated in the Main Workout.");
  const minimum = Math.min(levelMainMinimum(ctx.level), Math.max(3, ctx.minutesFitCount));
  if (main.length < minimum && ctx.pool.length >= minimum) issues.push(`Main Workout has ${main.length} exercises; ${minimum} expected.`);
  const needs = focusNeeds(ctx.focus, main.length);
  if (needs) {
    const glutePossible = ctx.pool.filter(isGluteWork).length;
    const corePossible = ctx.pool.filter(isCoreWork).length;
    if (main.filter(isGluteWork).length < Math.min(needs.glute, glutePossible)) issues.push("Not enough glute exercises for the Core & Glutes focus.");
    if (main.filter(isCoreWork).length < Math.min(needs.core, corePossible)) issues.push("Not enough core exercises for the Core & Glutes focus.");
  }
  const spread = muscleSpreadGap(main, ctx.pool, ctx.focus, ctx.muscle);
  if (spread.over.length) issues.push(`Main Workout repeats ${spread.over.join(" / ")} while ${spread.missing.join(" / ")} has no exercise.`);
  if (ctx.equipmentExpected) {
    const possible = ctx.pool.filter((e) => !isBodyweightRow(e)).length;
    const want = Math.min(Math.ceil(main.length / 2), possible);
    if (main.filter((e) => !isBodyweightRow(e)).length < want) issues.push("The selected equipment is not used in at least half of the Main Workout.");
  }
  if (ctx.level === "advanced") {
    const harder = ctx.pool.filter((e) => (e.difficulty ?? "").toLowerCase() !== "beginner").length;
    const easy = main.filter((e) => (e.difficulty ?? "").toLowerCase() === "beginner").length;
    if (easy > 0 && harder >= main.length) issues.push("Advanced workout contains beginner-only exercises while harder ones were available.");
  }
  return issues;
}
