// THE SmartyGym Mobility & Stability and Recovery Main Workout selection
// (approved by Haris Falas, 2026-10-04). These categories draw ONLY from these
// closed lists of animated library exercises; every other rule still applies.
// Read by rules.ts, so pool, validator, admin publish gate and audit agree.
import type { Category } from "./spec";

export const MOBILITY_STABILITY_EXERCISES: ReadonlyArray<string> = [
  "Cat-cow", "Bird Dog", "dead bug", "Clamshell", "Fire Hydrant",
  "Glute Bridge", "glute bridge march", "single leg bridge with outstretched leg", "low glute bridge on floor", "pelvic tilt into bridge",
  "Plank", "bodyweight incline side plank", "side bridge v. 2", "kneeling plank tap shoulder", "shoulder tap",
  "front plank with twist", "side bridge hip abduction", "side hip abduction", "side lying hip adduction", "straight leg outer hip abductor",
  "scapula push-up", "incline scapula push up", "inchworm", "world greatest stretch", "squat to overhead reach",
  "squat to overhead reach with twist", "posterior step to overhead reach", "ankle circles", "wrist circles", "circles knee stretch",
  "dynamic chest stretch (male)", "Spine Twist", "Spine Twist Pilates", "The Hundred", "swimmer kicks v. 2 (male)",
  "balance board", "band horizontal pallof press", "band vertical pallof press", "band y-raise", "band lying hip internal rotation",
  "band seated hip internal rotation", "band hip lift", "band bent-over hip extension", "monster walk", "resistance band seated hip abduction",
  "exercise ball back extension with rotation", "exercise ball prone leg raise", "exercise ball alternating arm ups", "reverse hyper extension (on stability ball)", "back extension on exercise ball",
  "hyperextension", "pelvic tilt", "standing pelvic tilt",
];

export const RECOVERY_EXERCISES: ReadonlyArray<string> = [
  "Cat-cow", "Pigeon Pose", "Frog Stretch", "Piriformis Stretch", "Sphinx Pose",
  "sphinx", "Spine Stretch Forward", "Spine Twist", "butterfly yoga pose", "hamstring stretch",
  "runners stretch", "seated glute stretch", "all fours squad stretch", "lying (side) quads stretch", "hug knees to chest",
  "bent knee lying twist", "calf stretch with hands against wall", "standing calves calf stretch", "neck side stretch", "side push neck stretch",
  "standing lateral stretch", "spine stretch", "back pec stretch", "side lying floor stretch", "upward facing dog",
  "seated lower back stretch", "upper back stretch", "triceps stretch", "overhead triceps stretch", "rear deltoid stretch",
  "chest and front of shoulder stretch", "kneeling lat stretch", "iron cross stretch", "leg up hamstring stretch", "seated calf stretch (male)",
  "seated wide angle pose sequence", "side wrist pull stretch", "pelvic tilt", "standing pelvic tilt", "ankle circles",
  "wrist circles", "Bird Dog", "dead bug", "Glute Bridge", "Clamshell",
  "world greatest stretch", "roller back stretch", "roller hip stretch", "roller hip lat stretch", "roller side lat stretch",
  "exercise ball lower back stretch (pyramid)", "exercise ball lat stretch", "exercise ball hip flexor stretch", "exercise ball seated hamstring stretch", "chest stretch with exercise ball",
  "calf stretch with rope", "reclining big toe pose with rope", "standing hamstring and calf stretch with strap",
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const MOB = new Set(MOBILITY_STABILITY_EXERCISES.map(norm));
const REC = new Set(RECOVERY_EXERCISES.map(norm));

/** null when the category has no closed list; otherwise whether the exercise is on it. */
export function onMobilityRecoveryList(category: Category, e: { name: string }): boolean | null {
  if (category === "MOBILITY & STABILITY") return MOB.has(norm(e.name));
  if (category === "RECOVERY") return REC.has(norm(e.name));
  return null;
}
