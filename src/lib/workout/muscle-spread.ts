// Muscle-group rules for Strength and Muscle Building (Coach Haris, 14 Oct 2026).
// 1. A specific muscle request (e.g. Legs → Quads) is the FIRST priority: only
//    exercises whose library target muscle is that muscle are legal.
// 2. Without one, a broad focus spreads over all its muscles: each available
//    muscle gets one exercise before any muscle gets a second (no three chest
//    moves in an Upper Push day, no squat-only Legs day).
// 3. Single-muscle focuses (Chest, Shoulders) allow many variations.
// Pure; used by the pool filter, pack builder, member final check and audit.

export type MuscleRowLike = { name: string; target_muscle?: string | null; body_part?: string | null };

const PULL_NAME = /rear delt|reverse fly|face pull|upright row|\brows?\b|pull/i;

/** Fine muscle of an exercise from the library's target muscle (name only when the library has none). */
export function fineMuscle(e: MuscleRowLike): string | null {
  const m = (e.target_muscle ?? "").trim().toLowerCase();
  switch (m) {
    case "pectorals": case "serratus anterior": return "chest";
    case "delts": return PULL_NAME.test(e.name) ? "rear delts" : "shoulders";
    case "triceps": return "triceps";
    case "biceps": return "biceps";
    case "forearms": return "forearms";
    case "lats": return "lats";
    case "upper back": return "upper back";
    case "traps": case "levator scapulae": return "traps";
    case "quads": return "quads";
    case "hamstrings": return "hamstrings";
    case "glutes": case "abductors": return "glutes";
    case "adductors": return "adductors";
    case "calves": return "calves";
    case "abs": return "abs";
    case "obliques": return "obliques";
    case "hip flexors": return "abs";
    case "spine": return "lower back";
  }
  if (m) return null;
  const n = e.name.toLowerCase();
  if (/triceps|pushdown|skull/.test(n)) return "triceps";
  if (/\bcurl\b/.test(n) && !/leg curl/.test(n)) return "biceps";
  if (/shoulder press|overhead press|military|arnold|lateral raise|front raise/.test(n)) return "shoulders";
  if (/bench press|chest press|push[- ]?up|\bfly\b|flye/.test(n)) return "chest";
  if (/calf/.test(n)) return "calves";
  return null;
}

/** Muscle buckets a broad focus spreads over, mapping fine muscles into the request's own words. */
const SPREAD: Record<string, Record<string, string>> = {
  "LEGS": { quads: "quads", adductors: "quads", hamstrings: "hamstrings", glutes: "glutes", calves: "calves" },
  "LOWER BODY": { quads: "quads", adductors: "quads", hamstrings: "hamstrings", glutes: "glutes", calves: "calves" },
  "UPPER BODY": { chest: "chest", shoulders: "shoulders", triceps: "triceps", lats: "back", "upper back": "back", traps: "back", "rear delts": "back", biceps: "biceps" },
  "PUSH": { chest: "chest", shoulders: "shoulders", triceps: "triceps" },
  "PULL": { lats: "back", "upper back": "back", traps: "back", "rear delts": "back", biceps: "biceps", forearms: "biceps" },
  "ARMS": { biceps: "biceps", triceps: "triceps", forearms: "forearms" },
  "BACK": { lats: "lats", "upper back": "upper back", traps: "traps", "rear delts": "upper back" },
  "LOW PULL & UPPER PUSH": { hamstrings: "hamstrings", glutes: "glutes", chest: "chest", shoulders: "shoulders", triceps: "triceps" },
  "LOW PUSH & UPPER PULL": { quads: "quads", calves: "calves", lats: "back", "upper back": "back", traps: "back", "rear delts": "back", biceps: "biceps" },
  "FULL BODY": { quads: "legs (front)", adductors: "legs (front)", hamstrings: "legs (back)", glutes: "legs (back)", chest: "chest", shoulders: "shoulders", triceps: "arms", biceps: "arms", lats: "back", "upper back": "back", traps: "back", "rear delts": "back" },
};

/** Specific muscles a member/admin may pick inside each broad focus. */
export const SPECIFIC_MUSCLES: Record<string, { id: string; label: string }[]> = {
  "LEGS": [{ id: "quads", label: "Quads" }, { id: "hamstrings", label: "Hamstrings" }, { id: "glutes", label: "Glutes" }, { id: "calves", label: "Calves" }],
  "LOWER BODY": [{ id: "quads", label: "Quads" }, { id: "hamstrings", label: "Hamstrings" }, { id: "glutes", label: "Glutes" }, { id: "calves", label: "Calves" }],
  "UPPER BODY": [{ id: "chest", label: "Chest" }, { id: "back", label: "Back" }, { id: "shoulders", label: "Shoulders" }, { id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" }],
  "PUSH": [{ id: "chest", label: "Chest" }, { id: "shoulders", label: "Shoulders" }, { id: "triceps", label: "Triceps" }],
  "PULL": [{ id: "back", label: "Back" }, { id: "biceps", label: "Biceps" }],
  "ARMS": [{ id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" }, { id: "forearms", label: "Forearms" }],
  "BACK": [{ id: "lats", label: "Lats" }, { id: "upper back", label: "Upper back" }, { id: "traps", label: "Traps" }],
  "CORE & GLUTES": [{ id: "abs", label: "Abs" }, { id: "obliques", label: "Obliques" }, { id: "glutes", label: "Glutes" }],
};

const norm = (f?: string | null) => (f ?? "").trim().toUpperCase();

/** The bucket an exercise fills inside a focus (null = not part of the spread, e.g. core in Upper Body). */
export function muscleBucket(e: MuscleRowLike, focus?: string | null): string | null {
  const fine = fineMuscle(e);
  if (!fine) return null;
  const map = SPREAD[norm(focus)];
  if (map) return map[fine] ?? null;
  if (norm(focus) === "CORE & GLUTES") return fine === "abs" || fine === "obliques" || fine === "glutes" ? fine : null;
  return fine;
}

/** Is a specific-muscle request valid for this focus? */
export function validMuscle(focus?: string | null, muscle?: string | null): string | null {
  const m = (muscle ?? "").trim().toLowerCase();
  if (!m) return null;
  return SPECIFIC_MUSCLES[norm(focus)]?.some((x) => x.id === m) ? m : null;
}

/** Specific-muscle legality: an exercise belongs only when it trains that muscle. */
export function muscleRequestBreak(e: MuscleRowLike, focus?: string | null, muscle?: string | null): string | null {
  const m = validMuscle(focus, muscle);
  if (!m) return null;
  return muscleBucket(e, focus) === m ? null : `"${e.name}" does not train the requested ${m}`;
}

/**
 * Spread gap of a broad focus: muscles that repeat while another available
 * muscle (one the legal pool can supply) has none. No gap when a specific
 * muscle was requested or the focus is a single muscle.
 */
export function muscleSpreadGap(main: MuscleRowLike[], pool: MuscleRowLike[], focus?: string | null, muscle?: string | null): { over: string[]; missing: string[] } {
  const none = { over: [], missing: [] };
  if (validMuscle(focus, muscle) || !SPREAD[norm(focus)]) return none;
  const got = main.map((e) => muscleBucket(e, focus)).filter((x): x is string => Boolean(x));
  if (got.length < 2) return none;
  const available = [...new Set(pool.map((e) => muscleBucket(e, focus)).filter((x): x is string => Boolean(x)))];
  const count = (b: string) => got.filter((x) => x === b).length;
  const missing = available.filter((b) => count(b) === 0);
  // Only demand a missing muscle while another one repeats (fewer slots than muscles is fine).
  const over = [...new Set(got)].filter((b) => count(b) > 1);
  if (!missing.length || !over.length) return none;
  return { over, missing };
}
