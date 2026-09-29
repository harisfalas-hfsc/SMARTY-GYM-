import { Activity, Dumbbell, Flame, Flower2, HeartPulse, Move3d, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { SMARTY_WORKOUT_CATEGORIES } from "@/lib/smarty-workouts.functions";
import strengthImage from "@/assets/smarty-workout-categories/strength.jpg";
import muscleImage from "@/assets/smarty-workout-categories/muscle-building-realistic.jpg";
import calorieImage from "@/assets/smarty-workout-categories/calorie-burning.jpg";
import cardioImage from "@/assets/smarty-workout-categories/cardio.jpg";
import metabolicImage from "@/assets/smarty-workout-categories/metabolic-grounded.jpg";
import challengeImage from "@/assets/smarty-workout-categories/challenge-realistic.jpg";
import mobilityImage from "@/assets/smarty-workout-categories/mobility-stability-realistic.jpg";
import pilatesImage from "@/assets/smarty-workout-categories/pilates.jpg";

export type SmartyCategory = (typeof SMARTY_WORKOUT_CATEGORIES)[number];

export const CATEGORY_DETAILS: Record<SmartyCategory, { image: string; description: string; Icon: LucideIcon }> = {
  STRENGTH: { image: strengthImage, description: "Build foundational strength, power and muscular endurance with focused resistance training.", Icon: Dumbbell },
  "MUSCLE BUILDING": { image: muscleImage, description: "Develop muscle with purposeful exercises, effective volume and progressive training sessions.", Icon: Activity },
  "CALORIE BURNING": { image: calorieImage, description: "High-energy sessions designed to maximize calorie burn with efficient full-body movement.", Icon: Flame },
  CARDIO: { image: cardioImage, description: "Build cardiovascular endurance, a stronger heart and better everyday stamina.", Icon: HeartPulse },
  METABOLIC: { image: metabolicImage, description: "Dynamic conditioning workouts that challenge your whole body and elevate your work capacity.", Icon: Zap },
  CHALLENGE: { image: challengeImage, description: "Benchmark-style workouts that test your fitness and push you beyond your comfort zone.", Icon: Sparkles },
  "MOBILITY & STABILITY": { image: mobilityImage, description: "Improve joint health, control and movement quality through targeted mobility and stability work.", Icon: Move3d },
  PILATES: { image: pilatesImage, description: "Build core strength, alignment and body awareness through controlled, precise movement.", Icon: Flower2 },
};

export function categorySlug(category: SmartyCategory): string {
  return category.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function categoryFromSlug(slug: string): SmartyCategory | null {
  return SMARTY_WORKOUT_CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}
