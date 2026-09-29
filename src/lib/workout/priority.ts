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

export const PRIORITY_BODYWEIGHT = [
  "Push-Up", "Incline Push-Up", "Decline Push-Up", "Diamond Push-Up", "Pike Push-Up",
  "Hand-Release Push-Up", "Shoulder Tap", "Plank to Push-Up", "Pull-Up", "Chin-Up",
  "Neutral-Grip Pull-Up", "Inverted Row", "Bodyweight Squat", "Jump Squat", "Split Squat",
  "Reverse Lunge", "Forward Lunge", "Walking Lunge", "Lateral Lunge", "Bulgarian Split Squat",
  "Step-Up", "Single-Leg Squat", "Glute Bridge", "Single-Leg Glute Bridge", "Hip Thrust",
  "Calf Raise", "Plank", "Side Plank", "Dead Bug", "Bird Dog", "Mountain Climber",
  "Hollow Body Hold", "Sit-Up", "Crunch", "V-Up", "Leg Raise", "Russian Twist", "Burpee",
  "Broad Jump", "Tuck Jump", "Jumping Jack", "High Knees", "Butt Kicks", "Skater",
  "Bear Crawl", "Crab Walk", "Inchworm", "Shuttle Run", "Sprint", "Plank Jack",
];

export const PRIORITY_EQUIPMENT = [
  "Dumbbell Bench Press", "Dumbbell Shoulder Press", "Dumbbell Row", "Single-Arm Dumbbell Row",
  "Goblet Squat", "Dumbbell Reverse Lunge", "Dumbbell Walking Lunge",
  "Dumbbell Bulgarian Split Squat", "Dumbbell Romanian Deadlift",
  "Single-Leg Dumbbell Romanian Deadlift", "Dumbbell Deadlift", "Dumbbell Hip Thrust",
  "Dumbbell Thruster", "Dumbbell Clean", "Dumbbell Snatch", "Dumbbell Push Press",
  "Dumbbell Devil Press", "Dumbbell Renegade Row",
  "Kettlebell Goblet Squat", "Kettlebell Swing", "Kettlebell Deadlift",
  "Kettlebell Romanian Deadlift", "Kettlebell Clean", "Kettlebell Press",
  "Kettlebell Push Press", "Kettlebell Snatch", "Kettlebell Row", "Kettlebell Reverse Lunge",
  "Kettlebell Front Rack Squat", "Turkish Get-Up", "Kettlebell Clean & Press",
  "Kettlebell Thruster",
  "TRX Row", "TRX Single-Arm Row", "TRX Push-Up", "TRX Squat", "TRX Reverse Lunge",
  "TRX Split Squat", "TRX Mountain Climber", "TRX Knee Tuck",
  "Medicine Ball Slam", "Medicine Ball Chest Pass", "Medicine Ball Rotational Throw",
  "Medicine Ball Overhead Throw", "Medicine Ball Squat to Press", "Medicine Ball Russian Twist",
  "Medicine Ball Lunge", "Medicine Ball Sit-Up",
  "Barbell Deadlift", "Barbell Back Squat",
];

export const PRIORITY_FULL_GYM = [
  "Leg Press", "Leg Extension", "Leg Curl", "Hack Squat", "Smith Machine Squat",
  "Smith Machine Reverse Lunge", "Hip Thrust Machine", "Glute Kickback Machine",
  "Seated Calf Raise", "Standing Calf Raise",
  "Machine Chest Press", "Incline Chest Press Machine", "Pec Deck", "Cable Chest Fly",
  "Machine Shoulder Press", "Cable Lateral Raise", "Dumbbell Bench Press",
  "Dumbbell Incline Bench Press", "Barbell Bench Press", "Barbell Overhead Press",
  "Lat Pulldown", "Seated Cable Row", "Chest-Supported Row Machine", "Assisted Pull-Up",
  "Pull-Up", "Chin-Up", "Cable Straight-Arm Pulldown", "Machine High Row", "Barbell Row",
  "Single-Arm Dumbbell Row",
  "Cable Biceps Curl", "Dumbbell Biceps Curl", "Hammer Curl", "Preacher Curl Machine",
  "Cable Triceps Pushdown", "Overhead Cable Triceps Extension", "Assisted Dip", "Triceps Dip",
  "Cable Crunch", "Machine Ab Crunch", "Hanging Knee Raise", "Hanging Leg Raise",
  "Cable Wood Chop", "Cable Pallof Press", "Ab Wheel Rollout",
  "Barbell Deadlift", "Romanian Deadlift", "Kettlebell Swing", "Dumbbell Thruster",
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
  "Pike Push-Up": ["pike-to-cobra push-up"],
  "Plank to Push-Up": ["push-up to side plank"],
  "Bodyweight Squat": ["squat to overhead reach", "bodyweight drop jump squat"],
  "Split Squat": ["split squats"],
  "Reverse Lunge": ["dumbbell rear lunge", "barbell rear lunge"],
  "Forward Lunge": ["forward lunge (male)", "walking lunge"],
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
  "Tuck Jump": ["star jump (male)", "forward jump"],
  "Broad Jump": ["forward jump"],
  "Jumping Jack": ["jack jump (male)", "star jump (male)"],
  "High Knees": ["high knee against wall"],
  "Shuttle Run": ["run"],
  "Sprint": ["run"],
  "Plank Jack": ["jack burpee"],
  "Dumbbell Shoulder Press": ["dumbbell one arm shoulder press", "dumbbell arnold press"],
  "Dumbbell Row": ["dumbbell bent over row"],
  "Single-Arm Dumbbell Row": ["dumbbell one arm bent-over row"],
  "Dumbbell Reverse Lunge": ["dumbbell rear lunge"],
  "Dumbbell Walking Lunge": ["dumbbell lunge"],
  "Dumbbell Bulgarian Split Squat": ["dumbbell single leg split squat"],
  "Dumbbell Hip Thrust": ["barbell glute bridge"],
  "Dumbbell Thruster": ["kettlebell thruster", "barbell thruster"],
  "Dumbbell Renegade Row": ["kettlebell alternating renegade row"],
  "Dumbbell Devil Press": ["burpee", "dumbbell push press"],
  "Kettlebell Deadlift": ["kettlebell sumo high pull"],
  "Kettlebell Reverse Lunge": ["kettlebell lunge pass through"],
  "Kettlebell Clean & Press": ["kettlebell one arm clean and jerk"],
  "TRX Row": ["suspended row", "inverted row with straps"],
  "TRX Single-Arm Row": ["suspended row"],
  "TRX Push-Up": ["suspended push-up"],
  "TRX Split Squat": ["suspended split squat"],
  "TRX Reverse Lunge": ["suspended split squat"],
  "TRX Knee Tuck": ["suspended reverse crunch"],
  "TRX Mountain Climber": ["suspended abdominal fallout"],
  "Medicine Ball Slam": ["medicine ball overhead slam"],
  "Medicine Ball Rotational Throw": ["medicine ball supine chest throw"],
  "Medicine Ball Squat to Press": ["medicine ball chest push from 3 point stance"],
  "Barbell Back Squat": ["barbell full squat", "barbell high bar squat"],
  "Smith Machine Squat": ["smith squat", "smith full squat"],
  "Smith Machine Reverse Lunge": ["smith single leg split squat"],
  "Hip Thrust Machine": ["barbell glute bridge"],
  "Glute Kickback Machine": ["cable kickback", "cable standing hip extension"],
  "Pec Deck": ["cable middle fly", "dumbbell fly"],
  "Cable Chest Fly": ["cable standing fly", "cable middle fly"],
  "Lat Pulldown": ["cable lat pulldown full range of motion", "cable pulldown"],
  "Chest-Supported Row Machine": ["lever seated row", "lever t bar row"],
  "Barbell Row": ["barbell bent over row", "barbell pendlay row"],
  "Barbell Overhead Press": ["barbell seated overhead press"],
  "Cable Crunch": ["cable kneeling crunch"],
  "Machine Ab Crunch": ["lever seated crunch"],
  "Cable Wood Chop": ["band horizontal pallof press"],
  "Cable Pallof Press": ["band horizontal pallof press", "band vertical pallof press"],
  "Ab Wheel Rollout": ["wheel rollout", "standing wheel rollerout"],
  "Triceps Dip": ["triceps dip", "bench dip (knees bent)"],
};

/**
 * Library matches for one coach name: hand-checked aliases first, then the
 * token matcher (every coach word present, fewest extra words wins).
 */
export function resolvePriority(name: string, library: PoolExercise[], max = 2): PoolExercise[] {
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e] as const));
  const aliased = (PRIORITY_ALIASES[name] ?? [])
    .map((n) => byName.get(n.toLowerCase()))
    .filter((e): e is PoolExercise => !!e);
  if (aliased.length) return aliased.slice(0, max);
  const want = tokens(name);
  if (!want.length) return [];
  const scored: { e: PoolExercise; extra: number }[] = [];
  for (const e of library) {
    const have = tokens(e.name);
    if (!want.every((w) => have.includes(w))) continue;
    if (/\(.*pov\)|\bv\.\s*\d/i.test(e.name)) continue; // camera-angle duplicates
    scored.push({ e, extra: have.length - want.length });
  }
  scored.sort((a, b) => a.extra - b.extra || a.e.name.length - b.e.name.length);
  return scored.filter((s) => s.extra <= 2).slice(0, max).map((s) => s.e);
}

const cache = new WeakMap<PoolExercise[], Set<string>>();

/** Ids of every library exercise that stands for one of the coach's priority movements. */
export function priorityIds(library: PoolExercise[]): Set<string> {
  const hit = cache.get(library);
  if (hit) return hit;
  const ids = new Set<string>();
  for (const n of ALL_PRIORITY_NAMES) for (const e of resolvePriority(n, library)) ids.add(e.id);
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
  const prio = priorityIds(library);
  if (prio.size < 6) return null; // environment has too few priority matches to demand it
  const hits = ids.filter((id) => prio.has(id)).length;
  return hits / ids.length >= 0.7
    ? null
    : `Only ${hits} of ${ids.length} main exercises are coach priority exercises (need at least 70%).`;
}
