import { orderedPriority, pickPriorityByPattern } from "./priority";
// Deterministic template ("pack") engine.
// Builds a fully compliant session straight from the filtered pool — no model
// involved. Used as the reliability fallback when the AI cannot produce a
// workout that passes enforcement + validation.
import type { PoolExercise } from "./pool.server";
import { nextSeed, pickPrep, STRETCH_RE } from "./pool.server";
import { dominantRegion, equipmentFamilyLimit, equipmentFamilyOf, isDynamicFormat, regionOf } from "./doctrine";
import type { SessionPlan } from "./programming";
import { prepAllowed } from "./prep-vocabulary";
import { isCardioRhythm, isTimedPosition, isTimeDosed, LIGHT_SET_CAP, TABATA_TRAVEL_RE } from "./rules";
import { buildFinisherHtml, finisherMinimumMinutes } from "./finisher-length";
import { FOCUS_RULES, focusBreaks, focusGroups, normFocus, type FocusGroup } from "./strength-focus";
import { dedupeMovements, improvePicks, levelMainMinimum, levelMinSets, movementKey } from "./member-quality";
import type { Category, DifficultyLevel, Format, StrengthFocus } from "./spec";

export type PackInput = {
  category: Category;
  format: Format;
  level: DifficultyLevel;
  minutes: number;
  focus?: StrengthFocus | null;
  muscle?: string | null;
  favoriteIds?: string[];
  /** Library-backed prep vocabulary; guarantees playable Activation / Cool Down. */
  activationPool?: PoolExercise[];
  cooldownPool?: PoolExercise[];
  seed?: number;
  /** Blueprint decision (programming.ts) — authoritative. No Finisher when false. */
  finisher?: boolean;
  /** The session blueprint — counts and doses come from here when present. */
  plan?: Pick<SessionPlan, "mainCount" | "finisherCount" | "main" | "finisher">;
  /** Exercises already at their category usage cap (exercise-usage.ts); avoided while enough others remain. */
  overusedIds?: string[];
  /** Member chose equipment beyond bodyweight: at least half the Main Workout uses it (member-quality.ts). */
  equipmentExpected?: boolean;
};

/**
 * Human flow: keep at most the legal number of implement families (replacing
 * stray rows with legal rows from the kept families or bodyweight) and, in a
 * timed format, group each implement into one contiguous block.
 */
function flowGroup(picks: PoolExercise[], pool: PoolExercise[], input: PackInput, used: Set<string>): PoolExercise[] {
  const fam = (e: PoolExercise) => equipmentFamilyOf(e.equipment);
  const counts = new Map<string, number>();
  for (const e of picks) if (fam(e) !== "bodyweight") counts.set(fam(e), (counts.get(fam(e)) ?? 0) + 1);
  const keep = new Set([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, equipmentFamilyLimit(input.category, input.format)).map(([f]) => f));
  const ok = (e: PoolExercise) => fam(e) === "bodyweight" || keep.has(fam(e));
  const taken = new Set([...used, ...picks.map((e) => e.id)]);
  let out = picks.map((e) => {
    if (ok(e)) return e;
    const alt = pool.find((x) => ok(x) && !taken.has(x.id));
    if (!alt) return e;
    taken.add(alt.id);
    return alt;
  });
  if (isDynamicFormat(input.format)) {
    const order = [...new Set(out.map(fam))];
    out = [...out].sort((a, b) => order.indexOf(fam(a)) - order.indexOf(fam(b)));
  }
  return out;
}


export type PackResult = { html: string; name: string; blocks: string[]; main: PoolExercise[]; fitCount: number };

const li = (inner: string) =>
  `<ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">${inner}</p></li></ul>`;
const para = (inner: string) => `<p class="tiptap-paragraph">${inner}</p>`;
const heading = (icon: string, title: string) =>
  para(`${icon} <strong><u>${title}</u></strong>`);
const token = (e: PoolExercise) => `{{exercise:${e.id}:${e.name}}}`;

const SOFT_TISSUE = [
  "60 sec Foam roll quadriceps — slow controlled passes",
  "60 sec Foam roll thoracic spine — pause on tender spots",
  "45 sec Lacrosse ball glute release — each side",
];

const COOLDOWN_FALLBACK = [
  "45 sec Standing hamstring stretch — each side, breathe out into it",
  "45 sec Chest doorway stretch — ribs down, shoulders relaxed",
  "60 sec Box breathing — 4 in, 4 hold, 4 out, 4 hold",
];

const ACTIVATION_FALLBACK = [
  "10 reps Bodyweight glute bridge — squeeze 1 sec at the top",
  "10 reps Scapular wall slide — keep ribs down",
  "8 reps each side World’s greatest stretch — slow and controlled",
  "20 sec Dead bug hold — breathe, no arching",
];

const isBodyweight = (e: PoolExercise) => (e.equipment ?? "").toLowerCase().includes("body weight");

function shuffle<T>(arr: T[], seed = 1): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = nextSeed(s);
    const j = (s >>> 8) % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Picks `count` exercises, rotating body parts and honouring favourites first. */
export function pickBalanced(
  pool: PoolExercise[],
  count: number,
  opts: { favoriteIds?: string[]; exclude?: Set<string>; filter?: (e: PoolExercise) => boolean } = {},
): PoolExercise[] {
  const exclude = opts.exclude ?? new Set<string>();
  const candidates = pool.filter((e) => !exclude.has(e.id) && (opts.filter ? opts.filter(e) : true));
  if (!candidates.length) return [];

  const favourites = (opts.favoriteIds ?? []).length
    ? candidates.filter((e) => opts.favoriteIds!.includes(e.id))
    : [];

  const byPart = new Map<string, PoolExercise[]>();
  for (const e of candidates) {
    if (favourites.includes(e)) continue;
    const key = e.body_part ?? "other";
    if (!byPart.has(key)) byPart.set(key, []);
    byPart.get(key)!.push(e);
  }

  const picked: PoolExercise[] = [];
  const seen = new Set<string>();
  for (const fav of favourites) {
    if (picked.length >= count) break;
    picked.push(fav);
    seen.add(fav.id);
  }

  const parts = shuffle([...byPart.keys()], candidates.length);
  let guard = 0;
  while (picked.length < count && guard < count * 12) {
    guard += 1;
    for (const part of parts) {
      const list = byPart.get(part);
      if (!list?.length) continue;
      const next = list.shift()!;
      if (seen.has(next.id)) continue;
      picked.push(next);
      seen.add(next.id);
      if (picked.length >= count) break;
    }
    if (parts.every((p) => !byPart.get(p)?.length)) break;
  }
  return picked;
}

/** Fill a prescribed block from the legal pool even when a narrow filter leaves few rows. */
function fillFromLegalPool(picks: PoolExercise[], pool: PoolExercise[], count: number): PoolExercise[] {
  if (!pool.length || count <= 0) return [];
  // Never repeat an exercise to fill a block (Coach Haris): a shorter list beats a duplicate.
  const out: PoolExercise[] = [];
  const seen = new Set<string>();
  const key = (e: PoolExercise) => movementKey(e.name, null);
  for (const e of [...picks, ...pool]) {
    if (out.length >= count) break;
    if (seen.has(e.id) || seen.has(key(e))) continue;
    out.push(e);
    seen.add(e.id);
    seen.add(key(e));
  }
  return out;
}

type Dose = { text: string; protocol: string | null };

function doseFor(format: Format, level: DifficultyLevel, index: number, light = false): Dose {
  // Recovery / Mobility & Stability never exceed the light-category set cap (rules.ts).
  const sets = Math.min(level === "beginner" ? 3 : level === "advanced" ? 5 : 4, light ? LIGHT_SET_CAP : 99);
  const reps = level === "beginner" ? 10 : level === "advanced" ? 8 : 10;
  const rest = level === "beginner" ? 90 : level === "advanced" ? 60 : 75;
  const work = level === "beginner" ? 30 : level === "advanced" ? 45 : 40;

  switch (format) {
    case "REPS & SETS":
      return {
        text: `${sets} sets × ${reps} reps`,
        protocol: `Rest ${rest} sec between sets. Controlled lowering, strong finish.`,
      };
    case "TABATA":
      return { text: "20 sec", protocol: "8 rounds of 20 sec work / 10 sec rest per station." };
    case "EMOM":
      return { text: `Minute ${index + 1}: ${reps + 2} reps`, protocol: null };
    case "AMRAP":
      return { text: `${reps + 2} reps`, protocol: null };
    case "FOR TIME":
      return { text: `${reps * 2} reps`, protocol: null };
    case "MIX":
      return index < 2
        ? { text: `${sets} sets × ${reps} reps`, protocol: null }
        : { text: `${work} sec`, protocol: null };
    case "CIRCUIT":
    default:
      return { text: `${work} sec`, protocol: null };
  }
}

function roundsFor(format: Format, minutes: number, stations: number, share = 0.6): string | null {
  const rounds = Math.max(2, Math.min(6, Math.round(minutes / Math.max(4, stations * 1.5))));
  const clock = (floor: number) => Math.max(floor, Math.round(minutes * share));
  switch (format) {
    case "CIRCUIT":
      return `${rounds} rounds. Rest 60 sec between rounds.`;
    case "AMRAP":
      return `As many rounds as possible in ${clock(8)} minutes.`;
    case "FOR TIME":
      return `${rounds} rounds for time. Cap: ${clock(10)} minutes.`;
    case "EMOM":
      return `EMOM for ${clock(10)} minutes, cycling the list.`;
    case "TABATA":
      return `8 rounds of 20 sec work / 10 sec rest at every station.`;
    default:
      return null;
  }
}

const NAME_LEFT = ["Steady", "Honest", "Quiet", "Clean", "Solid", "Simple", "Patient", "Sharp"];
const NAME_RIGHT: Record<string, string> = {
  STRENGTH: "Lift Session",
  "CALORIE BURNING": "Sweat Session",
  METABOLIC: "Mixed Session",
  CARDIO: "Pace Session",
  "MOBILITY & STABILITY": "Mobility Session",
  CHALLENGE: "Test Session",
  PILATES: "Mat Session",
  RECOVERY: "Reset Session",
  "MICRO-WORKOUTS": "Short Session",
};

/**
 * Builds a compliant session deterministically from the pool.
 * `library` supplies activation / cool-down movements that the strict session
 * pool may have filtered out.
 */
export function buildPackWorkout(
  pool: PoolExercise[],
  library: PoolExercise[],
  input: PackInput,
): PackResult {
  const isMicro = input.category === "MICRO-WORKOUTS";
  const isRecovery = input.category === "RECOVERY";
  // HARD RULE: Micro Workout and Pilates never get a finisher.
  const levelStars = input.level === "beginner" ? 1 : input.level === "advanced" ? 3 : 2;
  const finMin = finisherMinimumMinutes(levelStars);
  // A Finisher lasts its level minimum (finisher-length.ts); it exists only
  // when the Main Workout still keeps at least 15 min of the clock.
  const noFinisher =
    (input.finisher === undefined ? isMicro || isRecovery || input.category === "PILATES" : !input.finisher) ||
    input.minutes - finMin < 15;
  const mainMinutes = noFinisher ? input.minutes : input.minutes - finMin;
  const favouriteIds = input.favoriteIds ?? [];
  const used = new Set<string>();

  const baseCount = input.plan ? Math.max(3, input.minutes <= 20 ? input.plan.mainCount[0] : input.plan.mainCount[1]) : isMicro ? 4 : input.minutes >= 45 ? 6 : input.minutes >= 25 ? 5 : 4;
  // Level minimum (Beginner 4 / Intermediate 5 / Advanced 6), fewer only when the time can't fit them.
  const specialist = isMicro || isRecovery || input.category === "PILATES" || input.category === "MOBILITY & STABILITY";
  const levelMin = input.level === "all" ? 4 : levelMainMinimum(input.level);
  const minSets = input.level === "all" ? 2 : levelMinSets(input.level);
  const perExerciseSec = input.plan ? minSets * (45 + input.plan.main.restSec[0]) : 180;
  const fitCount = input.format === "REPS & SETS" ? Math.max(3, Math.floor((mainMinutes * 60) / perExerciseSec)) : 99;
  const fullCount = specialist ? baseCount : Math.max(baseCount, Math.min(levelMin, fitCount));
  // TABATA is fixed (8 × 20/10 = 4 min per exercise): only as many blocks as the Main Workout's minutes hold.
  const mainCount = input.format === "TABATA" ? Math.min(fullCount, Math.max(3, Math.floor(mainMinutes / 4))) : fullCount;
  const finisherCount = input.plan ? Math.max(input.plan.finisherCount[0], 1) : 3;
  // Coach's priority exercises (the 3 × 50 lists) come first; the rest of the
  // legal pool is only used to top up when too few priority matches exist.
  // Mobility & Stability and Pilates keep their own specialist vocabulary.
  const usePriority = input.category !== "MOBILITY & STABILITY" && input.category !== "PILATES" && input.category !== "RECOVERY";
  const flow = input.format !== "REPS & SETS";
  // CARDIO blocks are rhythmic aerobic work (rules.ts): draw them from the rhythm vocabulary.
  const rhythmPool = pool.filter((e) => isCardioRhythm(e.name) && !/burpee|mountain climber|skater|sprint|jump squat|tuck|depth/i.test(e.name));
  const basePool = input.category === "CARDIO" && rhythmPool.length >= 4 ? rhythmPool : pool;
  // Usage cap: skip exercises that already dominate this category while enough others remain.
  const overused = new Set(input.overusedIds ?? []);
  const fresh = basePool.filter((e) => !overused.has(e.id));
  const workPool = overused.size && fresh.length >= mainCount + finisherCount + 2 ? fresh : basePool;
  const pickPriorityFirst = (count: number, favs: string[]) => {
    const first = usePriority
      ? pickPriorityByPattern(workPool, count, { exclude: used, seed: input.seed ?? input.minutes, conditioningFirst: flow })
      : [];
    if (first.length >= count) return first;
    const ex = new Set([...used, ...first.map((e) => e.id)]);
    // Any remaining priority movement comes before non-priority filler.
    const more = usePriority ? orderedPriority(workPool).filter((e) => !ex.has(e.id)).slice(0, count - first.length) : [];
    if (first.length + more.length >= count) return [...first, ...more];
    more.forEach((e) => ex.add(e.id));
    return [...first, ...more, ...pickBalanced(workPool, count - first.length, { favoriteIds: favs, exclude: ex })];
  };
  const mainPicks = flowGroup(fillFromLegalPool(
    pickPriorityFirst(mainCount, favouriteIds),
    pool,
    mainCount,
  ), pool, input, used);
  if (!specialist) {
    const better = improvePicks(mainPicks, workPool.length >= mainCount ? workPool : pool, {
      level: input.level === "all" ? "intermediate" : input.level,
      focus: input.focus ?? null,
      muscle: input.muscle ?? null,
      equipmentExpected: Boolean(input.equipmentExpected),
      pool: workPool,
    });
    mainPicks.splice(0, mainPicks.length, ...flowGroup(better, pool, input, new Set()));
  }
  mainPicks.forEach((e) => used.add(e.id));

  const finisherPicks = noFinisher
    ? []
    : (() => {
        // Finisher keeps the Main Workout's equipment flow: no new station for the last minutes.
        const fams = new Set(mainPicks.map((e) => equipmentFamilyOf(e.equipment)));
        const flowPool = workPool.filter((e) => fams.has(equipmentFamilyOf(e.equipment)) || equipmentFamilyOf(e.equipment) === "bodyweight");
        const src = flowPool.length >= finisherCount ? flowPool : workPool;
        const first = usePriority ? pickPriorityByPattern(src, finisherCount, { exclude: used, seed: (input.seed ?? input.minutes) + 7, conditioningFirst: flow }) : [];
        const ex = new Set([...used, ...first.map((e) => e.id)]);
        const more = usePriority ? orderedPriority(src).filter((e) => !ex.has(e.id)).slice(0, finisherCount - first.length) : [];
        more.forEach((e) => ex.add(e.id));
        const prioMain = usePriority ? new Set(orderedPriority(mainPicks).map((e) => e.id)) : new Set<string>();
        void prioMain;
        // No exercise (or variant) from the Main Workout is repeated in the Finisher (Coach Haris, 14 Oct 2026).
        const mainKeys = new Set(mainPicks.map((e) => movementKey(e.name, input.focus)));
        const fresh = (e: PoolExercise) => !mainKeys.has(movementKey(e.name, input.focus));
        const got = [...first, ...more].filter(fresh);
        const picks = got.length >= finisherCount ? got : [...got, ...pickBalanced(src.filter(fresh), finisherCount - got.length, { exclude: ex })];
        const filled = fillFromLegalPool(picks, src, finisherCount);
        const seenKeys = new Set(mainKeys);
        const spareOf = () => src.find((e) => !seenKeys.has(movementKey(e.name, input.focus)) && !used.has(e.id) && !filled.some((f) => f.id === e.id));
        for (let i = 0; i < filled.length; i++) {
          const k = movementKey(filled[i]!.name, input.focus);
          if (seenKeys.has(k)) {
            const s = spareOf();
            if (s) filled[i] = s;
            else { filled.splice(i, 1); i--; continue; } // no spare: drop it, never repeat
          }
          seenKeys.add(movementKey(filled[i]!.name, input.focus));
        }
        return flowGroup(filled, src, input, new Set([...used, ...mainPicks.map((e) => e.id)]));
      })();
  finisherPicks.forEach((e) => used.add(e.id));
  // Block rules decided by rules.ts are repaired here by swapping exercises, so
  // the delivered session passes the same gate Admin uses.
  const keyOf = (e: PoolExercise) => movementKey(e.name, input.focus);
  const takenKeys = () => new Set([...mainPicks, ...finisherPicks].map(keyOf));
  const spareWhere = (ok: (e: PoolExercise) => boolean) => {
    const taken = takenKeys();
    return [...workPool, ...pool].find((e) => ok(e) && !used.has(e.id) && !taken.has(keyOf(e)));
  };
  // CARDIO: each block is rhythmic aerobic work with at most one strength-type
  // move, and no exercise repeats between blocks. The rhythm vocabulary is
  // shared out so the Finisher keeps its own aerobic moves (≥3 exercises).
  if (input.category === "CARDIO") {
    const tabataOk = (e: PoolExercise) => !(input.format === "TABATA" && TABATA_TRAVEL_RE.test(e.name.trim()));
    const seenK = new Set<string>();
    const rhythm: PoolExercise[] = [];
    for (const e of [...mainPicks, ...finisherPicks, ...workPool, ...pool]) {
      if (!isCardioRhythm(e.name) || !tabataOk(e) || seenK.has(keyOf(e))) continue;
      seenK.add(keyOf(e));
      rhythm.push(e);
    }
    const strengthMoves: PoolExercise[] = [];
    for (const e of [...mainPicks, ...finisherPicks, ...workPool, ...pool]) {
      if (isCardioRhythm(e.name) || seenK.has(keyOf(e))) continue;
      seenK.add(keyOf(e));
      strengthMoves.push(e);
    }
    // Equipment rhythm moves go to the Main Workout so the Finisher never adds a new station.
    rhythm.sort((a, b) => Number(isBodyweight(a)) - Number(isBodyweight(b)));
    const wantFinisher = !noFinisher && rhythm.length >= 4;
    const finRhythm = wantFinisher ? 2 : 0;
    const mainRhythm = rhythm.slice(0, Math.min(rhythm.length - finRhythm, Math.max(mainPicks.length - 1, 3)));
    const finRhythmPicks = wantFinisher ? rhythm.slice(mainRhythm.length, mainRhythm.length + finRhythm) : [];
    const mainStrength = strengthMoves.slice(0, mainRhythm.length + 1 > mainPicks.length && mainRhythm.length >= 3 ? 0 : 1);
    // The Finisher keeps the Main Workout's equipment flow: no new station.
    const mainFams = new Set([...mainRhythm, ...mainStrength].map((e) => equipmentFamilyOf(e.equipment)));
    const finStrength = wantFinisher
      ? strengthMoves.filter((e) => !mainStrength.includes(e) && (mainFams.has(equipmentFamilyOf(e.equipment)) || equipmentFamilyOf(e.equipment) === "bodyweight")).slice(0, 1)
      : [];
    if (mainRhythm.length >= 3) {
      mainPicks.splice(0, mainPicks.length, ...mainRhythm, ...mainStrength);
      finisherPicks.splice(0, finisherPicks.length, ...(wantFinisher ? [...finRhythmPicks, ...finStrength] : []));
      used.clear();
      [...mainPicks, ...finisherPicks].forEach((e) => used.add(e.id));
    }
  }
  // CHALLENGE: no body region above 60% of the work.
  if (input.category === "CHALLENGE") {
    for (let guard = 0; guard < 8; guard++) {
      const work = [...mainPicks, ...finisherPicks];
      const counts: Record<string, number> = { lower: 0, upper: 0, core: 0, full: 0 };
      for (const e of work) counts[regionOf(e)] = (counts[regionOf(e)] ?? 0) + 1;
      const top = (["lower", "upper", "core"] as const).slice().sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0]!;
      const represented = (["lower", "upper", "core"] as const).filter((r) => (counts[r] ?? 0) > 0).length;
      if ((counts[top] ?? 0) / Math.max(1, work.length) <= 0.6 && (represented >= 2 || (counts["full"] ?? 0) * 2 >= work.length)) break;
      const low = (["lower", "upper", "core"] as const).slice().sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0))[0]!;
      const rep = spareWhere((e) => regionOf(e) === low && isBodyweight(e)) ?? spareWhere((e) => regionOf(e) === low);
      if (!rep) break;
      const list = finisherPicks.some((e) => regionOf(e) === top) ? finisherPicks : mainPicks;
      const at = list.map(regionOf).lastIndexOf(top);
      if (at < 0) break;
      used.add(rep.id); list[at] = rep;
    }
  }
  // STRENGTH / MUSCLE BUILDING: the Finisher stays shorter than the Main Workout.
  if ((input.category === "STRENGTH" || input.category === "MUSCLE BUILDING") && finisherPicks.length && finisherPicks.length >= mainPicks.length) {
    for (let i = mainPicks.length; i <= finisherPicks.length; i++) {
      const rep = spareWhere(() => true);
      if (!rep) break;
      used.add(rep.id); mainPicks.push(rep);
    }
    while (finisherPicks.length >= mainPicks.length && finisherPicks.length > 3) finisherPicks.pop();
  }
  // Every Finisher has at least 3 exercises: top up from unused legal moves,
  // otherwise move surplus Main Workout exercises (never repeating one).
  if (finisherPicks.length && finisherPicks.length < 3) {
    const fams = new Set(mainPicks.map((e) => equipmentFamilyOf(e.equipment)));
    while (finisherPicks.length < 3) {
      const rep = spareWhere((e) => fams.has(equipmentFamilyOf(e.equipment)) || equipmentFamilyOf(e.equipment) === "bodyweight");
      if (rep) { used.add(rep.id); finisherPicks.push(rep); continue; }
      if (mainPicks.length <= Math.max(4, levelMin)) break;
      finisherPicks.push(mainPicks.pop()!);
    }
  }
  // CHALLENGE is majority bodyweight (doctrine): swap surplus equipment picks for unused bodyweight moves.
  if (input.category === "CHALLENGE") {
    const all = [...mainPicks, ...finisherPicks];
    const spare = workPool.filter((e) => isBodyweight(e) && !used.has(e.id));
    let bw = all.filter(isBodyweight).length;
    for (const list of [finisherPicks, mainPicks])
      for (let i = list.length - 1; i >= 0 && bw * 2 <= all.length && spare.length; i--)
        if (!isBodyweight(list[i]!)) {
          const r = regionOf(list[i]!);
          const k = Math.max(0, spare.findIndex((e) => regionOf(e) === r));
          const [rep] = spare.splice(k, 1);
          used.add(rep!.id); list[i] = rep!; bw++;
        }
  }

  // STRENGTH / MUSCLE BUILDING focus coverage (strength-focus.ts): each movement
  // group the focus needs appears in the Main Workout (twice with 4+ exercises).
  const focusRule = FOCUS_RULES[normFocus(input.focus)];
  if ((input.category === "STRENGTH" || input.category === "MUSCLE BUILDING") && focusRule) {
    for (let guard = 0; guard < 8; guard++) {
      const min = mainPicks.length >= 4 && focusRule.need.length === 2 ? 2 : 1;
      const haveOf = (need: FocusGroup[]) => mainPicks.filter((e) => focusGroups(e).some((g) => need.includes(g))).length;
      const short = focusRule.need.find((need) => haveOf(need) < min);
      if (!short) break;
      const fits = (e: PoolExercise) => focusGroups(e).some((g) => short.includes(g)) && focusBreaks(input.focus, [e], []).every((b) => /needs at least/.test(b));
      const spare = spareWhere(fits);
      // No unused one left: bring it forward from the Finisher (swapped, never repeated).
      const finAt = spare ? -1 : finisherPicks.findIndex(fits);
      const rep = spare ?? (finAt >= 0 ? finisherPicks[finAt] : undefined);
      if (!rep) break;
      // Replace the exercise whose group has the most surplus (or that no requirement needs).
      let at = -1, bestSurplus = -1;
      mainPicks.forEach((e, i) => {
        const needs = focusRule.need.filter((need) => focusGroups(e).some((g) => need.includes(g)));
        const surplus = needs.length ? Math.min(...needs.map((n) => haveOf(n) - min)) : 99;
        if (surplus > 0 && surplus > bestSurplus) { bestSurplus = surplus; at = i; }
      });
      if (at < 0) {
        if (finAt >= 0) finisherPicks.splice(finAt, 1);
        used.add(rep.id); mainPicks.push(rep); continue;
      }
      if (finAt >= 0) finisherPicks[finAt] = mainPicks[at]!;
      used.add(rep.id); mainPicks[at] = rep;
    }
  }
  const seed = input.seed ?? (mainPicks[0]?.id.length ?? 5) * 31 + input.minutes;

  // §21 — activation is DERIVED from the main block that was just built: the
  // prep vocabulary is narrowed to the dominant region of the chosen main
  // exercises before anything is picked, so irrelevant prep is never offered.
  const mainRegion = dominantRegion(mainPicks);
  const derivedActivationPool = (input.activationPool ?? []).filter((e) => {
    if (mainRegion === "full") return true;
    const r = regionOf(e);
    return (
      r === mainRegion ||
      r === "full" ||
      (mainRegion === "lower" && r === "core") ||
      (mainRegion === "core" && r === "lower")
    );
  });
  // Activation never repeats an exercise (or variant) used later in Main Workout / Finisher.
  const workKeys = new Set([...mainPicks, ...finisherPicks].map((e) => movementKey(e.name, input.focus)));
  const notInWork = (e: PoolExercise) => !workKeys.has(movementKey(e.name, input.focus));
  const relevantActivationPool = dedupeMovements(
    (derivedActivationPool.filter(notInWork).length >= 4 ? derivedActivationPool : (input.activationPool ?? [])).filter(notInWork),
  );

  const activationPicks = (relevantActivationPool.length ? pickPrep(relevantActivationPool, 4, seed) : []) as PoolExercise[];
  // Every Activation carries real library exercises: top up from the full
  // activation vocabulary, then the approved bodyweight prep list — never plain text.
  const topUp = (picks: PoolExercise[], count: number, sources: PoolExercise[][]) => {
    const keys = new Set(picks.map((e) => movementKey(e.name, input.focus)));
    for (const src of sources)
      for (const e of src) {
        if (picks.length >= count) return;
        const k = movementKey(e.name, input.focus);
        if (keys.has(k)) continue;
        keys.add(k);
        picks.push(e);
      }
  };
  topUp(activationPicks, 4, [
    dedupeMovements((input.activationPool ?? []).filter(notInWork), input.focus),
    pickBalanced(library, 8, {
      filter: (e) =>
        notInWork(e) &&
        isBodyweight(e) &&
        prepAllowed(e.name, "activation") &&
        (e.difficulty ?? "").toLowerCase() !== "advanced",
    }),
  ]);

  // Cool Down stretches the muscles the Main Workout trained.
  const cdAll = dedupeMovements(input.cooldownPool ?? [], input.focus);
  const cdRelevant = cdAll.filter((e) => {
    const r = regionOf(e);
    if (mainRegion === "full") return true;
    return r === mainRegion || (mainRegion === "lower" && r === "core") || (mainRegion === "core" && r === "lower");
  });
  const cdPool = cdRelevant.length >= 3 ? cdRelevant : cdAll;
  const cooldownPicks = (cdPool.length ? pickPrep(cdPool, 3, seed + 17) : []) as PoolExercise[];
  topUp(cooldownPicks, 3, [
    cdAll,
    pickBalanced(library, 6, { filter: (e) => isBodyweight(e) && STRETCH_RE.test(e.name) && prepAllowed(e.name, "cooldown") }),
  ]);

  const blocks: string[] = [];

  if (!isMicro) {
    blocks.push(heading("🧽", "Soft Tissue Preparation"));
    SOFT_TISSUE.forEach((line) => blocks.push(li(line)));
  }

  // Micro Workout is one coherent block: no activation, no cool-down section.
  if (!isMicro) {
    blocks.push(heading("🔥", "Activation 5'"));
    if (activationPicks.length >= 3) {
      activationPicks.forEach((e) => blocks.push(li(`${isTimedPosition(e.name) ? "30 sec" : "8 reps"} ${token(e)} — slow and controlled`)));
    } else {
      ACTIVATION_FALLBACK.forEach((line) => blocks.push(li(line)));
    }
  }

  // With a Finisher the Main Workout owns exactly the minutes left after it.
  const protocolLine = noFinisher
    ? roundsFor(input.format, input.minutes, mainPicks.length)
    : roundsFor(input.format, mainMinutes, mainPicks.length, 1);
  blocks.push(heading("💪", `Main Workout (${input.format})`));
  if (protocolLine) blocks.push(para(protocolLine));
  const planned = (d: SessionPlan["main"], e: PoolExercise) => {
    // Bodyweight strength work needs more reps than a loaded lift to be a real stimulus.
    const reps = isBodyweight(e) ? Math.max(d.reps?.[1] ?? 10, 10) : (d.reps?.[0] ?? 10);
    // Fit the sets to the advertised training time (real work per set plus rest).
    const work = isTimeDosed(e.name) ? (d.seconds?.[0] ?? 30) : reps * 5;
    const blocks = Math.max(1, mainCount);
    const fit = Math.floor((mainMinutes * 60) / (blocks * (work + d.restSec[0])));
    const sets = Math.max(minSets, Math.min(d.sets[1], fit));
    const unit = isTimeDosed(e.name) ? `${d.seconds?.[0] ?? 30} sec` : `${reps} reps`;
    return `${sets} sets × ${unit} ${token(e)} — Rest ${d.restSec[0]} sec between sets`;
  };
  mainPicks.forEach((e, i) => {
    if (input.format === "REPS & SETS" && input.plan) return void blocks.push(li(planned(input.plan.main, e)));
    const dose = doseFor(input.format, input.level, i, input.category === "RECOVERY" || input.category === "MOBILITY & STABILITY");
    const text = isTimeDosed(e.name) && /reps/.test(dose.text) ? dose.text.replace(/\d+ reps/, "30 sec") : dose.text;
    blocks.push(li(`${text} ${token(e)}${dose.protocol ? ` — ${dose.protocol}` : ""}`));
  });

  if (finisherPicks.length) {
    // Finisher length rule: level minimum, honest rounds/sets × (work + rest).
    buildFinisherHtml({ category: input.category, stars: levelStars, exercises: finisherPicks, mainFormat: input.format }).blocks.forEach((b) => blocks.push(b));
  }

  if (!isMicro) {
  blocks.push(heading("🧘", "Cool Down"));
  if (cooldownPicks.length >= 3) {
    cooldownPicks.forEach((e) => blocks.push(li(`45 sec ${token(e)} — breathe out into the position`)));
    blocks.push(li(COOLDOWN_FALLBACK[2]!));
  } else {
    COOLDOWN_FALLBACK.forEach((line) => blocks.push(li(line)));
  }
  }


  const seedWord = NAME_LEFT[(mainPicks[0]?.id.length ?? 3) % NAME_LEFT.length]!;
  const name = `${seedWord} ${NAME_RIGHT[input.category] ?? "Session"}`;

  return { html: blocks.join(para("")), name, blocks, main: mainPicks, fitCount };
}

export function packCopy(input: PackInput): {
  description_html: string;
  instructions_html: string;
  tips_html: string;
} {
  return {
    description_html: para(
      `A ${input.level === "all" ? "mixed" : input.level} ${input.category.toLowerCase()} session built to your available equipment and today's time budget. Straightforward work, no wasted minutes.`,
    ),
    instructions_html: para(
      `Work through the sections in order: soft tissue, activation, main workout, finisher, cool down. Respect the prescribed dose before each exercise and keep the rest honest.`,
    ),
    tips_html: [
      para("Set up before you start so you are not hunting for equipment mid-session."),
      para("Quality of movement beats speed — slow down before technique breaks."),
      para("Stop and reassess if you feel sharp pain, dizziness or chest tightness."),
    ].join(""),
  };
}
