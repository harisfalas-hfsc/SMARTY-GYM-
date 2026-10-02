import { orderedPriority, pickPriorityByPattern } from "./priority";
// Deterministic template ("pack") engine.
// Builds a fully compliant session straight from the filtered pool — no model
// involved. Used as the reliability fallback when the AI cannot produce a
// workout that passes enforcement + validation.
import type { PoolExercise } from "./pool.server";
import { pickPrep, STRETCH_RE } from "./pool.server";
import { dominantRegion, equipmentFamilyLimit, equipmentFamilyOf, isDynamicFormat, regionOf } from "./doctrine";
import type { SessionPlan } from "./programming";
import { prepAllowed } from "./prep-vocabulary";
import { isCardioRhythm, isTimedPosition, LIGHT_SET_CAP } from "./rules";
import type { Category, DifficultyLevel, Format, StrengthFocus } from "./spec";

export type PackInput = {
  category: Category;
  format: Format;
  level: DifficultyLevel;
  minutes: number;
  focus?: StrengthFocus | null;
  favoriteIds?: string[];
  /** Library-backed prep vocabulary; guarantees playable Activation / Cool Down. */
  activationPool?: PoolExercise[];
  cooldownPool?: PoolExercise[];
  seed?: number;
  /** Blueprint decision (programming.ts) — authoritative. No Finisher when false. */
  finisher?: boolean;
  /** The session blueprint — counts and doses come from here when present. */
  plan?: Pick<SessionPlan, "mainCount" | "finisherCount" | "main" | "finisher">;
};

/**
 * Human flow: keep at most the legal number of implement families (replacing
 * stray rows with legal rows from the kept families or bodyweight) and, in a
 * timed format, group each implement into one contiguous block.
 */
function flowGroup(picks: PoolExercise[], pool: PoolExercise[], input: PackInput, used: Set<string>): PoolExercise[] {
  const fam = (e: PoolExercise) => equipmentFamilyOf(e.equipment);
  const counts = new Map<string, number>();
  for (const e of picks) if (fam(e) !== "bodyweight") counts.set(fam(e), (counts.get(fam(e)) ?? 0) + 1);
  const keep = new Set([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, equipmentFamilyLimit(input.category, input.format)).map(([f]) => f));
  const ok = (e: PoolExercise) => fam(e) === "bodyweight" || keep.has(fam(e));
  const taken = new Set([...used, ...picks.map((e) => e.id)]);
  let out = picks.map((e) => {
    if (ok(e)) return e;
    const alt = pool.find((x) => ok(x) && !taken.has(x.id));
    if (!alt) return e;
    taken.add(alt.id);
    return alt;
  });
  if (isDynamicFormat(input.format)) {
    const order = [...new Set(out.map(fam))];
    out = [...out].sort((a, b) => order.indexOf(fam(a)) - order.indexOf(fam(b)));
  }
  return out;
}


export type PackResult = { html: string; name: string; blocks: string[] };

const li = (inner: string) =>
  `<ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">${inner}</p></li></ul>`;
const para = (inner: string) => `<p class="tiptap-paragraph">${inner}</p>`;
const heading = (icon: string, title: string) =>
  para(`${icon} <strong><u>${title}</u></strong>`);
const token = (e: PoolExercise) => `{{exercise:${e.id}:${e.name}}}`;

const SOFT_TISSUE = [
  "60 sec Foam roll quadriceps — slow controlled passes",
  "60 sec Foam roll thoracic spine — pause on tender spots",
  "45 sec Lacrosse ball glute release — each side",
];

const COOLDOWN_FALLBACK = [
  "45 sec Standing hamstring stretch — each side, breathe out into it",
  "45 sec Chest doorway stretch — ribs down, shoulders relaxed",
  "60 sec Box breathing — 4 in, 4 hold, 4 out, 4 hold",
];

const ACTIVATION_FALLBACK = [
  "10 reps Bodyweight glute bridge — squeeze 1 sec at the top",
  "10 reps Scapular wall slide — keep ribs down",
  "8 reps each side World’s greatest stretch — slow and controlled",
  "20 sec Dead bug hold — breathe, no arching",
];

const isBodyweight = (e: PoolExercise) => (e.equipment ?? "").toLowerCase().includes("body weight");

function shuffle<T>(arr: T[], seed = 1): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Picks `count` exercises, rotating body parts and honouring favourites first. */
export function pickBalanced(
  pool: PoolExercise[],
  count: number,
  opts: { favoriteIds?: string[]; exclude?: Set<string>; filter?: (e: PoolExercise) => boolean } = {},
): PoolExercise[] {
  const exclude = opts.exclude ?? new Set<string>();
  const candidates = pool.filter((e) => !exclude.has(e.id) && (opts.filter ? opts.filter(e) : true));
  if (!candidates.length) return [];

  const favourites = (opts.favoriteIds ?? []).length
    ? candidates.filter((e) => opts.favoriteIds!.includes(e.id))
    : [];

  const byPart = new Map<string, PoolExercise[]>();
  for (const e of candidates) {
    if (favourites.includes(e)) continue;
    const key = e.body_part ?? "other";
    if (!byPart.has(key)) byPart.set(key, []);
    byPart.get(key)!.push(e);
  }

  const picked: PoolExercise[] = [];
  const seen = new Set<string>();
  for (const fav of favourites) {
    if (picked.length >= count) break;
    picked.push(fav);
    seen.add(fav.id);
  }

  const parts = shuffle([...byPart.keys()], candidates.length);
  let guard = 0;
  while (picked.length < count && guard < count * 12) {
    guard += 1;
    for (const part of parts) {
      const list = byPart.get(part);
      if (!list?.length) continue;
      const next = list.shift()!;
      if (seen.has(next.id)) continue;
      picked.push(next);
      seen.add(next.id);
      if (picked.length >= count) break;
    }
    if (parts.every((p) => !byPart.get(p)?.length)) break;
  }
  return picked;
}

/** Fill a prescribed block from the legal pool even when a narrow filter leaves few rows. */
function fillFromLegalPool(picks: PoolExercise[], pool: PoolExercise[], count: number): PoolExercise[] {
  if (!pool.length || count <= 0) return [];
  const out = picks.slice(0, count);
  let cursor = 0;
  while (out.length < count) {
    const next = pool[cursor % pool.length];
    if (!next) break;
    out.push(next);
    cursor += 1;
  }
  return out;
}

type Dose = { text: string; protocol: string | null };

function doseFor(format: Format, level: DifficultyLevel, index: number, light = false): Dose {
  // Recovery / Mobility & Stability never exceed the light-category set cap (rules.ts).
  const sets = Math.min(level === "beginner" ? 3 : level === "advanced" ? 5 : 4, light ? LIGHT_SET_CAP : 99);
  const reps = level === "beginner" ? 10 : level === "advanced" ? 8 : 10;
  const rest = level === "beginner" ? 90 : level === "advanced" ? 60 : 75;
  const work = level === "beginner" ? 30 : level === "advanced" ? 45 : 40;

  switch (format) {
    case "REPS & SETS":
      return {
        text: `${sets} sets × ${reps} reps`,
        protocol: `Rest ${rest} sec between sets. Controlled lowering, strong finish.`,
      };
    case "TABATA":
      return { text: "20 sec", protocol: "8 rounds of 20 sec work / 10 sec rest per station." };
    case "EMOM":
      return { text: `Minute ${index + 1}: ${reps + 2} reps`, protocol: null };
    case "AMRAP":
      return { text: `${reps + 2} reps`, protocol: null };
    case "FOR TIME":
      return { text: `${reps * 2} reps`, protocol: null };
    case "MIX":
      return index < 2
        ? { text: `${sets} sets × ${reps} reps`, protocol: null }
        : { text: `${work} sec`, protocol: null };
    case "CIRCUIT":
    default:
      return { text: `${work} sec`, protocol: null };
  }
}

function roundsFor(format: Format, minutes: number, stations: number): string | null {
  const rounds = Math.max(2, Math.min(6, Math.round(minutes / Math.max(4, stations * 1.5))));
  switch (format) {
    case "CIRCUIT":
      return `${rounds} rounds. Rest 60 sec between rounds.`;
    case "AMRAP":
      return `As many rounds as possible in ${Math.max(8, Math.round(minutes * 0.6))} minutes.`;
    case "FOR TIME":
      return `${rounds} rounds for time. Cap: ${Math.max(10, Math.round(minutes * 0.6))} minutes.`;
    case "EMOM":
      return `EMOM for ${Math.max(10, Math.round(minutes * 0.6))} minutes, cycling the list.`;
    case "TABATA":
      return `8 rounds of 20 sec work / 10 sec rest at every station.`;
    default:
      return null;
  }
}

const NAME_LEFT = ["Steady", "Honest", "Quiet", "Clean", "Solid", "Simple", "Patient", "Sharp"];
const NAME_RIGHT: Record<string, string> = {
  STRENGTH: "Lift Session",
  "CALORIE BURNING": "Sweat Session",
  METABOLIC: "Mixed Session",
  CARDIO: "Pace Session",
  "MOBILITY & STABILITY": "Mobility Session",
  CHALLENGE: "Test Session",
  PILATES: "Mat Session",
  RECOVERY: "Reset Session",
  "MICRO-WORKOUTS": "Short Session",
};

/**
 * Builds a compliant session deterministically from the pool.
 * `library` supplies activation / cool-down movements that the strict session
 * pool may have filtered out.
 */
export function buildPackWorkout(
  pool: PoolExercise[],
  library: PoolExercise[],
  input: PackInput,
): PackResult {
  const isMicro = input.category === "MICRO-WORKOUTS";
  const isRecovery = input.category === "RECOVERY";
  // HARD RULE: Micro Workout and Pilates never get a finisher.
  const noFinisher = input.finisher === undefined ? isMicro || isRecovery || input.category === "PILATES" : !input.finisher;
  const favouriteIds = input.favoriteIds ?? [];
  const used = new Set<string>();

  const mainCount = input.plan ? Math.max(3, input.minutes <= 20 ? input.plan.mainCount[0] : input.plan.mainCount[1]) : isMicro ? 4 : input.minutes >= 45 ? 6 : input.minutes >= 25 ? 5 : 4;
  const finisherCount = input.plan ? Math.max(input.plan.finisherCount[0], 1) : 3;
  // Coach's priority exercises (the 3 × 50 lists) come first; the rest of the
  // legal pool is only used to top up when too few priority matches exist.
  // Mobility & Stability and Pilates keep their own specialist vocabulary.
  const usePriority = input.category !== "MOBILITY & STABILITY" && input.category !== "PILATES";
  const flow = input.format !== "REPS & SETS";
  // CARDIO blocks are rhythmic aerobic work (rules.ts): draw them from the rhythm vocabulary.
  const rhythmPool = pool.filter((e) => isCardioRhythm(e.name) && !/burpee|mountain climber|skater|sprint|jump squat|tuck|depth/i.test(e.name));
  const workPool = input.category === "CARDIO" && rhythmPool.length >= 4 ? rhythmPool : pool;
  const pickPriorityFirst = (count: number, favs: string[]) => {
    const first = usePriority
      ? pickPriorityByPattern(workPool, count, { exclude: used, seed: input.seed ?? input.minutes, conditioningFirst: flow })
      : [];
    if (first.length >= count) return first;
    const ex = new Set([...used, ...first.map((e) => e.id)]);
    // Any remaining priority movement comes before non-priority filler.
    const more = usePriority ? orderedPriority(workPool).filter((e) => !ex.has(e.id)).slice(0, count - first.length) : [];
    if (first.length + more.length >= count) return [...first, ...more];
    more.forEach((e) => ex.add(e.id));
    return [...first, ...more, ...pickBalanced(workPool, count - first.length, { favoriteIds: favs, exclude: ex })];
  };
  const mainPicks = flowGroup(fillFromLegalPool(
    pickPriorityFirst(mainCount, favouriteIds),
    pool,
    mainCount,
  ), pool, input, used);
  mainPicks.forEach((e) => used.add(e.id));

  const finisherPicks = noFinisher
    ? []
    : (() => {
        // Finisher keeps the Main Workout's equipment flow: no new station for the last minutes.
        const fams = new Set(mainPicks.map((e) => equipmentFamilyOf(e.equipment)));
        const flowPool = workPool.filter((e) => fams.has(equipmentFamilyOf(e.equipment)) || equipmentFamilyOf(e.equipment) === "bodyweight");
        const src = flowPool.length >= finisherCount ? flowPool : workPool;
        const first = usePriority ? pickPriorityByPattern(src, finisherCount, { exclude: used, seed: (input.seed ?? input.minutes) + 7, conditioningFirst: flow }) : [];
        const ex = new Set([...used, ...first.map((e) => e.id)]);
        const more = usePriority ? orderedPriority(src).filter((e) => !ex.has(e.id)).slice(0, finisherCount - first.length) : [];
        more.forEach((e) => ex.add(e.id));
        const prioMain = usePriority ? new Set(orderedPriority(mainPicks).map((e) => e.id)) : new Set<string>();
        const reuse = mainPicks.filter((e) => prioMain.has(e.id)).slice(0, Math.max(0, finisherCount - first.length - more.length));
        const got = [...first, ...more, ...reuse];
        const picks = got.length >= finisherCount ? got : [...got, ...pickBalanced(src, finisherCount - got.length, { exclude: ex })];
        return flowGroup(fillFromLegalPool(picks, src, finisherCount), src, input, new Set([...used, ...mainPicks.map((e) => e.id)]));
      })();
  finisherPicks.forEach((e) => used.add(e.id));

  const seed = input.seed ?? (mainPicks[0]?.id.length ?? 5) * 31 + input.minutes;

  // §21 — activation is DERIVED from the main block that was just built: the
  // prep vocabulary is narrowed to the dominant region of the chosen main
  // exercises before anything is picked, so irrelevant prep is never offered.
  const mainRegion = dominantRegion(mainPicks);
  const derivedActivationPool = (input.activationPool ?? []).filter((e) => {
    if (mainRegion === "full") return true;
    const r = regionOf(e);
    return (
      r === mainRegion ||
      r === "full" ||
      (mainRegion === "lower" && r === "core") ||
      (mainRegion === "core" && r === "lower")
    );
  });
  const relevantActivationPool =
    derivedActivationPool.length >= 4 ? derivedActivationPool : (input.activationPool ?? []);

  const activationPicks = (relevantActivationPool.length
    ? pickPrep(relevantActivationPool, 4, seed)
    : pickBalanced(library, 4, {
        filter: (e) =>
          isBodyweight(e) &&
          prepAllowed(e.name, "activation") &&
          (e.difficulty ?? "").toLowerCase() !== "advanced",
      })) as PoolExercise[];

  const cooldownPicks = (input.cooldownPool?.length
    ? pickPrep(input.cooldownPool, 3, seed + 17)
    : pickBalanced(library, 3, {
        filter: (e) => isBodyweight(e) && STRETCH_RE.test(e.name),
      })) as PoolExercise[];

  const blocks: string[] = [];

  if (!isMicro) {
    blocks.push(heading("🧽", "Soft Tissue Preparation"));
    SOFT_TISSUE.forEach((line) => blocks.push(li(line)));
  }

  // Micro Workout is one coherent block: no activation, no cool-down section.
  if (!isMicro) {
    blocks.push(heading("🔥", "Activation 5'"));
    if (activationPicks.length >= 3) {
      activationPicks.forEach((e) => blocks.push(li(`${isTimedPosition(e.name) ? "30 sec" : "8 reps"} ${token(e)} — slow and controlled`)));
    } else {
      ACTIVATION_FALLBACK.forEach((line) => blocks.push(li(line)));
    }
  }

  const protocolLine = roundsFor(input.format, input.minutes, mainPicks.length);
  blocks.push(heading("💪", `Main Workout (${input.format})`));
  if (protocolLine) blocks.push(para(protocolLine));
  const planned = (d: SessionPlan["main"], e: PoolExercise) => {
    // Bodyweight strength work needs more reps than a loaded lift to be a real stimulus.
    const reps = isBodyweight(e) ? Math.max(d.reps?.[1] ?? 10, 10) : (d.reps?.[0] ?? 10);
    // Fit the sets to the advertised training time (real work per set plus rest).
    const work = isTimedPosition(e.name) ? (d.seconds?.[0] ?? 30) : reps * 3;
    const blocks = Math.max(1, mainCount + (noFinisher ? 0 : finisherCount * 0.6));
    const fit = Math.floor((input.minutes * 60) / (blocks * (work + d.restSec[0])));
    const sets = Math.max(2, Math.min(d.sets[1], fit));
    const unit = isTimedPosition(e.name) ? `${d.seconds?.[0] ?? 30} sec` : `${reps} reps`;
    return `${sets} sets × ${unit} ${token(e)} — Rest ${d.restSec[0]} sec between sets. ${d.tempo[0]!.toUpperCase()}${d.tempo.slice(1)}.`;
  };
  mainPicks.forEach((e, i) => {
    if (input.format === "REPS & SETS" && input.plan) return void blocks.push(li(planned(input.plan.main, e)));
    const dose = doseFor(input.format, input.level, i, input.category === "RECOVERY" || input.category === "MOBILITY & STABILITY");
    const text = isTimedPosition(e.name) && /reps/.test(dose.text) ? dose.text.replace(/\d+ reps/, "30 sec") : dose.text;
    blocks.push(li(`${text} ${token(e)}${dose.protocol ? ` — ${dose.protocol}` : ""}`));
  });

  if (finisherPicks.length) {
    const lifting = input.category === "STRENGTH" || input.category === "MUSCLE BUILDING";
    if (lifting && input.plan?.finisher) {
      // Complementary accessory work on the same objective — never a second workout, never cardio.
      blocks.push(heading("⚡", "Finisher (Accessory)"));
      finisherPicks.forEach((e) => blocks.push(li(planned(input.plan!.finisher!, e))));
    } else {
      blocks.push(heading("⚡", "Finisher (For Time)"));
      blocks.push(para("2 rounds for time. Move well, keep breathing, stop if form breaks."));
      finisherPicks.forEach((e) => blocks.push(li(`${isTimedPosition(e.name) ? "30 sec" : "10 reps"} ${token(e)}`)));
    }
  }

  if (!isMicro) {
  blocks.push(heading("🧘", "Cool Down"));
  if (cooldownPicks.length >= 3) {
    cooldownPicks.forEach((e) => blocks.push(li(`45 sec ${token(e)} — breathe out into the position`)));
    blocks.push(li(COOLDOWN_FALLBACK[2]!));
  } else {
    COOLDOWN_FALLBACK.forEach((line) => blocks.push(li(line)));
  }
  }


  const seedWord = NAME_LEFT[(mainPicks[0]?.id.length ?? 3) % NAME_LEFT.length]!;
  const name = `${seedWord} ${NAME_RIGHT[input.category] ?? "Session"}`;

  return { html: blocks.join(para("")), name, blocks };
}

export function packCopy(input: PackInput): {
  description_html: string;
  instructions_html: string;
  tips_html: string;
} {
  return {
    description_html: para(
      `A ${input.level === "all" ? "mixed" : input.level} ${input.category.toLowerCase()} session built to your available equipment and today's time budget. Straightforward work, no wasted minutes.`,
    ),
    instructions_html: para(
      `Work through the sections in order: soft tissue, activation, main workout, finisher, cool down. Respect the prescribed dose before each exercise and keep the rest honest.`,
    ),
    tips_html: [
      para("Set up before you start so you are not hunting for equipment mid-session."),
      para("Quality of movement beats speed — slow down before technique breaks."),
      para("Stop and reassess if you feel sharp pain, dizziness or chest tightness."),
    ].join(""),
  };
}
