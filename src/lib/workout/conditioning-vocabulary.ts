// THE SmartyGym conditioning exercise selection (set by Haris Falas).
// CALORIE BURNING, CARDIO, METABOLIC and CHALLENGE Main Workout and Finisher
// draw ONLY from these 60 exercises (30 bodyweight + 30 equipment). Activation
// and Cool Down keep their own prep vocabulary. Other categories are unaffected.
// Read by rules.ts, so pool, validator, admin publish gate and audit agree.
import type { Category } from "./spec";

export const CONDITIONING_LIST_CATEGORIES: Category[] = ["CALORIE BURNING", "CARDIO", "METABOLIC", "CHALLENGE"];

export const CONDITIONING_EXERCISES: ReadonlyArray<string> = [
  "Burpee",
  "Jack Burpee",
  "High Knees",
  "Jumping Jack",
  "Mountain Climber",
  "Skater Hops",
  "Butt Kicks",
  "Quick Feet v. 2",
  "Scissor Jumps",
  "Semi Squat Jump (Male)",
  "Jump Squat",
  "Jump Squat v. 2",
  "Star Jump (Male)",
  "Astride Jumps (Male)",
  "Broad Jump",
  "Lateral Bound",
  "Lunge With Jump",
  "Tuck Jump",
  "Push to Run",
  "Walking High Knees Lunge",
  "Ski Step",
  "Back and Forth Step",
  "Short Stride Run",
  "Run",
  "Wind Sprints",
  "Bear Crawl",
  "Wheel Run",
  "Inchworm",
  "Clap Push Up",
  "Plyo Push Up",
  "Kettlebell Swing",
  "Kettlebell Goblet Squat",
  "Kettlebell Front Squat",
  "Kettlebell Thruster",
  "Kettlebell One Arm Push Press",
  "Kettlebell Double Push Press",
  "Kettlebell One Arm Clean and Jerk",
  "Kettlebell Two Arm Clean",
  "Kettlebell Alternating Hang Clean",
  "Kettlebell Hang Clean",
  "Kettlebell One Arm Snatch",
  "Kettlebell Double Snatch",
  "Kettlebell Sumo High Pull",
  "Kettlebell Lunge Pass Through",
  "Dumbbell Burpee",
  "Dumbbell Clean",
  "Dumbbell Push Press",
  "Dumbbell Plyo Squat",
  "Farmer's Carry",
  "Farmers Walk",
  "Barbell Thruster",
  "Barbell Clean and Press",
  "Barbell Jump Squat",
  "Barbell Squat Jump Step Rear Lunge",
  "Medicine Ball Overhead Slam",
  "One Arm Slam (with Medicine Ball)",
  "Medicine Ball Catch and Overhead Throw",
  "Battling Ropes",
  "Jump Rope",
  "Swing 360",
  // Added by Haris Falas (2026-10-04): approved library suggestions.
  "Kettlebell Double Alternating Hang Clean",
  "Barbell Front Chest Squat",
  "Dumbbell Lunge with Bicep Curl",
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const NAMES = new Set(CONDITIONING_EXERCISES.map(norm));

export const isConditioningListCategory = (c: Category) => CONDITIONING_LIST_CATEGORIES.includes(c);
/** True only for exercises on the SmartyGym conditioning list. */
export const isConditioningListExercise = (e: { name: string }) => NAMES.has(norm(e.name));
