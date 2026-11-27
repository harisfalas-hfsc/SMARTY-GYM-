import { parseCombinedFocus, matchesMuscleSelection, muscleBucket } from "./muscle-spread";
import { isPriorityExercise } from "./priority";
import { movementKey } from "./member-quality";
import type { PoolExercise } from "./pool.server";

/** Narrow muscles may have fewer approved movements; reserve the Finisher before filling Main. */
export function combinationFits(pool: PoolExercise[], focus: string, mainCount: number, finisherCount: number): boolean {
  const selections = parseCombinedFocus(focus);
  if (selections.length !== 2) return false;
  const capacity = selections.map((_, i) => new Set(pool.filter(isPriorityExercise)
    .filter((e) => selections.findIndex((s) => matchesMuscleSelection(e, s)) === i)
    .map((e) => movementKey(e.name, focus))).size);
  return (capacity[0] ?? 0) >= Math.ceil(mainCount / 2) + Math.ceil(finisherCount / 2) &&
    (capacity[1] ?? 0) >= Math.floor(mainCount / 2) + Math.floor(finisherCount / 2);
}
export function combinedMainCount(pool: PoolExercise[], focus: string, desired: number, minimum: number, finisherCount: number): number {
  if (parseCombinedFocus(focus).length !== 2) return desired;
  const floor = finisherCount ? Math.max(minimum, finisherCount + 1) : minimum;
  for (let n = desired; n >= floor; n--) {
    if (combinationFits(pool, focus, n, finisherCount)) return n;
  }
  return desired; // The full gate refuses it; never weaken the level minimum or fill with repeats.
}

/** The pool already enforces safety, equipment, pictures and closed lists. */
export function pickCombined(
  pool: PoolExercise[], count: number, focus: string,
  options: { seed: number; favorites: string[]; excluded?: PoolExercise[]; advanced?: boolean; accessory?: boolean },
): PoolExercise[] {
  const selections = parseCombinedFocus(focus);
  if (selections.length !== 2) return [];
  const keys = new Set((options.excluded ?? []).map((e) => movementKey(e.name, focus)));
  const chosen: PoolExercise[][] = [[], []];
  const rank = (id: string) => {
    let n = options.seed | 0;
    for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const eligible = pool.filter(isPriorityExercise);
  for (let slot = 0; slot < count; slot++) {
    const index = slot % 2;
    const group = chosen[index];
    const selection = selections[index];
    if (!selection || !group) break;
    const candidates = eligible.filter((e) => selections.findIndex((s) => matchesMuscleSelection(e, s)) === index && !keys.has(movementKey(e.name, focus)));
    const represented = new Set(group.map((e) => muscleBucket(e, selection.focus)));
    const score = (e: PoolExercise) =>
      Number(!selection.muscle && represented.has(muscleBucket(e, selection.focus))) * 16 +
      Number(Boolean(options.advanced) && e.difficulty === "beginner") * 8 +
      Number((e.equipment ?? "").toLowerCase().includes("body weight")) * 4 +
      Number(!options.favorites.includes(e.id)) * 2 +
      Number(Boolean(/fly|curl|lateral raise|extension|pushdown/i.test(e.name)) !== Boolean(options.accessory));
    candidates.sort((a, b) => score(a) - score(b) || rank(a.id) - rank(b.id));
    const next = candidates[0];
    // Never silently substitute the other group or double the workout volume.
    if (!next) break;
    group.push(next);
    keys.add(movementKey(next.name, focus));
  }
  // Deterministic variations: alternating muscle groups or normal grouped sets.
  if (options.seed % 2) return chosen.flat();
  const result: PoolExercise[] = [];
  for (let i = 0; i < count; i++) {
    const e = chosen[i % 2]?.[Math.floor(i / 2)];
    if (e) result.push(e);
  }
  return result;
}