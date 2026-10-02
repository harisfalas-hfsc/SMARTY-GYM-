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

// TIER 1 — the simplest effective, most familiar movement first. Technically
// advanced or skill movements (Turkish get-up, pistol, muscle-up, planche,
// levers, handstands, Olympic lifts, snatches, cleans) are NOT priority; they
// stay legal only where the doctrine permits them.
export const PRIORITY_BODYWEIGHT = [
  "Bodyweight Squat", "Reverse Lunge", "Forward Lunge", "Walking Lunge", "Split Squat",
  "Bulgarian Split Squat", "Step-Up", "Push-Up", "Wide-Grip Push-Up", "Incline Push-Up",
  "Diamond Push-Up", "Pull-Up", "Chin-Up", "Inverted Row", "Glute Bridge", "Hip Thrust",
  "Calf Raise", "Sit-Up", "Crunch", "Leg Raise", "Dead Bug", "Plank", "Side Plank",
  "Mountain Climber", "Burpee", "Jumping Jack", "High Knees", "Butt Kicks", "Skater",
  "Bear Crawl", "Inchworm", "Shuttle Run", "Sprint", "Jump Squat", "Decline Push-Up",
  "Shoulder Tap", "Single-Leg Glute Bridge", "Bird Dog", "Lateral Lunge", "Neutral-Grip Pull-Up",
];

export const PRIORITY_EQUIPMENT = [
  "Goblet Squat", "Dumbbell Squat", "Dumbbell Reverse Lunge", "Dumbbell Forward Lunge",
  "Dumbbell Walking Lunge", "Dumbbell Romanian Deadlift", "Dumbbell Row", "Single-Arm Dumbbell Row",
  "Dumbbell Bench Press", "Dumbbell Shoulder Press", "Dumbbell Push Press", "Dumbbell Thruster",
  "Single-Arm Dumbbell Thruster", "Dumbbell Bulgarian Split Squat", "Dumbbell Deadlift", "Dumbbell Hip Thrust",
  "Kettlebell Goblet Squat", "Kettlebell Swing", "Single-Arm Kettlebell Swing", "Kettlebell Deadlift",
  "Kettlebell Row", "Kettlebell Press", "Kettlebell Push Press", "Kettlebell Thruster", "Kettlebell Reverse Lunge",
  "TRX Row", "TRX Push-Up", "TRX Squat", "TRX Reverse Lunge", "TRX Split Squat", "TRX Mountain Climber",
  "Medicine Ball Slam", "Medicine Ball Squat to Press", "Medicine Ball Lunge", "Medicine Ball Sit-Up",
  "Medicine Ball Chest Pass",
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
  "Kettlebell Swing", "Dumbbell Thruster",
];

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
 * differently from the coach's list. Names that do not exist are ignored.
 */
export const PRIORITY_ALIASES: Record<string, string[]> = {
  "Push-Up": ["push-up"],
  "Hand-Release Push-Up": ["push-up"],
  "Bodyweight Squat": ["squat", "quads (bodyweight squat)", "squat to overhead reach"],
  "Wide-Grip Push-Up": ["wide-grip push-up"],
  "Reverse Lunge": ["reverse lunge", "dumbbell rear lunge"],
  "Jump Squat": ["jump squat"],
  "Dumbbell Squat": ["dumbbell squat", "dumbbell goblet squat"],
  "Dumbbell Forward Lunge": ["dumbbell lunge"],
  "Single-Arm Dumbbell Thruster": ["dumbbell one arm thruster", "dumbbell thruster"],
  "Single-Arm Kettlebell Swing": ["kettlebell one arm swing", "kettlebell swing"],
  "Incline Bench Press": ["barbell incline bench press", "dumbbell incline bench press"],
  "Split Squat": ["split squats"],
  "Forward Lunge": ["forward lunge", "forward lunge (male)", "walking lunge"],
  "Bulgarian Split Squat": ["split squats", "dumbbell single leg split squat"],
  "Step-Up": ["dumbbell step-up", "barbell step-up"],
  "Glute Bridge": ["low glute bridge on floor", "glute bridge march"],
  "Single-Leg Glute Bridge": ["single leg bridge with outstretched leg"],
  "Hip Thrust": ["barbell glute bridge", "glute bridge two legs on bench (male)"],
  "Calf Raise": ["bodyweight standing calf raise"],
  "Plank": ["weighted front plank", "front plank with twist"],
  "Side Plank": ["bodyweight incline side plank", "side bridge v. 2"],
  "Sit-Up": ["sit-up with arms on chest", "arms overhead full sit-up (male)"],
  "Crunch": ["crunch floor"],
  "Leg Raise": ["lying leg raise flat bench"],
  "Jumping Jack": ["jack jump (male)", "star jump (male)"],
  "Burpee": ["burpee", "jack burpee"],
  "High Knees": ["high knee against wall"],
  "Shuttle Run": ["run"],
  "Sprint": ["run"],
  "Dumbbell Shoulder Press": ["dumbbell one arm shoulder press", "dumbbell arnold press"],
  "Dumbbell Row": ["dumbbell bent over row"],
  "Single-Arm Dumbbell Row": ["dumbbell one arm bent-over row"],
  "Dumbbell Reverse Lunge": ["dumbbell rear lunge"],
  "Dumbbell Walking Lunge": ["dumbbell lunge"],
  "Dumbbell Bulgarian Split Squat": ["dumbbell single leg split squat"],
  "Dumbbell Hip Thrust": ["barbell glute bridge"],
  "Dumbbell Thruster": ["kettlebell thruster", "barbell thruster"],
  "Kettlebell Deadlift": ["kettlebell sumo high pull"],
  "Kettlebell Reverse Lunge": ["kettlebell lunge pass through"],
  "TRX Row": ["suspended row", "inverted row with straps"],
  "TRX Push-Up": ["suspended push-up"],
  "TRX Split Squat": ["suspended split squat"],
  "TRX Reverse Lunge": ["suspended split squat"],
  "TRX Mountain Climber": ["suspended abdominal fallout"],
  "Medicine Ball Slam": ["medicine ball overhead slam"],
  "Medicine Ball Squat to Press": ["medicine ball chest push from 3 point stance"],
  "Barbell Back Squat": ["barbell full squat", "barbell high bar squat"],
  "Smith Machine Squat": ["smith squat", "smith full squat"],
  "Hip Thrust Machine": ["barbell glute bridge"],
  "Pec Deck": ["cable middle fly", "dumbbell fly"],
  "Cable Chest Fly": ["cable standing fly", "cable middle fly"],
  "Lat Pulldown": ["cable lat pulldown full range of motion", "cable pulldown"],
  "Chest-Supported Row Machine": ["lever seated row", "lever t bar row"],
  "Barbell Row": ["barbell bent over row", "barbell pendlay row"],
  "Barbell Overhead Press": ["barbell seated overhead press"],
  "Cable Crunch": ["cable kneeling crunch"],
  "Cable Pallof Press": ["band horizontal pallof press", "band vertical pallof press"],
  "Triceps Dip": ["triceps dip", "bench dip (knees bent)"],
};

/**
 * Library matches for one coach name: hand-checked aliases first, then the
 * token matcher (every coach word present, fewest extra words wins).
 */
export function resolvePriority(name: string, library: PoolExercise[], max = 2): PoolExercise[] {
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e] as const));
  // The library's own exact spelling always wins, then hand-checked aliases.
  const exact = byName.get(name.toLowerCase());
  const aliased = [...(exact ? [name] : []), ...(PRIORITY_ALIASES[name] ?? [])]
    .map((n) => byName.get(n.toLowerCase()))
    .filter((e): e is PoolExercise => !!e);
  if (aliased.length) return [...new Map(aliased.map((e) => [e.id, e])).values()].slice(0, max);
  const want = tokens(name);
  if (!want.length) return [];
  const scored: { e: PoolExercise; extra: number }[] = [];
  for (const e of library) {
    const have = tokens(e.name);
    if (!want.every((w) => have.includes(w))) continue;
    if (/\(.*pov\)|\bv\.\s*\d/i.test(e.name)) continue; // camera-angle duplicates
    // A modifier that changes the movement is a different exercise, not the coach's one.
    if (/\b(side|reverse grip|depth|sit|wall|ski|back and forth|push to|drop|hanging|march|with straps|bench|on box|clap|one leg|single leg)\b/i.test(e.name) && !/\b(side|reverse grip|depth|sit|wall|ski|drop|hanging|march|bench|single leg|one leg)\b/i.test(name)) continue;
    scored.push({ e, extra: have.length - want.length });
  }
  scored.sort((a, b) => a.extra - b.extra || a.e.name.length - b.e.name.length);
  return scored.filter((s) => s.extra <= 1).slice(0, max).map((s) => s.e);
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
 * Returns a rejection reason when fewer than 70% of the main-workout and
 * finisher exercises are coach priority exercises; null when compliant.
 */
export function priorityShortfall(html: string, library: PoolExercise[], category: string): string | null {
  if (category === "MOBILITY & STABILITY" || category === "PILATES") return null;
  const start = html.search(/Main Workout/i);
  if (start < 0) return null;
  const rest = html.slice(start);
  const end = rest.search(/Cool Down/i);
  const main = end > 0 ? rest.slice(0, end) : rest;
  const ids = [...main.matchAll(/\{\{exercise:([^:}]+):/g)].map((m) => m[1]!);
  if (!ids.length) return null;
  return priorityShareViolation(ids, library);
}

/** THE 70% priority-share rule, shared by the generator and the stored-workout audit. */
export const PRIORITY_SHARE = 0.7;
export function priorityShareViolation(workIds: string[], library: PoolExercise[]): string | null {
  if (!workIds.length) return null;
  const prio = priorityIds(library);
  if (!prio.size) return null; // the legal pool holds no priority movement — never force one
  // Preference subordinate to hard rules: never demand more distinct priority
  // movements than the legal pool actually holds.
  const unique = [...new Set(workIds)];
  const hits = unique.filter((id) => prio.has(id)).length;
  const need = Math.min(Math.round(unique.length * PRIORITY_SHARE), prio.size);
  return hits >= need
    ? null
    : `Only ${hits} of ${workIds.length} main exercises are coach priority exercises (need at least ${PRIORITY_SHARE * 100}%).`;
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
