import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import type { CoachRequest } from "@/lib/coach.functions";

const STORAGE_KEY = "smartygym:local-workouts";

const CATEGORY: Record<string, string> = {
  strength: "STRENGTH",
  muscle: "MUSCLE BUILDING",
  calorie: "CALORIE BURNING",
  cardio: "CARDIO",
  metabolic: "METABOLIC",
  challenge: "CHALLENGE",
  mobility: "MOBILITY & STABILITY",
  pilates: "PILATES",
};

type LocalWorkout = WorkoutRow & {
  created_at: string;
  completed_at: string | null;
  scheduled_at: string | null;
  mood: string | null;
  is_wod: boolean;
  workout_feedback: [];
};

function read(): LocalWorkout[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as LocalWorkout[]) : [];
  } catch {
    return [];
  }
}

function write(rows: LocalWorkout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function getLocalWorkouts() {
  return read();
}

export function getLocalWorkout(id: string) {
  return read().find((row) => row.id === id) ?? null;
}

export function updateLocalWorkout(id: string, patch: Partial<LocalWorkout>) {
  const rows = read().map((row) => (row.id === id ? { ...row, ...patch } : row));
  write(rows);
}

export function createLocalWorkout(request: CoachRequest): LocalWorkout {
  const minutes = Math.max(5, Math.min(90, Number(request.minutes) || 30));
  const category = CATEGORY[String(request.goal ?? "strength")] ?? "STRENGTH";
  const stars = request.level === "advanced" ? 3 : request.level === "beginner" ? 1 : 2;
  const lowImpact = ["tired", "stressed", "sore", "low"].includes(String(request.mood));
  const rounds = minutes <= 15 ? 2 : minutes <= 35 ? 3 : 4;
  const equipment = request.equipment?.length ? request.equipment : ["bodyweight"];
  const bodyweight = equipment.length === 1 && equipment[0] === "bodyweight";
  const push = bodyweight ? "Incline or floor push-ups" : "Dumbbell or machine chest press";
  const pull = bodyweight ? "Prone swimmers" : "One-arm dumbbell or cable row";
  const hinge = bodyweight ? "Glute bridges" : "Romanian deadlift";
  const finisher = lowImpact ? "Easy marching in place" : "Mountain climbers";
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const focus = request.focus ? String(request.focus) : "Full body";
  const title = `${focus.replace(/&/g, "and")} ${category === "STRENGTH" ? "Strength" : "Training"}`;
  const main = [
    "<h2>Warm-up</h2>",
    "<ul><li>Easy march or cycle — 2 minutes</li><li>Arm circles — 10 each way</li><li>Bodyweight good mornings — 12 reps</li></ul>",
    "<h2>Activation</h2>",
    "<ul><li>Dead bug — 2 sets × 8 each side</li><li>Slow bodyweight squat — 2 sets × 10</li></ul>",
    `<h2>Main Workout</h2><p>Complete ${rounds} controlled rounds. Rest 60–90 seconds between rounds.</p>`,
    `<ol><li>${push} — 8–12 reps</li><li>${pull} — 10–12 reps each side</li><li>${hinge} — 10–15 reps</li><li>Reverse lunges — 8–10 each side</li><li>Front plank — 25–40 seconds</li></ol>`,
    "<h2>Finisher</h2>",
    `<p>${finisher} — 4 rounds of 30 seconds work and 30 seconds easy recovery.</p>`,
    "<h2>Cool Down</h2>",
    "<ul><li>Hip-flexor stretch — 30 seconds each side</li><li>Chest stretch — 30 seconds each side</li><li>Slow breathing — 5 deep breaths</li></ul>",
  ].join("");

  const workout: LocalWorkout = {
    id,
    name: title,
    category,
    format: "ROUNDS",
    focus,
    difficulty_stars: stars,
    difficulty_label: stars === 1 ? "Beginner" : stars === 3 ? "Advanced" : "Intermediate",
    duration_min: minutes,
    duration_label: `${minutes} min`,
    equipment,
    location: request.location ?? "anywhere",
    image_url: null,
    description_html: `<p>A balanced ${minutes}-minute session adapted to your goal, energy and available equipment.</p>`,
    instructions_html: "<p>Move with control and stop if you feel sharp pain, dizziness or unusual shortness of breath.</p>",
    tips_html: "<p>Choose a load that leaves one or two good repetitions in reserve. Quality comes before speed.</p>",
    main_workout: main,
    created_by: "smarty_coach",
    coach_rationale: ["Built from your selected goal, time, location, equipment and current energy."],
    is_favorite: false,
    rating: null,
    status: "created",
    created_at: now,
    completed_at: null,
    scheduled_at: null,
    mood: request.mood ?? null,
    is_wod: false,
    workout_feedback: [],
  };
  write([workout, ...read()]);
  return workout;
}