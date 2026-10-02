// THE authoritative Activation / Cool Down vocabulary and dose.
// Activation = MOVEMENT PREPARATION: mobility, dynamic mobility, stability,
// joint prep, activation drills and light bodyweight movement rehearsal
// (bodyweight squat, reverse/forward lunge, marching, up to 10 push-ups).
// Cool Down = recovery: static stretching, gentle mobility, breathing.
// Neither is ever a training block.

export const ACTIVATION_NAMES = [
  "bird dog", "cat-cow", "clamshell", "fire hydrant", "glute bridge", "glute bridge march",
  "low glute bridge on floor", "single leg bridge with outstretched leg", "dead bug", "pelvic tilt",
  "standing pelvic tilt", "scapula push-up", "incline scapula push up", "plank", "bodyweight incline side plank",
  "kneeling plank tap shoulder", "inchworm", "world greatest stretch", "squat to overhead reach",
  "squat to overhead reach with twist", "posterior step to overhead reach", "wrist circles", "ankle circles",
  "dynamic chest stretch (male)", "circles knee stretch", "spine twist",
  "push-up", "incline push-up", "reverse lunge", "forward lunge", "walking lunge", "squat", "quads (bodyweight squat)", "kneeling push-up", "push-up (wall)",
];

export const COOLDOWN_NAMES = [
  "cat-cow", "pigeon pose", "sphinx pose", "kneeling lat stretch", "seated lower back stretch", "upper back stretch",
  "chest and front of shoulder stretch", "rear deltoid stretch", "triceps stretch", "overhead triceps stretch",
  "hamstring stretch", "runners stretch", "seated glute stretch", "piriformis stretch", "frog stretch",
  "butterfly yoga pose", "all fours squad stretch", "lying (side) quads stretch", "hug knees to chest",
  "bent knee lying twist", "calf stretch with hands against wall", "standing calves calf stretch",
  "neck side stretch", "standing lateral stretch", "spine twist", "spine stretch", "back pec stretch",
  "side lying floor stretch",
];

const ACT = new Set(ACTIVATION_NAMES);
const CD = new Set(COOLDOWN_NAMES);
const CD_LIKE = /stretch|\bpose\b|spine twist|lying twist|pelvic tilt|knees? to chest|cat-cow|child|forward fold|spinal twist|sphinx|upward facing dog|cars\b|circles?\b|ankle rocks|thread the needle|90\/90/;
const ACT_LIKE = /bird dog|dead bug|glute bridge|clamshell|fire hydrant|plank|circles?\b|rotation|inchworm|overhead reach|scapula|cars\b|hundred|pelvic curl|roll-up|corkscrew|hip twist/;
/** Never preparation in either section: load, conditioning, impact, training work. */
const BANNED = /lunge|squat|row\b|press|raise|curl|crawl|walk|donkey kick|butt kick|jump|burpee|climber|crunch|dip|calf raise|(?<!scapula )push[- ]?up|extension|abduct|adduct|machine|barbell|dumbbell|cable|kettlebell|sprint|box|skater|sit-?up|weighted|band\b|trx|suspen|medicine|smith|lever/;
/**
 * Light bodyweight movement rehearsal — legal in Activation ONLY (never Cool Down):
 * plain bodyweight squat, reverse / forward / walking lunge, marching and plain or
 * incline push-ups. Loaded, jumping, split or skill variants stay illegal.
 */
const REHEARSAL = /\b(squat|lunge|march(ing)?|push-?up)\b/;
const REHEARSAL_BAN =
  /jump|jumping|plyo|split|bulgarian|pistol|sissy|shrimp|cossack|archer|diamond|decline|clap|pike|one arm|single arm|spider|weighted|dumbbell|barbell|kettlebell|band|smith|cable|lever|trx|suspen|medicine|ball|box|bench|step|overhead squat|front squat|back squat|hack|goblet|deficit|curtsy|curtsey|lateral|side|clock|kick|handstand|superman|planche|hindu|one leg|single leg|\bsit\b|hold|high knee|tap|plus|reverse grip|close-grip|pilates|lower arms|elbow|potty|wide|twist|drop/;
export const isActivationRehearsal = (name: string) => {
  const n = norm(name);
  return REHEARSAL.test(n) && !REHEARSAL_BAN.test(n);
};
const norm = (n: string) => n.trim().toLowerCase();

export type PrepSection = "activation" | "cooldown";

export function prepAllowed(name: string, section: PrepSection): boolean {
  const n = norm(name);
  // Activation may also use cool-down mobility/stretches; cool down stays static/mobility.
  if (section === "cooldown" ? CD.has(n) : ACT.has(n) || CD.has(n)) return true;
  if (section === "activation" && isActivationRehearsal(n)) return true;
  if (BANNED.test(n)) return false;
  return section === "cooldown" ? CD_LIKE.test(n) : ACT_LIKE.test(n) || CD_LIKE.test(n);
}

/** Activation dose ceiling: 10 reps, 30 sec, one pass — never working sets. */
export const ACTIVATION_MAX_REPS = 10;
export const ACTIVATION_MAX_SECONDS = 30;

/** Rule break for one Activation line's prescription, or null. */
export function activationDoseViolation(name: string, line: string): string | null {
  const dose = line.replace(/\brest\b[^.;,]*/gi, "");
  if (/\b\d+\s*(sets?|rounds?)\b|\b\d+\s*[x×]\s*\d+/i.test(dose))
    return `"${name}" in Activation is prescribed as working sets — Activation is one controlled pass of preparation.`;
  for (const m of dose.matchAll(/\b(\d+)\s*(?:-\s*(\d+)\s*)?reps?\b/gi))
    if (Number(m[2] ?? m[1]) > ACTIVATION_MAX_REPS)
      return `"${name}" in Activation exceeds ${ACTIVATION_MAX_REPS} reps — preparation, not volume.`;
  for (const m of dose.matchAll(/\b(\d+)\s*(?:-\s*(\d+)\s*)?(sec|seconds|s|min|minutes?)\b/gi)) {
    const v = Number(m[2] ?? m[1]) * (/^m/i.test(m[3]!) ? 60 : 1);
    if (v > ACTIVATION_MAX_SECONDS) return `"${name}" in Activation exceeds ${ACTIVATION_MAX_SECONDS} sec — keep preparation short.`;
  }
  return null;
}

/**
 * Brings every Activation line inside the dose ceiling (one pass, ≤10 reps or
 * ≤30 sec). Used by the generator's enforcer and by the stored-workout repair,
 * so both apply the identical rule. `timed` decides holds/stretches → seconds.
 */
export function clampActivationDoses(html: string, timed: (name: string) => boolean): string {
  const act = html.search(/Activation/i);
  if (act < 0) return html;
  const rest = html.slice(act);
  const endRel = rest.search(/Main Workout|💪/i);
  const end = endRel > 0 ? act + endRel : html.length;
  const seg = html.slice(act, end).replace(
    /(<p[^>]*>)([^<{]*?)(\{\{exercise:[A-Za-z0-9_-]+:([^}]*)\}\})([^<]*)/g,
    (all, open: string, pre: string, tok: string, name: string, post: string) => {
      if (!activationDoseViolation(name, `${pre} ${post}`)) return all;
      const note = activationDoseViolation(name, post) ? "" : post;
      return `${open}${timed(name) ? "30 sec" : "8 reps"} ${tok}${note || " — slow and controlled"}`;
    },
  );
  return html.slice(0, act) + seg + html.slice(end);
}

const TOKEN = /\{\{exercise:([A-Za-z0-9_-]+):([^}]*)\}\}/g;

/** Token spans in the Activation and Cool Down sections. */
export function prepTokens(html: string): Array<{ section: PrepSection; id: string; name: string; index: number; raw: string }> {
  const out: Array<{ section: PrepSection; id: string; name: string; index: number; raw: string }> = [];
  const act = html.search(/Activation/i);
  const main = html.search(/Main Workout/i);
  const cd = html.search(/🧘|Cool[\s-]?Down/i);
  const ranges: Array<[PrepSection, number, number]> = [];
  if (act >= 0) ranges.push(["activation", act, main > act ? main : html.length]);
  if (cd >= 0) ranges.push(["cooldown", cd, html.length]);
  for (const [section, a, b] of ranges) {
    TOKEN.lastIndex = a;
    let m: RegExpExecArray | null;
    while ((m = TOKEN.exec(html)) && m.index < b) out.push({ section, id: m[1]!, name: m[2]!, index: m.index, raw: m[0] });
  }
  return out;
}
