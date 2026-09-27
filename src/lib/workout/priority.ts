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
 * Best library match for one coach name: every coach token must be present in
 * the library name; among those, the fewest extra words wins (the plainest
 * variation). Returns up to `max` matches.
 */
export function resolvePriority(name: string, library: PoolExercise[], max = 2): PoolExercise[] {
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
