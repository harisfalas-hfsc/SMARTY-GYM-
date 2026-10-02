// Movement-pattern classification over the EXISTING exercise library.
// No second library: every attribute is derived from the library row's own
// name / body part / target / equipment, so new library rows classify themselves.
import { equipmentFamilyOf } from "./doctrine";

export type Pattern =
  | "horizontal push" | "vertical push" | "horizontal pull" | "vertical pull"
  | "squat" | "lunge" | "hinge" | "hip extension" | "knee dominant" | "calf" | "carry"
  | "rotation" | "anti-rotation" | "anti-extension" | "core flexion" | "core stability"
  | "locomotion" | "conditioning" | "mobility" | "balance/stability" | "full-body power"
  | "arms" | "other";

/** What the exercise is for — a replacement must keep the same objective. */
export type Objective = "resistance" | "conditioning" | "core" | "mobility";

type Row = { name: string; body_part?: string | null; target_muscle?: string | null; equipment?: string | null; difficulty?: string | null };

// Ordered: the first match is the primary pattern; later matches are secondary.
const RULES: Array<[Pattern, RegExp]> = [
  ["mobility", /stretch|mobility|circles?\b|release|cat[- ]?cow|pose\b|rotation stretch|opener|flow\b|thread the needle|world'?s greatest/i],
  ["full-body power", /clean|snatch|jerk|thruster|slam|wall ball|devil press|man maker|push press/i],
  ["conditioning", /burpee|jump(?!.*rope)|jack|climber|skater|sprint|high knee|butt kick|tuck|hop|plyo|battle rope|jump rope|skip/i],
  ["locomotion", /\brun\b|running|jog|shuffle|crawl|crab walk|bear|march(?! sit)|walk(?:ing)?(?! lunge)|step[- ]?over|row erg|rower|bike|treadmill/i],
  ["carry", /carry|farmer|suitcase|waiter/i],
  ["vertical push", /overhead press|shoulder press|military|arnold|pike push|handstand|seated press|z press|landmine press|upright press/i],
  ["horizontal push", /push[- ]?up|bench press|chest press|floor press|dip\b|fly\b|flye|pec deck|incline press|decline press/i],
  ["vertical pull", /pull[- ]?up|chin[- ]?up|pulldown|pull down|lat pull/i],
  ["horizontal pull", /\brow\b|rows\b|face pull|reverse fly|rear delt|high pull|inverted row/i],
  ["lunge", /lunge|split squat|step[- ]?up|bulgarian|curtsy/i],
  ["squat", /squat|leg press|wall sit|march sit|sissy|hack/i],
  ["hinge", /deadlift|swing|good morning|rdl|romanian|hyperextension|back extension/i],
  ["hip extension", /hip thrust|glute bridge|bridge|kickback|donkey|fire hydrant|clamshell|abduct/i],
  ["knee dominant", /leg extension|leg curl|hamstring curl|nordic/i],
  ["calf", /calf|heel raise/i],
  ["anti-rotation", /pallof|bird dog|side plank|side bridge|suitcase/i],
  ["rotation", /twist|chop|woodchop|rotation|windmill|russian/i],
  ["anti-extension", /plank|rollout|fallout|dead bug|hollow|ab wheel|body-up|saw\b/i],
  ["core flexion", /crunch|sit[- ]?up|v[- ]?up|leg raise|knee raise|toe touch|jackknife|roll[- ]?up|hundred|reverse crunch/i],
  ["balance/stability", /balance|single leg (?:stand|reach)|bosu|stability|scapula|shoulder tap|y raise|t raise|w raise/i],
  ["arms", /curl|triceps|extension|kickback|skull/i],
];

/** Patterns close enough to swap at MEDIUM confidence. */
const RELATED: Record<string, Pattern[]> = {
  "horizontal push": ["vertical push", "arms"],
  "vertical push": ["horizontal push", "arms"],
  "horizontal pull": ["vertical pull", "arms"],
  "vertical pull": ["horizontal pull", "arms"],
  squat: ["lunge", "knee dominant"],
  lunge: ["squat", "knee dominant"],
  "knee dominant": ["squat", "lunge"],
  hinge: ["hip extension"],
  "hip extension": ["hinge"],
  "core flexion": ["anti-extension", "core stability", "rotation"],
  "anti-extension": ["core stability", "anti-rotation", "core flexion"],
  "anti-rotation": ["core stability", "anti-extension", "rotation"],
  rotation: ["anti-rotation", "core flexion"],
  "core stability": ["anti-extension", "anti-rotation", "balance/stability"],
  conditioning: ["locomotion", "full-body power"],
  locomotion: ["conditioning"],
  "full-body power": ["conditioning", "hinge", "squat"],
  mobility: ["balance/stability"],
  "balance/stability": ["mobility", "core stability"],
  arms: ["horizontal push", "horizontal pull"],
  carry: ["anti-rotation"],
};

/** The base movement inside a pattern (push-up vs dip, jump vs butt kick). HIGH confidence needs the same one. */
const KEYS: Array<[string, RegExp]> = [
  ["side plank", /side plank|side bridge/i], ["plank", /plank/i], ["wall sit", /wall sit|march sit/i],
  ["push-up", /push[- ]?up/i], ["dip", /\bdip/i], ["fly", /\bfly|flye|pec deck/i],
  ["push press", /push press|thruster/i], ["overhead press", /overhead press|shoulder press|military|arnold|seated press/i],
  ["bench press", /bench press|chest press|floor press|incline press|decline press/i],
  ["pull-up", /pull[- ]?up|chin[- ]?up/i], ["pulldown", /pulldown|pull down/i], ["row", /\brow/i],
  ["step-up", /step[- ]?up/i], ["lunge", /lunge|split squat|bulgarian/i], ["squat", /squat|leg press/i],
  ["deadlift", /deadlift|rdl|romanian|good morning/i], ["swing", /swing/i], ["bridge", /bridge|hip thrust/i],
  ["sit-up", /sit[- ]?up/i], ["crunch", /crunch/i], ["leg raise", /leg raise|knee raise/i], ["twist", /twist|chop|russian/i],
  ["burpee", /burpee/i], ["climber", /climber/i], ["jack", /\bjacks?\b|jumping jack|star jump/i], ["high knee", /high knee/i],
  ["butt kick", /butt kick/i], ["skater", /skater/i], ["jump", /jump|hop|bound/i], ["run", /\brun|jog|sprint/i],
  ["crawl", /crawl|crab walk/i], ["clean", /clean|snatch/i], ["curl", /curl/i], ["triceps", /triceps|skull|kickback/i],
  ["calf", /calf|heel raise/i], ["carry", /carry|farmer/i], ["dead bug", /dead bug|bird dog/i], ["stretch", /stretch|pose\b/i],
];
const keyOf = (name: string) => KEYS.find(([, re]) => re.test(name))?.[0] ?? null;

export type Movement = { key: string | null; primary: Pattern; patterns: Pattern[]; objective: Objective; family: string; difficulty: string };

const cache = new Map<string, Movement>();

export function classify(e: Row): Movement {
  const key = `${e.name}|${e.equipment ?? ""}|${e.difficulty ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const patterns = RULES.filter(([, re]) => re.test(e.name)).map(([p]) => p);
  // Name says nothing: fall back to the library's body part.
  if (!patterns.length) {
    const bp = `${e.body_part ?? ""} ${e.target_muscle ?? ""}`.toLowerCase();
    if (/waist|abs|core/.test(bp)) patterns.push("core flexion");
    else if (/calves/.test(bp)) patterns.push("calf");
    else if (/cardio/.test(bp)) patterns.push("conditioning");
    else if (/upper arms|lower arms/.test(bp)) patterns.push("arms");
    else patterns.push("other");
  }
  const primary = patterns[0]!;
  const objective: Objective =
    primary === "mobility" || primary === "balance/stability" ? "mobility"
    : primary === "conditioning" || primary === "locomotion" ? "conditioning"
    : ["rotation", "anti-rotation", "anti-extension", "core flexion", "core stability"].includes(primary) ? "core"
    : "resistance";
  const m: Movement = { key: keyOf(e.name), primary, patterns, objective, family: equipmentFamilyOf(e.equipment), difficulty: (e.difficulty ?? "").toLowerCase() };
  cache.set(key, m);
  return m;
}

export const isRelated = (a: Pattern, b: Pattern) => a === b || (RELATED[a] ?? []).includes(b);

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];
const levelGap = (a: string, b: string) => {
  const i = LEVEL_ORDER.indexOf(a), j = LEVEL_ORDER.indexOf(b);
  return i < 0 || j < 0 ? 0 : Math.abs(i - j);
};

/**
 * How faithfully `to` replaces `from`.
 * HIGH   — same base movement and primary pattern, same objective, same equipment family, similar difficulty
 *          (and every secondary pattern of the original is still trained, e.g. push-up to side plank).
 * MEDIUM — closely related pattern with the same objective, or same pattern on another family.
 * LOW    — anything else (different pattern or a different stimulus).
 */
export function replacementConfidence(from: Row, to: Row, opts: { allowFamilyChange?: boolean } = {}): Confidence {
  const a = classify(from), b = classify(to);
  if (a.objective !== b.objective) return "LOW";
  const sameFamily = a.family === b.family || opts.allowFamilyChange === true;
  const keepsSecondary = a.patterns.slice(1).every((p) => b.patterns.some((q) => isRelated(p, q)));
  if (a.primary === b.primary && a.key === b.key && sameFamily && keepsSecondary && levelGap(a.difficulty, b.difficulty) <= 1) return "HIGH";
  if (isRelated(a.primary, b.primary)) return "MEDIUM";
  return "LOW";
}
