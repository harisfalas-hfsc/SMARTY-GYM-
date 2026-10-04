// THE SmartyGym Pilates exercise selection (set by Haris Falas).
// Pilates Main Workout uses ONLY these 50 library exercises — nothing else.
// Activation and Cool Down keep their own prep vocabulary (prep-vocabulary.ts).
// Read by rules.ts, so the pool filter, validator, admin publish gate and the
// stored-workout audit all apply the same list.

export const PILATES_MAIN_EXERCISES: ReadonlyArray<{ id: string; name: string; group: "true" | "compatible" }> = [
  // TRUE PILATES — 28
  { id: "the-hundred", name: "The Hundred", group: "true" },
  { id: "pilates-roll-up", name: "Roll-up", group: "true" },
  { id: "pilates-roll-over", name: "Roll-over", group: "true" },
  { id: "pilates-rolling-like-a-ball", name: "Rolling Like A Ball", group: "true" },
  { id: "pilates-single-leg-stretch", name: "Single Leg Stretch", group: "true" },
  { id: "pilates-double-leg-stretch", name: "Double Leg Stretch", group: "true" },
  { id: "pilates-single-leg-circle", name: "Single Leg Circle", group: "true" },
  { id: "pilates-scissors", name: "Scissors", group: "true" },
  { id: "pilates-saw", name: "Saw", group: "true" },
  { id: "pilates-spine-stretch-forward", name: "Spine Stretch Forward", group: "true" },
  { id: "pilates-spine-twist", name: "Spine Twist Pilates", group: "true" },
  { id: "pilates-chest-lift", name: "Chest Lift", group: "true" },
  { id: "pilates-chest-lift-rotation", name: "Chest Lift With Rotation", group: "true" },
  { id: "pilates-pelvic-curl", name: "Pelvic Curl", group: "true" },
  { id: "pilates-single-leg-kick", name: "Single Leg Kick", group: "true" },
  { id: "pilates-double-leg-kick", name: "Double Leg Kick", group: "true" },
  { id: "pilates-swimming", name: "Swimming", group: "true" },
  { id: "pilates-side-kick-front-back", name: "Side Kick Front and Back", group: "true" },
  { id: "pilates-side-kick-circles", name: "Side Kick Circles", group: "true" },
  { id: "pilates-leg-pull-back", name: "Leg Pull Back", group: "true" },
  { id: "pilates-push-up", name: "Pilates Push-Up", group: "true" },
  { id: "pilates-swan-dive", name: "Swan Dive", group: "true" },
  { id: "pilates-corkscrew", name: "Corkscrew", group: "true" },
  { id: "pilates-hip-twist", name: "Hip Twist", group: "true" },
  { id: "pilates-jackknife", name: "Jackknife", group: "true" },
  { id: "pilates-neck-pull", name: "Neck Pull", group: "true" },
  { id: "pilates-control-balance", name: "Control Balance", group: "true" },
  { id: "pilates-boomerang", name: "Boomerang", group: "true" },
  // PILATES-COMPATIBLE — 22
  { id: "glute-bridge", name: "Glute Bridge", group: "compatible" },
  { id: "1422", name: "Pelvic Tilt Into Bridge", group: "compatible" },
  { id: "3645", name: "Single Leg Bridge With Outstretched Leg", group: "compatible" },
  { id: "clamshell", name: "Clamshell", group: "compatible" },
  { id: "0276", name: "Dead Bug", group: "compatible" },
  { id: "bird-dog", name: "Bird Dog", group: "compatible" },
  { id: "forearm-plank", name: "Plank", group: "compatible" },
  { id: "3544", name: "Bodyweight Incline Side Plank", group: "compatible" },
  { id: "0705", name: "Side Bridge V. 2", group: "compatible" },
  { id: "1774", name: "Side Bridge Hip Abduction", group: "compatible" },
  { id: "3663", name: "Reverse Plank With Leg Lift", group: "compatible" },
  { id: "0689", name: "Seated Leg Raise", group: "compatible" },
  { id: "1363", name: "Spine Stretch", group: "compatible" },
  { id: "recovery-supine-spinal-twist", name: "Supine Spinal Twist", group: "compatible" },
  { id: "recovery-thoracic-rotation-quadruped", name: "Thoracic Spine Rotation", group: "compatible" },
  { id: "recovery-9090-hip-rotation", name: "90/90 Hip Rotation", group: "compatible" },
  { id: "recovery-hip-cars", name: "Hip CARs", group: "compatible" },
  { id: "1362", name: "Sphinx", group: "compatible" },
  { id: "recovery-childs-pose", name: "Child's Pose", group: "compatible" },
  { id: "recovery-seated-forward-fold", name: "Seated Forward Fold", group: "compatible" },
  { id: "pigeon-stretch", name: "Pigeon Pose", group: "compatible" },
  { id: "1364", name: "Standing Pelvic Tilt", group: "compatible" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const IDS = new Set(PILATES_MAIN_EXERCISES.map((e) => e.id));
const NAMES = new Set(PILATES_MAIN_EXERCISES.map((e) => norm(e.name)));

/** True only for the 50 exercises on the SmartyGym Pilates list. */
export function isPilatesMainExercise(e: { id?: string | null; name: string }): boolean {
  if (e.id && IDS.has(e.id)) return true;
  return NAMES.has(norm(e.name));
}

export const PILATES_MAIN_NAMES = PILATES_MAIN_EXERCISES.map((e) => e.name);
