// Training Profile "Injuries & limitations" — the SAFETY layer of the one rule
// engine (rules.ts calls it first; rule hierarchy level 1). Pure, client-safe,
// deterministic.
//
// Each exercise gets one status per member:
//   BLOCKED    — unsuitable for the selected limitation; never programmed.
//   RESTRICTED — may suit depending on severity/technique; carries explicit
//                conditions (range, intensity, support, clinician clearance).
//   ALLOWED    — compatible; "preferred" marks the coach's listed alternatives.
//
// Statuses are decided from movement TRAITS (impact, spinal loading, overhead,
// grip, wrist extension, range of motion, supine/inverted position, bracing,
// intensity) derived from the library row's name, equipment, body part, target
// muscle, difficulty and the coach's movement-pattern classification — never
// from a single keyword. Multiple limitations combine conservatively: the
// exercise must pass every one. Profile selections are not diagnoses.

import { LIMITATIONS } from "@/lib/coach-options";
import { PRIORITY_MOVEMENT_PATTERN } from "./priority";

export type LimitationStatus = "BLOCKED" | "RESTRICTED" | "ALLOWED";
export type PregnancyStage = "pregnant_early" | "pregnant_later" | "postpartum_early" | "postpartum_later";

export const PREGNANCY_STAGES: { id: PregnancyStage; label: string }[] = [
  { id: "pregnant_early", label: "Pregnant — first trimester" },
  { id: "pregnant_later", label: "Pregnant — second or third trimester" },
  { id: "postpartum_early", label: "Postpartum — first 12 weeks" },
  { id: "postpartum_later", label: "Postpartum — after 12 weeks" },
];

/** Conditions where restrictions depend on clinician guidance. */
export const MEDICAL_LIMITATIONS = ["hernia", "pregnancy", "high_bp", "asthma"] as const;

export type LimitationExercise = {
  id?: string;
  name: string;
  equipment?: string | null;
  body_part?: string | null;
  target_muscle?: string | null;
  difficulty?: string | null;
};

export type LimitationProfile = {
  /** Profile values — ids ("lower_back") or labels ("Lower back"). */
  limitations: readonly string[] | null | undefined;
  pregnancyStage?: string | null;
  /** Member reports a clinician cleared them for vigorous exercise. */
  clearance?: boolean | null;
};

export type LimitationFinding = { limitation: string; status: Exclude<LimitationStatus, "ALLOWED">; reason: string; condition?: string };
export type LimitationDecision = { status: LimitationStatus; findings: LimitationFinding[]; preferred: boolean };

// ---------------------------------------------------------------------------
// Movement traits
// ---------------------------------------------------------------------------

type Trait =
  | "jump" | "sprint" | "run" | "burpee" | "ballistic" | "olympic"
  | "heavyHinge" | "lightHinge" | "goodMorning" | "spinalFlexion" | "loadedFlexion" | "rotation" | "loadedRotation"
  | "heavyRow" | "heavySquat" | "machinePress"
  | "overhead" | "heavyOverhead" | "behindNeck" | "pikeHandstand" | "dip" | "uprightPull" | "fly" | "kipping"
  | "neckLoad" | "inversion"
  | "closeGrip" | "tricepsExt" | "heavyCurl" | "gripHeavy"
  | "wristExtension" | "frontRack" | "kettlebell"
  | "deepHip" | "sumo" | "deepKnee" | "lunge" | "stepUp" | "highStep" | "lateralCut"
  | "singleLegBalance" | "jacks" | "standingCalf"
  | "hardBrace" | "plank" | "isometricHold"
  | "supine" | "prone" | "maxEffort" | "contact" | "intenseCardio";

const R = {
  jump: /\b(jump|jumping|hop|hopping|bound|bounding|plyo\w*|leap|tuck jump|box jump|skip|skipping|jump rope|split jump|star jump)\b/i,
  sprint: /\b(sprint\w*|shuttle|high knees?|suicides?)\b/i,
  run: /\b(run|running|jog|jogging)\b/i,
  burpee: /\bburpees?\b/i,
  ballistic: /\b(swings?|slam|snatch|clean|jerk|throw|toss)\b/i,
  olympic: /\b(snatch|clean|jerk|power clean|hang clean)\b/i,
  hinge: /\b(deadlift|rdl|romanian|stiff[- ]leg)\b/i,
  goodMorning: /\bgood ?mornings?\b/i,
  flexion: /\b(crunch\w*|sit-?ups?|v-?ups?|jackknife|toes[- ]to[- ]bar|knees?[- ]to[- ](elbow|chest)|leg raises?|hanging (knee|leg)|roll-?up|tuck-?ups?|bicycle)\b/i,
  rotation: /\b(russian twist|wood ?chop|rotation\w*|windmill|oblique twist)\b/i,
  bentRow: /\b(bent[- ]over (barbell )?rows?|barbell rows?|pendlay|t-?bar row)\b/i,
  squatHeavy: /\b(back squat|front squat|barbell squat|hack squat|zercher)\b/i,
  machinePress: /\bleg press\b/i,
  overhead: /\b(overhead|military|shoulder press|push press|arnold|thruster|wall ?balls?|z press|landmine press)\b/i,
  behindNeck: /\bbehind[- ]the[- ]neck\b/i,
  pikeHandstand: /\b(pike push|handstand)\b/i,
  dip: /\bdips?\b/i,
  uprightPull: /\b(upright rows?|high pulls?)\b/i,
  fly: /\b(fly|flyes?|flies|pec deck)\b/i,
  kipping: /\b(kipping|muscle-?ups?)\b/i,
  neck: /\b(neck|wrestler|headstand|head bridge)\b/i,
  inversion: /\b(handstand|headstand|inverted|decline)\b/i,
  closeGrip: /\b(close[- ]grip|diamond|triangle push)\b/i,
  tricepsExt: /\b(skull ?crushers?|triceps? extensions?|french press|overhead triceps)\b/i,
  curl: /\bcurls?\b/i,
  gripHeavy: /\b(farmers?'? (carry|walk)|dead ?hang|hang\b|pull-?ups?|chin-?ups?|towel|suitcase carry|rope climb)\b/i,
  pushUp: /\b(push-?ups?|pushups?|press-?ups?)\b/i,
  plank: /\bplanks?\b/i,
  handsFloor: /\b(crawl\w*|mountain climbers?|inchworms?|plank jacks?|shoulder taps?|walkouts?)\b/i,
  forearm: /\b(forearm|elbow) plank\b/i,
  frontRack: /\b(front squat|front rack|clean|rack(ed)? (carry|hold|squat))\b/i,
  deepHip: /\b(pistol|cossack|deep squat|frog|shrimp squat|ass to grass|atg)\b/i,
  sumo: /\b(sumo|wide stance|plie)\b/i,
  deepKnee: /\b(pistol|sissy|deep squat|shrimp squat|atg|bulgarian)\b/i,
  lunge: /\b(lunges?|split squats?|bulgarian)\b/i,
  stepUp: /\bstep-?ups?\b/i,
  highStep: /\b(box step-?up|high step|box (jump|step))\b/i,
  lateralCut: /\b(skaters?|lateral bound|shuffle|carioca|agility|cone)\b/i,
  singleLeg: /\b(single[- ]leg|one[- ]leg|pistol|bosu|balance|stork)\b/i,
  jacks: /\b(jumping jacks?|star jumps?|seal jacks?|plank jacks?)\b/i,
  standingCalf: /\b(standing calf|calf raises?)\b/i,
  hold: /\b(wall sit|hollow (hold|body)|l-?sit|isometric|static hold|dead ?hang)\b/i,
  hardBrace: /\b(hollow|l-?sit|dragon flag|ab wheel|rollout|body saw|long lever)\b/i,
  supine: /\b(lying|supine|bench press|floor press|chest press|dead ?bugs?|glute bridges?|hip thrusts?|bridge|pullover|skull ?crusher|leg raises?|crunch\w*|sit-?ups?|v-?ups?|flutter kicks?|scissors?)\b/i,
  seated: /\b(seated|incline|machine)\b/i,
  prone: /\b(prone|superman|y-?t-?w|swimmers?|back extension|hyperextension)\b/i,
  maxEffort: /\b(max|1 ?rm|one rep max|all-?out|max effort)\b/i,
  contact: /\b(sparring|tackle|wrestl\w*|partner drill|contact)\b/i,
  intenseCardio: /\b(battle ropes?|assault bike|air bike|echo bike|ski erg|sled (push|pull)|prowler)\b/i,
};

const isBarbell = (t: string) => /\b(barbell|trap bar|ez bar|smith)\b/i.test(t);
const isFreeLoad = (t: string) => /\b(barbell|dumbbell|kettlebell|trap bar|ez bar|smith|weighted|plate|medicine ball|sandbag|cable)\b/i.test(t);
const isSupported = (t: string) => /\b(machine|seated|supported|chest[- ]supported|cable|incline bench|bench)\b/i.test(t);

function traitsOf(e: LimitationExercise): Set<Trait> {
  const name = e.name ?? "";
  const eq = e.equipment ?? "";
  const full = `${name} ${eq} ${e.target_muscle ?? ""} ${e.body_part ?? ""}`;
  const t = new Set<Trait>();
  const add = (k: Trait, ok: boolean) => { if (ok) t.add(k); };
  const advanced = (e.difficulty ?? "").toLowerCase() === "advanced";
  const pattern = PRIORITY_MOVEMENT_PATTERN[name];

  add("jump", R.jump.test(name) && !/\bjump rope\b.*\bslow\b/i.test(name));
  add("sprint", R.sprint.test(name));
  add("run", R.run.test(name));
  add("burpee", R.burpee.test(name));
  add("ballistic", R.ballistic.test(name));
  add("olympic", R.olympic.test(name));
  const hinge = R.hinge.test(name);
  add("heavyHinge", hinge && isBarbell(`${name} ${eq}`));
  add("lightHinge", hinge && !isBarbell(`${name} ${eq}`));
  add("goodMorning", R.goodMorning.test(name));
  const flex = R.flexion.test(name);
  add("spinalFlexion", flex);
  add("loadedFlexion", flex && isFreeLoad(`${name} ${eq}`));
  const rot = R.rotation.test(name);
  add("rotation", rot);
  add("loadedRotation", rot && isFreeLoad(`${name} ${eq}`));
  add("heavyRow", R.bentRow.test(name) && !isSupported(name));
  add("heavySquat", R.squatHeavy.test(name) || (/\bsquat\b/i.test(name) && isBarbell(`${name} ${eq}`)));
  add("machinePress", R.machinePress.test(name));
  const overhead = R.overhead.test(name);
  add("overhead", overhead);
  add("heavyOverhead", overhead && (isBarbell(`${name} ${eq}`) || /push press|jerk|thruster/i.test(name)));
  add("behindNeck", R.behindNeck.test(name));
  add("pikeHandstand", R.pikeHandstand.test(name));
  add("dip", R.dip.test(name));
  add("uprightPull", R.uprightPull.test(name));
  add("fly", R.fly.test(name));
  add("kipping", R.kipping.test(name));
  add("neckLoad", R.neck.test(name));
  add("inversion", R.inversion.test(name) && !/\bdecline (bench )?crunch\b/i.test(name) ? true : R.inversion.test(name));
  add("closeGrip", R.closeGrip.test(name));
  add("tricepsExt", R.tricepsExt.test(name));
  add("heavyCurl", R.curl.test(name) && (isBarbell(`${name} ${eq}`) || advanced) && !/\b(leg|hamstring|nordic)\b/i.test(name));
  add("gripHeavy", R.gripHeavy.test(name));
  const pushUpOnHands = R.pushUp.test(name) && !/\b(handles?|dumbbell|fist|knuckle|wall|incline)\b/i.test(full);
  add("wristExtension",
    pushUpOnHands || (R.plank.test(name) && !R.forearm.test(name) && !/\bside plank\b/i.test(name)) ||
    R.burpee.test(name) || R.handsFloor.test(name) || R.pikeHandstand.test(name));
  add("frontRack", R.frontRack.test(name));
  add("kettlebell", /\bkettlebell\b/i.test(`${name} ${eq}`));
  add("deepHip", R.deepHip.test(name));
  add("sumo", R.sumo.test(name));
  add("deepKnee", R.deepKnee.test(name));
  add("lunge", R.lunge.test(name));
  add("stepUp", R.stepUp.test(name));
  add("highStep", R.highStep.test(name));
  add("lateralCut", R.lateralCut.test(name));
  add("singleLegBalance", R.singleLeg.test(name));
  add("jacks", R.jacks.test(name));
  add("standingCalf", R.standingCalf.test(name) && !/\bseated\b/i.test(name));
  add("isometricHold", R.hold.test(name));
  add("plank", R.plank.test(name));
  add("hardBrace", R.hardBrace.test(name) || (advanced && (pattern === "core" || /\bcore\b/i.test(full))));
  add("supine", R.supine.test(name) && !R.seated.test(name));
  add("prone", R.prone.test(name));
  add("maxEffort", R.maxEffort.test(name));
  add("contact", R.contact.test(name));
  add("intenseCardio", R.intenseCardio.test(name));
  return t;
}

// ---------------------------------------------------------------------------
// Policy — one entry per Training Profile limitation
// ---------------------------------------------------------------------------

type Ctx = { stage: PregnancyStage | null; cleared: boolean };
type Rule = { status: "BLOCKED" | "RESTRICTED"; when: (t: Set<Trait>, c: Ctx) => boolean; reason: string; condition?: string };
type Policy = { rules: Rule[]; prefer: RegExp };

const any = (...ks: Trait[]) => (t: Set<Trait>) => ks.some((k) => t.has(k));
const CLEARANCE = "Only with clearance from your doctor or clinician.";

export const LIMITATION_POLICY: Record<string, Policy> = {
  lower_back: {
    rules: [
      { status: "BLOCKED", when: any("goodMorning", "heavyHinge", "loadedFlexion", "loadedRotation", "heavyRow"), reason: "heavy hinging, loaded spinal flexion/rotation or an unsupported heavy row loads the lower back" },
      { status: "RESTRICTED", when: any("lightHinge"), reason: "hip hinge", condition: "Light load, neutral spine, pain-free range only." },
      { status: "RESTRICTED", when: any("heavySquat", "olympic"), reason: "heavy spinal loading", condition: "Light load and pain-free; skip if it provokes symptoms." },
      { status: "RESTRICTED", when: any("jump", "burpee", "ballistic", "sprint"), reason: "high-impact or ballistic movement", condition: "Low intensity and only if symptom-free." },
      { status: "RESTRICTED", when: any("spinalFlexion", "rotation"), reason: "repeated spinal flexion or rotation", condition: "Controlled, unloaded, pain-free range only." },
    ],
    prefer: /\b(glute bridge|hip thrust|bird ?dog|dead ?bug|side plank|split squat|supported row|chest[- ]supported|seated (cable )?row|step-?up)\b/i,
  },
  neck: {
    rules: [
      { status: "BLOCKED", when: any("neckLoad", "behindNeck", "inversion"), reason: "loads the neck directly or holds it in a loaded/inverted position" },
      { status: "RESTRICTED", when: any("heavyOverhead"), reason: "heavy overhead loading", condition: "Light load with a comfortable, neutral head position." },
      { status: "RESTRICTED", when: any("spinalFlexion"), reason: "the head is often pulled forward", condition: "Keep the head supported and neutral; stop if the neck aches." },
    ],
    prefer: /\b(chest press|seated (cable )?row|supported row|chest[- ]supported|bodyweight squat|glute bridge|step-?up|leg press|leg curl|leg extension)\b/i,
  },
  shoulder: {
    rules: [
      { status: "BLOCKED", when: any("behindNeck", "uprightPull", "kipping", "pikeHandstand"), reason: "forces the shoulder into an end-range or overhead loaded position" },
      { status: "RESTRICTED", when: any("overhead", "olympic"), reason: "overhead loading", condition: "Only if overhead is pain-free; light load, partial range." },
      { status: "RESTRICTED", when: any("dip"), reason: "deep shoulder extension under load", condition: "Shallow, pain-free depth only." },
      { status: "RESTRICTED", when: any("fly"), reason: "long-lever stretch across the front of the shoulder", condition: "Light load, stop short of the painful range." },
    ],
    prefer: /\b(neutral[- ]grip|floor press|seated (cable )?row|supported row|chest[- ]supported|face pull|external rotation|band pull[- ]apart|squat|lunge|glute bridge|hip thrust|leg press)\b/i,
  },
  elbow: {
    rules: [
      { status: "RESTRICTED", when: any("dip", "closeGrip", "tricepsExt"), reason: "high elbow-extension load", condition: "Light load, comfortable grip, pain-free only." },
      { status: "RESTRICTED", when: any("heavyCurl"), reason: "heavy elbow-flexion load", condition: "Light load, pain-free only." },
      { status: "RESTRICTED", when: any("gripHeavy"), reason: "grip-intensive", condition: "Short holds with a comfortable grip; skip if symptoms rise." },
    ],
    prefer: /\b(squat|lunge|glute bridge|hip thrust|leg press|leg curl|leg extension|calf raise|step-?up)\b/i,
  },
  wrist: {
    rules: [
      { status: "BLOCKED", when: (t) => t.has("pikeHandstand") || t.has("closeGrip"), reason: "forces loaded wrist extension" },
      { status: "RESTRICTED", when: any("wristExtension"), reason: "bodyweight on extended wrists", condition: "Only on approved handles, fists or forearms, and only if pain-free." },
      { status: "RESTRICTED", when: any("frontRack"), reason: "front-rack wrist position", condition: "Avoid if the rack position hurts; use a goblet hold instead." },
      { status: "RESTRICTED", when: (t) => t.has("kettlebell") && (t.has("ballistic") || t.has("frontRack")), reason: "the kettlebell can load the wrist", condition: "Only if wrist-comfortable." },
    ],
    prefer: /\b(machine|leg press|leg curl|leg extension|squat|lunge|glute bridge|hip thrust|neutral[- ]grip|cable)\b/i,
  },
  hip: {
    rules: [
      { status: "BLOCKED", when: any("deepHip"), reason: "forced deep hip flexion or rotation" },
      { status: "RESTRICTED", when: (t) => t.has("sumo") || t.has("highStep") || (t.has("lunge") && t.has("deepKnee")), reason: "large hip range of motion", condition: "Shallow, pain-free range only." },
      { status: "RESTRICTED", when: any("jump", "lateralCut"), reason: "impact through the hip", condition: "Low intensity and only if symptom-free." },
    ],
    prefer: /\b(box squat|sit[- ]to[- ]stand|glute bridge|hip thrust|hip abduction|clamshell|side[- ]lying|chest press|row|shoulder press|lat pulldown)\b/i,
  },
  knee: {
    rules: [
      { status: "BLOCKED", when: (t, _c) => (t.has("jump") && (t.has("lunge") || /squat/.test("") || true)) && t.has("jump") && !t.has("jacks") ? true : t.has("deepKnee") && !t.has("lunge"), reason: "landing impact or forced deep knee flexion" },
      { status: "RESTRICTED", when: any("lateralCut", "sprint", "jacks", "burpee"), reason: "impact or cutting through the knee", condition: "Low intensity and only if symptom-free." },
      { status: "RESTRICTED", when: any("lunge", "stepUp"), reason: "single-leg knee loading", condition: "Approved, pain-free range only; reduce depth or step height." },
    ],
    prefer: /\b(glute bridge|hip thrust|romanian|rdl|leg extension|box squat|leg press|chest press|row|lat pulldown|shoulder press)\b/i,
  },
  ankle: {
    rules: [
      { status: "BLOCKED", when: (t) => t.has("jump") || t.has("sprint") || (t.has("run") && t.has("lateralCut")), reason: "painful impact or unstable landing" },
      { status: "RESTRICTED", when: any("jacks", "lateralCut", "burpee", "run"), reason: "impact through the ankle", condition: "Only if weight-bearing impact is pain-free." },
      { status: "RESTRICTED", when: any("singleLegBalance", "standingCalf"), reason: "single-leg or end-range ankle loading", condition: "Use support and stay pain-free." },
    ],
    prefer: /\b(seated|machine|chest press|row|lat pulldown|glute bridge|hip thrust|seated calf)\b/i,
  },
  hernia: {
    rules: [
      { status: "BLOCKED", when: any("heavyHinge", "heavySquat", "olympic", "spinalFlexion", "burpee", "maxEffort", "hardBrace"), reason: "strong bracing or abdominal pressure" },
      { status: "BLOCKED", when: (t) => t.has("ballistic") && t.has("kettlebell"), reason: "ballistic hip drive with strong bracing" },
      { status: "BLOCKED", when: any("overhead"), reason: "thrusters and heavy overhead work raise abdominal pressure" },
      { status: "RESTRICTED", when: any("plank", "rotation", "machinePress", "lightHinge", "jump", "isometricHold"), reason: "raises abdominal pressure", condition: `Light, controlled, breathe throughout. ${CLEARANCE}` },
    ],
    prefer: /\b(walk|march|seated|machine|band|glute bridge|cable)\b/i,
  },
  pregnancy: {
    rules: [
      { status: "BLOCKED", when: any("contact", "maxEffort", "inversion", "loadedFlexion"), reason: "contact risk, maximal straining or inversion" },
      { status: "BLOCKED", when: (t, c) => (t.has("jump") || t.has("sprint") || t.has("burpee")) && c.stage !== "postpartum_later", reason: "high impact at this stage" },
      { status: "BLOCKED", when: (t, c) => t.has("spinalFlexion") && c.stage !== "postpartum_later", reason: "can cause abdominal doming" },
      { status: "RESTRICTED", when: (t, c) => t.has("supine") && (c.stage === null || c.stage === "pregnant_later"), reason: "lying on the back later in pregnancy", condition: `Use an incline or side-lying version. ${CLEARANCE}` },
      { status: "RESTRICTED", when: (t, c) => (t.has("jump") || t.has("sprint") || t.has("burpee") || t.has("spinalFlexion")) && c.stage === "postpartum_later", reason: "impact or crunching after childbirth", condition: `Only if there is no leaking, heaviness or doming. ${CLEARANCE}` },
      { status: "RESTRICTED", when: any("heavyHinge", "heavySquat", "heavyOverhead", "olympic", "hardBrace", "plank", "rotation", "isometricHold", "prone"), reason: "heavy bracing, breath-holding or a position that may need changing", condition: `Moderate load, continuous breathing; stop with pain, heaviness, leaking or doming. ${CLEARANCE}` },
    ],
    prefer: /\b(walk|march|sit[- ]to[- ]stand|box squat|goblet squat|bodyweight squat|seated|cable|band|incline|side[- ]lying|breathing)\b/i,
  },
  high_bp: {
    rules: [
      { status: "BLOCKED", when: any("maxEffort", "inversion"), reason: "maximal straining or head-down position" },
      { status: "RESTRICTED", when: any("heavyHinge", "heavySquat", "olympic", "machinePress", "heavyOverhead", "isometricHold", "hardBrace"), reason: "near-maximal straining or breath-holding", condition: `Moderate load, breathe continuously — never hold your breath. ${CLEARANCE}` },
      { status: "RESTRICTED", when: any("sprint", "burpee", "intenseCardio"), reason: "very intense interval", condition: `Moderate pace only. ${CLEARANCE}` },
    ],
    prefer: /\b(walk|march|cycl\w*|bike|machine|seated|cable|band|step-?up|glute bridge)\b/i,
  },
  asthma: {
    rules: [
      { status: "RESTRICTED", when: any("sprint", "intenseCardio", "burpee"), reason: "all-out effort can trigger symptoms", condition: `Follow your asthma action plan; use planned recovery. ${CLEARANCE}` },
      { status: "RESTRICTED", when: (t) => t.has("jump") && /tuck|rope/.test(""), reason: "continuous high-intensity effort", condition: "Follow your asthma action plan." },
    ],
    prefer: /\b(walk|march|cycl\w*|machine|seated|cable|dumbbell|band)\b/i,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const BY_LABEL = new Map<string, string>(LIMITATIONS.map((l) => [l.label.toLowerCase(), l.id]));

/** Ids of the member's limitations the engine knows — accepts ids or the profile's stored labels. */
export function knownLimitations(values: readonly string[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const raw of values ?? []) {
    const v = String(raw ?? "").trim();
    const id = v in LIMITATION_POLICY ? v : BY_LABEL.get(v.toLowerCase());
    if (id) out.add(id);
  }
  return [...out];
}

const asStage = (s: string | null | undefined): PregnancyStage | null =>
  PREGNANCY_STAGES.some((p) => p.id === s) ? (s as PregnancyStage) : null;

/** Decides one exercise against every selected limitation (all must pass). */
export function limitationDecision(e: LimitationExercise, profile: LimitationProfile | readonly string[]): LimitationDecision {
  const p: LimitationProfile = Array.isArray(profile) ? { limitations: profile as string[] } : (profile as LimitationProfile);
  const ids = knownLimitations(p.limitations);
  if (!ids.length) return { status: "ALLOWED", findings: [], preferred: false };
  const t = traitsOf(e);
  const c: Ctx = { stage: asStage(p.pregnancyStage), cleared: Boolean(p.clearance) };
  const findings: LimitationFinding[] = [];
  let preferred = true;
  for (const id of ids) {
    const pol = LIMITATION_POLICY[id]!;
    const hit = pol.rules.filter((r) => r.when(t, c));
    const blocked = hit.find((r) => r.status === "BLOCKED");
    const chosen = blocked ? [blocked] : hit;
    for (const r of chosen) findings.push({ limitation: id, status: r.status, reason: r.reason, ...(r.condition ? { condition: r.condition } : {}) });
    if (!pol.prefer.test(e.name)) preferred = false;
  }
  const status: LimitationStatus = findings.some((f) => f.status === "BLOCKED") ? "BLOCKED" : findings.length ? "RESTRICTED" : "ALLOWED";
  return { status, findings, preferred: status === "ALLOWED" && preferred };
}

/**
 * Engine admission for automatically built workouts (Coach, WOD, admin
 * generation). BLOCKED never passes. RESTRICTED passes only when every
 * restriction is a joint/technique one the session can respect, or — for
 * medical conditions — when the member reports clinician clearance.
 */
export function limitationAdmits(e: LimitationExercise, profile: LimitationProfile | readonly string[], opts: { allowRestricted?: boolean } = {}): boolean {
  const d = limitationDecision(e, profile);
  if (d.status === "ALLOWED") return true;
  if (d.status === "BLOCKED") return false;
  const cleared = !Array.isArray(profile) && Boolean((profile as LimitationProfile).clearance);
  const medicalUncleared = d.findings.some((f) => (MEDICAL_LIMITATIONS as readonly string[]).includes(f.limitation)) && !cleared;
  if (medicalUncleared) return false;
  return opts.allowRestricted ?? false;
}

/** Plain-language explanation (not a diagnosis) for why an exercise was left out or limited. */
export function limitationExplanation(name: string, d: LimitationDecision): string | null {
  if (d.status === "ALLOWED") return null;
  const f = d.findings.find((x) => x.status === "BLOCKED") ?? d.findings[0]!;
  const label = limitationLabel(f.limitation);
  return d.status === "BLOCKED"
    ? `"${name}" is left out because of your ${label} limitation: ${f.reason}.`
    : `"${name}" is limited because of your ${label} limitation (${f.reason}). ${f.condition ?? ""}`.trim();
}

/** Back-compat: true when the exercise is BLOCKED for any of the limitations. */
export function conflictsWithLimitations(name: string, ids: readonly string[]): boolean {
  return limitationDecision({ name }, ids).status === "BLOCKED";
}

export function limitationLabel(id: string): string {
  return LIMITATIONS.find((l) => l.id === id)?.label ?? id;
}

/** True when the selection includes a condition that needs clinician-led programming. */
export const hasMedicalLimitation = (values: readonly string[] | null | undefined) =>
  knownLimitations(values).some((id) => (MEDICAL_LIMITATIONS as readonly string[]).includes(id));
