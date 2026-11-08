/**
 * Coach Haris Falas's PRIORITY EXERCISE LISTS.
 *
 * These are the movements the engine should reach for most of the time in
 * each environment. They are NOT pasted into workouts verbatim: each name is
 * resolved to the closest real exercise in the library (e.g. "Bodyweight
 * Squat" → "bodyweight squat" / "air squat"), so every workout still uses only
 * library exercises with a GIF and instructions.
 */
import type { PoolExercise } from "./pool.server";
import type { FocusGroup } from "./strength-focus";

/**
 * Coach Haris Falas's movement-pattern classification of the priority lists
 * (supplied 2026-10-12). AUTHORITATIVE for these movements: the regex
 * classifier in strength-focus.ts only handles exercises not listed here.
 *
 * Coach's classification notes:
 * - Thrusters (dumbbell/kettlebell) and Medicine Ball Squat to Press are
 *   compound: lower-body push + upper-body push.
 * - Medicine Ball Slam is a full-body power exercise (conditioning), not core.
 * - Hip Thrust is hip-extension dominant → lower-body pull.
 * - Pec Deck, Cable Chest Fly and Cable Lateral Raise are upper-body push
 *   accessories.
 * - Burpee, Jumping Jack, High Knees, Butt Kicks, Skater, Shuttle Run and
 *   Sprint are primarily conditioning; they sit under Core only where trunk
 *   involvement is relevant and must not be treated as core by the engine.
 */
export const PRIORITY_MOVEMENT_PATTERN: Record<string, FocusGroup | FocusGroup[]> = {
  // 1. LOWER BODY PUSH
  "Bodyweight Squat": "lower push", "Reverse Lunge": "lower push", "Forward Lunge": "lower push",
  "Walking Lunge": "lower push", "Split Squat": "lower push", "Bulgarian Split Squat": "lower push",
  "Step-Up": "lower push", "Calf Raise": "lower push", "Jump Squat": "lower push", "Lateral Lunge": "lower push",
  "Goblet Squat": "lower push", "Dumbbell Squat": "lower push", "Dumbbell Reverse Lunge": "lower push",
  "Dumbbell Forward Lunge": "lower push", "Dumbbell Walking Lunge": "lower push",
  "Dumbbell Bulgarian Split Squat": "lower push", "Kettlebell Goblet Squat": "lower push",
  "Kettlebell Reverse Lunge": "lower push", "TRX Squat": "lower push", "TRX Reverse Lunge": "lower push",
  "TRX Split Squat": "lower push", "Medicine Ball Lunge": "lower push",
  "Barbell Back Squat": "lower push", "Smith Machine Squat": "lower push", "Hack Squat": "lower push",
  "Leg Press": "lower push", "Leg Extension": "lower push", "Seated Calf Raise": "lower push",
  "Standing Calf Raise": "lower push",
  // 2. LOWER BODY PULL
  "Glute Bridge": "lower pull", "Hip Thrust": "lower pull", "Single-Leg Glute Bridge": "lower pull",
  "Dumbbell Romanian Deadlift": "lower pull", "Dumbbell Deadlift": "lower pull", "Dumbbell Hip Thrust": "lower pull",
  "Kettlebell Deadlift": "lower pull", "Kettlebell Swing": "lower pull", "Single-Arm Kettlebell Swing": "lower pull",
  "Leg Curl": "lower pull", "Romanian Deadlift": "lower pull", "Barbell Deadlift": "lower pull",
  // 3. UPPER BODY PUSH
  "Push-Up": "upper push", "Wide-Grip Push-Up": "upper push", "Incline Push-Up": "upper push",
  "Diamond Push-Up": "upper push", "Decline Push-Up": "upper push", "Shoulder Tap": "upper push",
  "Dumbbell Bench Press": "upper push", "Dumbbell Shoulder Press": "upper push", "Dumbbell Push Press": "upper push",
  "Kettlebell Press": "upper push", "Kettlebell Push Press": "upper push", "TRX Push-Up": "upper push",
  "Medicine Ball Chest Pass": "upper push",
  "Barbell Bench Press": "upper push", "Incline Bench Press": "upper push", "Machine Chest Press": "upper push",
  "Pec Deck": "upper push", "Machine Shoulder Press": "upper push", "Dumbbell Incline Bench Press": "upper push",
  "Barbell Overhead Press": "upper push", "Cable Triceps Pushdown": "upper push",
  "Overhead Cable Triceps Extension": "upper push", "Triceps Dip": "upper push",
  "Cable Lateral Raise": "upper push", "Cable Chest Fly": "upper push",
  // 4. UPPER BODY PULL
  "Pull-Up": "upper pull", "Chin-Up": "upper pull", "Neutral-Grip Pull-Up": "upper pull", "Inverted Row": "upper pull",
  "Dumbbell Row": "upper pull", "Single-Arm Dumbbell Row": "upper pull", "Kettlebell Row": "upper pull",
  "TRX Row": "upper pull",
  "Lat Pulldown": "upper pull", "Seated Cable Row": "upper pull", "Chest-Supported Row Machine": "upper pull",
  "Barbell Row": "upper pull", "Assisted Pull-Up": "upper pull",
  "Cable Biceps Curl": "upper pull", "Dumbbell Biceps Curl": "upper pull", "Hammer Curl": "upper pull",
  // 5. CORE
  "Sit-Up": "core", "Crunch": "core", "Leg Raise": "core", "Dead Bug": "core", "Plank": "core",
  "Side Plank": "core", "Inchworm": "core", "Bird Dog": "core",
  "Medicine Ball Sit-Up": "core",
  "Cable Crunch": "core", "Hanging Knee Raise": "core", "Hanging Leg Raise": "core", "Cable Pallof Press": "core",
  // COMPOUND — lower-body push + upper-body push
  "Dumbbell Thruster": ["lower push", "upper push"], "Single-Arm Dumbbell Thruster": ["lower push", "upper push"],
  "Kettlebell Thruster": ["lower push", "upper push"], "Medicine Ball Squat to Press": ["lower push", "upper push"],
  // CONDITIONING — listed under Core by the coach only where trunk involvement
  // is relevant; never treated as core by the engine.
  "Mountain Climber": "conditioning", "TRX Mountain Climber": "conditioning", "Burpee": "conditioning",
  "Jumping Jack": "conditioning", "High Knees": "conditioning", "Butt Kicks": "conditioning",
  "Skater": "conditioning", "Bear Crawl": "conditioning", "Shuttle Run": "conditioning", "Sprint": "conditioning",
  "Medicine Ball Slam": "conditioning",
};

// TIER 1 — the simplest effective, most familiar movement first. Technically
// advanced or skill movements (Turkish get-up, pistol, muscle-up, planche,
// levers, handstands, Olympic lifts, snatches, cleans) are NOT priority.
// Haris Falas (2026-11-08): Main Workout and Finisher of every general
// category use ONLY these movements (100%, every occurrence). Running and
// sprinting (Shuttle Run, Sprint) belong to a dedicated Running programme only;
// Inchworm is preparation/mobility, never work. Movements with no matching
// library exercise (Single-Arm Dumbbell Thruster, TRX Squat, Medicine Ball
// Lunge, Medicine Ball Sit-Up, Dumbbell Thruster) stay off the active lists
// until the real exercise is added to the library.
export const PRIORITY_BODYWEIGHT = [
  "Bodyweight Squat", "Reverse Lunge", "Forward Lunge", "Walking Lunge", "Split Squat",
  "Bulgarian Split Squat", "Step-Up", "Push-Up", "Wide-Grip Push-Up", "Incline Push-Up",
  "Diamond Push-Up", "Pull-Up", "Chin-Up", "Inverted Row", "Glute Bridge", "Hip Thrust",
  "Calf Raise", "Sit-Up", "Crunch", "Leg Raise", "Dead Bug", "Plank", "Side Plank",
  "Mountain Climber", "Burpee", "Jumping Jack", "High Knees", "Butt Kicks", "Skater",
  "Bear Crawl", "Jump Squat", "Decline Push-Up",
  "Shoulder Tap", "Single-Leg Glute Bridge", "Bird Dog", "Lateral Lunge", "Neutral-Grip Pull-Up",
];

export const PRIORITY_EQUIPMENT = [
  "Goblet Squat", "Dumbbell Squat", "Dumbbell Reverse Lunge", "Dumbbell Forward Lunge",
  "Dumbbell Walking Lunge", "Dumbbell Romanian Deadlift", "Dumbbell Row", "Single-Arm Dumbbell Row",
  "Dumbbell Bench Press", "Dumbbell Shoulder Press", "Dumbbell Push Press",
  "Dumbbell Bulgarian Split Squat", "Dumbbell Deadlift", "Dumbbell Hip Thrust",
  "Kettlebell Goblet Squat", "Kettlebell Swing", "Single-Arm Kettlebell Swing", "Kettlebell Deadlift",
  "Kettlebell Row", "Kettlebell Press", "Kettlebell Push Press", "Kettlebell Thruster", "Kettlebell Reverse Lunge",
  "TRX Row", "TRX Push-Up", "TRX Reverse Lunge", "TRX Split Squat", "TRX Mountain Climber",
  "Medicine Ball Slam", "Medicine Ball Squat to Press", "Medicine Ball Chest Pass",
];

export const PRIORITY_FULL_GYM = [
  "Barbell Bench Press", "Incline Bench Press", "Barbell Back Squat", "Smith Machine Squat", "Hack Squat",
  "Leg Press", "Leg Extension", "Leg Curl", "Hip Thrust", "Lat Pulldown", "Seated Cable Row",
  "Chest-Supported Row Machine", "Machine Chest Press", "Pec Deck", "Machine Shoulder Press",
  "Barbell Row", "Dumbbell Row", "Romanian Deadlift", "Barbell Deadlift", "Dumbbell Bench Press",
  "Dumbbell Incline Bench Press", "Barbell Overhead Press", "Assisted Pull-Up", "Pull-Up", "Chin-Up",
  "Single-Arm Dumbbell Row", "Seated Calf Raise", "Standing Calf Raise",
  // Common gym accessories — familiar, after the compound staples.
  "Cable Biceps Curl", "Dumbbell Biceps Curl", "Hammer Curl", "Cable Triceps Pushdown",
  "Overhead Cable Triceps Extension", "Triceps Dip", "Cable Lateral Raise", "Cable Chest Fly",
  "Cable Crunch", "Hanging Knee Raise", "Hanging Leg Raise", "Cable Pallof Press",
  "Kettlebell Swing",
];

/** Priority movements removed from the active lists because the library has no such exercise yet. */
export const PRIORITY_NOT_IN_LIBRARY = ["Single-Arm Dumbbell Thruster", "TRX Squat", "Medicine Ball Lunge", "Medicine Ball Sit-Up", "Dumbbell Thruster"];
/** Running and sprinting: dedicated Running programmes only, never a priority movement. */
export const PRIORITY_RUNNING_REMOVED = ["Shuttle Run", "Sprint"];

export const ALL_PRIORITY_NAMES = Array.from(
  new Set([...PRIORITY_BODYWEIGHT, ...PRIORITY_EQUIPMENT, ...PRIORITY_FULL_GYM]),
);

/** Word-level synonyms: library spelling ↔ coach spelling. */
const SYN: Record<string, string> = {
  pushup: "push", pullup: "pull", chinup: "chin", situp: "sit", stepup: "step",
  vup: "v", biceps: "biceps", bicep: "biceps", triceps: "triceps", tricep: "triceps",
  single: "one", arm: "arm", leg: "leg", "single-arm": "one", db: "dumbbell",
  kb: "kettlebell", medicine: "medicine", med: "medicine", smith: "smith",
  suspension: "trx", air: "bodyweight", forward: "", back: "", "&": "and",
  thrusters: "thruster", swings: "swing", jacks: "jack", knees: "knee", kicks: "kick",
  jumping: "jumping", body: "", weight: "bodyweight", machine: "lever", lever: "lever",
  rack: "", overhead: "overhead", straight: "straight", neutral: "neutral",
};

const STOP = new Set(["up", "ups", "to", "the", "with", "a", "hold", "and", "bodyweight", ""]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/push[\s-]?ups?/g, "pushup")
    .replace(/pull[\s-]?ups?/g, "pullup")
    .replace(/chin[\s-]?ups?/g, "chinup")
    .replace(/sit[\s-]?ups?/g, "situp")
    .replace(/step[\s-]?ups?/g, "stepup")
    .replace(/body[\s-]?weight/g, "bodyweight")
    .replace(/single[\s-]arm/g, "one arm")
    .replace(/single[\s-]leg/g, "one leg")
    .replace(/[^a-z&\s]/g, " ")
    .split(/\s+/)
    .map((w) => (w in SYN ? SYN[w] : w))
    .map((w) => (w === "push" ? "pushup" : w === "pull" ? "pullup" : w === "chin" ? "chinup" : w === "sit" ? "situp" : w === "step" ? "stepup" : w))
    .filter((w) => !STOP.has(w));
}

/**
 * Hand-checked library equivalents where the library spells the movement
 * differently from the coach's list — genuine movement equivalence only, exact
 * library names (case-insensitive). The library's own exact spelling of a
 * priority name also counts. Nothing else is a priority exercise: there is no
 * approximate text matching. Names that do not exist are ignored.
 * Removed (Haris Falas, 2026-11-08): Jack Burpee → Burpee, Star Jump → Jumping
 * Jack, Kettlebell Sumo High Pull → Kettlebell Deadlift, Run → Shuttle Run/Sprint.
 */
export const PRIORITY_ALIASES: Record<string, string[]> = {
  "Bodyweight Squat": ["squat", "quads (bodyweight squat)"],
  "Forward Lunge": ["forward lunge"],
  "Split Squat": ["split squats"],
  "Step-Up": ["dumbbell step-up", "barbell step-up"],
  "Glute Bridge": ["low glute bridge on floor"],
  "Single-Leg Glute Bridge": ["single leg bridge with outstretched leg"],
  "Hip Thrust": ["barbell glute bridge"],
  "Calf Raise": ["bodyweight standing calf raise"],
  "Sit-Up": ["sit-up with arms on chest", "sit-up v. 2"],
  "Crunch": ["crunch floor"],
  "Leg Raise": ["lying leg raise flat bench"],
  "Side Plank": ["side bridge v. 2"],
  "Jumping Jack": ["jack jump (male)"],
  "Skater": ["skater hops"],
  "Lateral Lunge": ["barbell lateral lunge"],
  "Neutral-Grip Pull-Up": ["pull up (neutral grip)"],
  "Goblet Squat": ["dumbbell goblet squat", "kettlebell goblet squat"],
  "Dumbbell Reverse Lunge": ["dumbbell rear lunge"],
  "Dumbbell Forward Lunge": ["dumbbell lunge"],
  "Dumbbell Row": ["dumbbell bent over row"],
  "Single-Arm Dumbbell Row": ["dumbbell one arm bent-over row"],
  "Dumbbell Shoulder Press": ["dumbbell seated shoulder press", "dumbbell standing overhead press", "dumbbell one arm shoulder press"],
  "Dumbbell Bulgarian Split Squat": ["dumbbell single leg split squat"],
  "Kettlebell Row": ["kettlebell one arm row", "kettlebell alternating row"],
  "Kettlebell Press": ["kettlebell alternating press"],
  "Kettlebell Push Press": ["kettlebell double push press"],
  "TRX Row": ["suspended row"],
  "TRX Push-Up": ["suspended push-up"],
  "TRX Split Squat": ["suspended split squat"],
  "Medicine Ball Slam": ["medicine ball overhead slam"],
  "Incline Bench Press": ["barbell incline bench press"],
  "Barbell Back Squat": ["barbell full squat", "barbell high bar squat"],
  "Smith Machine Squat": ["smith squat", "smith full squat"],
  "Hack Squat": ["sled hack squat"],
  "Leg Press": ["sled 45° leg press"],
  "Leg Extension": ["lever leg extension"],
  "Leg Curl": ["lever lying leg curl", "lever seated leg curl"],
  "Lat Pulldown": ["cable pulldown", "cable lat pulldown full range of motion", "lever front pulldown"],
  "Seated Cable Row": ["cable seated row", "cable low seated row"],
  "Chest-Supported Row Machine": ["lever seated row", "lever t bar row"],
  "Machine Chest Press": ["lever chest press"],
  "Pec Deck": ["lever seated fly"],
  "Machine Shoulder Press": ["lever shoulder press", "lever military press"],
  "Barbell Row": ["barbell bent over row"],
  "Romanian Deadlift": ["barbell romanian deadlift"],
  "Barbell Overhead Press": ["barbell seated overhead press"],
  "Seated Calf Raise": ["lever seated calf raise"],
  "Standing Calf Raise": ["lever standing calf raise", "barbell standing calf raise", "dumbbell standing calf raise"],
  "Cable Biceps Curl": ["cable curl"],
  "Hammer Curl": ["dumbbell hammer curl"],
  "Cable Triceps Pushdown": ["cable pushdown", "cable pushdown (with rope attachment)"],
  "Overhead Cable Triceps Extension": ["cable overhead triceps extension (rope attachment)"],
  "Triceps Dip": ["bench dip (knees bent)"],
  "Cable Chest Fly": ["cable standing fly", "cable middle fly"],
  "Cable Crunch": ["cable kneeling crunch"],
  "Cable Pallof Press": ["band horizontal pallof press", "band vertical pallof press"],
};

const PRIORITY_LIBRARY_NAMES: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const p of ALL_PRIORITY_NAMES) {
    m.set(p.toLowerCase(), p);
    for (const a of PRIORITY_ALIASES[p] ?? []) if (!m.has(a.toLowerCase())) m.set(a.toLowerCase(), p);
  }
  return m;
})();

/** The coach priority movement a library exercise stands for (exact name or approved alias), or null. */
export const priorityNameOf = (e: { name: string }): string | null => PRIORITY_LIBRARY_NAMES.get(e.name.trim().toLowerCase()) ?? null;
export const isPriorityExercise = (e: { name: string }) => priorityNameOf(e) !== null;

/**
 * Library matches for one coach name: hand-checked aliases first, then the
 * token matcher (every coach word present, fewest extra words wins).
 */
export function resolvePriority(name: string, library: PoolExercise[], max = 2): PoolExercise[] {
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e] as const));
  const hits = [name, ...(PRIORITY_ALIASES[name] ?? [])]
    .map((n) => byName.get(n.toLowerCase()))
    .filter((e): e is PoolExercise => !!e);
  return [...new Map(hits.map((e) => [e.id, e])).values()].slice(0, max);
}

const cache = new WeakMap<PoolExercise[], Set<string>>();

/** Ids of every library exercise that stands for one of the coach's priority movements. */
export function priorityIds(library: PoolExercise[]): Set<string> {
  const hit = cache.get(library);
  if (hit) return hit;
  // One closest library match per coach name, for this pool's environment.
  const ids = new Set(orderedPriority(library).map((e) => e.id));
  cache.set(library, ids);
  return ids;
}

/**
 * Returns a rejection reason when ANY main-workout or finisher exercise
 * occurrence is not a coach priority exercise; null when 100% compliant.
 */
export function priorityShortfall(html: string, library: PoolExercise[], category: string): string | null {
  if (category === "MOBILITY & STABILITY" || category === "PILATES" || category === "RECOVERY") return null;
  const start = html.search(/Main Workout/i);
  if (start < 0) return null;
  const rest = html.slice(start);
  const end = rest.search(/Cool Down/i);
  const main = end > 0 ? rest.slice(0, end) : rest;
  const ids = [...main.matchAll(/\{\{exercise:([^:}]+):/g)].map((m) => m[1]!);
  if (!ids.length) return null;
  return priorityShareViolation(ids, library);
}

/** THE priority rule (Haris Falas, 2026-11-08): 100% of occurrences, no percentage threshold. */
export const PRIORITY_SHARE = 1;
export function priorityShareViolation(workIds: string[], library: PoolExercise[]): string | null {
  if (!workIds.length) return null;
  const byId = new Map(library.map((e) => [e.id, e]));
  const miss = workIds.filter((id) => { const e = byId.get(id); return !e || !isPriorityExercise(e); }).length;
  return miss ? `${miss} of ${workIds.length} main/finisher exercises are not coach priority exercises (100% required).` : null;
}

type Env = "BODYWEIGHT" | "EQUIPMENT" | "FULL_GYM";

/** Which of the three coach lists applies, read from what the legal pool holds. */
export function poolEnvironment(pool: PoolExercise[]): Env {
  const eq = (e: PoolExercise) => `${e.equipment ?? ""} ${e.name}`.toLowerCase();
  if (pool.some((e) => /\b(lever|cable|smith|sled)\b/.test(eq(e)))) return "FULL_GYM";
  if (pool.some((e) => /\b(dumbbell|kettlebell|barbell|trx|suspen|medicine)\b/.test(eq(e)))) return "EQUIPMENT";
  return "BODYWEIGHT";
}

/**
 * The coach's priority exercises for this environment, in the coach's own
 * order (environment list first, then the simpler lists), one closest library
 * match per name, only rows present in the legal pool.
 */
export function orderedPriority(pool: PoolExercise[]): PoolExercise[] {
  const env = poolEnvironment(pool);
  const names =
    env === "FULL_GYM"
      ? [...PRIORITY_FULL_GYM, ...PRIORITY_EQUIPMENT, ...PRIORITY_BODYWEIGHT]
      : env === "EQUIPMENT"
        ? [...PRIORITY_EQUIPMENT, ...PRIORITY_BODYWEIGHT]
        : PRIORITY_BODYWEIGHT;
  const out: PoolExercise[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    // Up to two library spellings per coach movement (e.g. burpee / jack burpee).
    for (const e of resolvePriority(n, pool, 2)) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}

/** Movement patterns, in the order a coach fills a session. */
const PATTERNS: { key: string; re: RegExp }[] = [
  { key: "squat", re: /squat|leg press|thruster/i },
  { key: "hinge", re: /deadlift|swing|hip thrust|glute bridge|clean|snatch/i },
  { key: "push", re: /bench press|chest press|push-?up|press|dip/i },
  { key: "pull", re: /row|pull-?up|chin-?up|pulldown|pull down/i },
  { key: "lunge", re: /lunge|split squat|step-?up|bulgarian/i },
  { key: "core", re: /plank|crunch|dead bug|bird dog|hollow|leg raise|knee raise|rollout|twist|pallof|sit-?up|v-?up|chop/i },
  { key: "conditioning", re: /burpee|jump|climber|jack|knees|skater|sprint|slam|run|crawl/i },
];

/**
 * Picks `count` coach-priority exercises, one per movement pattern in coach
 * order (squat, hinge, push, pull, lunge, core, conditioning), rotating
 * between the top few per pattern by seed. Returns fewer when the pool
 * cannot supply them.
 */
export function pickPriorityByPattern(
  pool: PoolExercise[],
  count: number,
  opts: { exclude?: Set<string>; seed?: number; conditioningFirst?: boolean } = {},
): PoolExercise[] {
  const exclude = opts.exclude ?? new Set<string>();
  const list = orderedPriority(pool).filter((e) => !exclude.has(e.id));
  const patterns = opts.conditioningFirst
    ? [PATTERNS[6]!, PATTERNS[0]!, PATTERNS[2]!, PATTERNS[1]!, PATTERNS[3]!, PATTERNS[4]!, PATTERNS[5]!]
    : PATTERNS;
  const out: PoolExercise[] = [];
  const used = new Set<string>();
  const seed = Math.abs(opts.seed ?? 0);
  let round = 0;
  while (out.length < count && round < 4) {
    for (const p of patterns) {
      if (out.length >= count) break;
      const cands = list.filter((e) => !used.has(e.id) && p.re.test(e.name) && !/calf/i.test(e.name));
      if (!cands.length) continue;
      const pick = cands[(seed + round) % Math.min(3, cands.length)]!;
      out.push(pick);
      used.add(pick.id);
    }
    round += 1;
  }
  return out;
}
