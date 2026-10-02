// Activation and Cool Down vocabulary. Priority exercises are for the work
// sections only — these two sections use mobility, stability and stretches.

export const ACTIVATION_NAMES = [
  "bird dog", "cat-cow", "clamshell", "fire hydrant", "glute bridge", "glute bridge march",
  "low glute bridge on floor", "single leg bridge with outstretched leg", "dead bug", "pelvic tilt",
  "standing pelvic tilt", "scapula push-up", "incline scapula push up", "plank", "bodyweight incline side plank",
  "kneeling plank tap shoulder", "inchworm", "world greatest stretch", "squat to overhead reach",
  "squat to overhead reach with twist", "posterior step to overhead reach", "wrist circles", "ankle circles",
  "dynamic chest stretch (male)", "circles knee stretch", "spine twist",
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
const CD_LIKE = /stretch|\bpose\b|spine twist|lying twist|pelvic tilt|knees? to chest|cat-cow|child/;
const ACT_LIKE = /bird dog|dead bug|glute bridge|clamshell|fire hydrant|plank|circles?\b|rotation|inchworm|overhead reach|scapula/;
const BANNED = /lunge|row\b|press|raise|curl|crawl|walk|kick|jump|burpee|climber|crunch|dip|calf|squat jump|(?<!scapula )push[- ]?up|extension|abduct|adduct|machine|barbell|dumbbell|cable|kettlebell/;
const norm = (n: string) => n.trim().toLowerCase();

export type PrepSection = "activation" | "cooldown";

export function prepAllowed(name: string, section: PrepSection): boolean {
  const n = norm(name);
  // Activation may also use cool-down mobility/stretches; cool down stays static/mobility.
  if (section === "cooldown" ? CD.has(n) : ACT.has(n) || CD.has(n)) return true;
  if (BANNED.test(n)) return false;
  return section === "cooldown" ? CD_LIKE.test(n) : ACT_LIKE.test(n) || CD_LIKE.test(n);
}

const TOKEN = /\{\{exercise:([A-Za-z0-9_-]+):([^}]*)\}\}/g;

/** Token spans in the Activation and Cool Down sections. */
export function prepTokens(html: string): Array<{ section: PrepSection; id: string; name: string; index: number; raw: string }> {
  const out: Array<{ section: PrepSection; id: string; name: string; index: number; raw: string }> = [];
  const act = html.search(/Activation/i);
  const main = html.search(/Main Workout/i);
  const cd = html.search(/Cool[\s-]?Down/i);
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
