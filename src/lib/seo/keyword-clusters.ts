/** Internal intent map, never dumped verbatim into HTML or AI-readable files. */
import { PAGE_KEYWORDS } from "./page-keywords";
import { TRAINING_TOPICS } from "./training-topics";

const clusters: Record<string, string[]> = {
  brand: ["SmartyGym", "Smarty Gym", "SmartyGym workouts", "SmartyGym app", "Smarty Coach", "Haris Falas SmartyGym"],
  commercial: ["online gym", "online fitness platform", "online fitness coach", "online workout app", "digital gym", "fitness training app"],
  personalized: ["personalized workout", "custom workout", "workout planner", "personalized training plan", "adaptive workout"],
  home: ["home workouts", "home strength training", "home cardio workout", "bodyweight workout at home", "hotel workout", "travel workout"],
  gym: ["gym workout plan", "gym strength workout", "weight training workout", "dumbbell gym workout", "barbell workout"],
  strength: ["strength training", "functional strength training", "full body strength workout", "upper body strength workout", "lower body strength workout"],
  hypertrophy: ["muscle building workout", "hypertrophy workout", "hypertrophy training", "progressive overload workout"],
  fatLoss: ["fat loss workout", "calorie burning workout", "conditioning for fat loss", "strength training for fat loss"],
  cardio: ["cardio workout", "cardio endurance", "aerobic training", "cardio conditioning"],
  conditioning: ["HIIT workout", "metabolic conditioning", "circuit workout", "interval training"],
  formats: ["AMRAP workout", "EMOM workout", "Tabata workout", "For Time workout", "rounds tracker", "workout timer"],
  mobility: ["mobility workout", "stability training", "dynamic warm up", "active recovery", "cool down routine"],
  bodyweight: ["bodyweight workout", "bodyweight exercises", "no equipment workout", "bodyweight strength"],
  library: ["exercise library", "exercise demonstrations", "exercise instructions", "exercise GIFs", "exercises by equipment"],
  programs: ["training programs", "structured workout program", "progressive training program"],
  tools: ["one rep max calculator", "interval timer", "AMRAP counter", "rounds tracker"],
  community: ["shared workouts", "community workouts", "member workout rankings"],
  guides: TRAINING_TOPICS.map((t) => t.h1),
  competitorIntent: ["Freeletics alternative", "Peloton alternative", "Nike Training Club alternative", "Fitness Blender alternative", "Fitbod alternative", "Centr alternative", "Future fitness alternative", "Apple Fitness+ alternative", "SmartGym alternative"],
};

export const KEYWORD_CLUSTERS = clusters;
export const MASTER_PHRASES = [...new Set([...Object.values(PAGE_KEYWORDS).flat(), ...Object.values(clusters).flat()].map((s) => s.trim().toLowerCase()).filter(Boolean))].sort();

/** Potential opportunities, not claims about other companies or comparative rankings. */
export const COMPETITOR_TOPIC_GAPS = Object.freeze({
  Freeletics: ["bodyweight training", "programmed strength"],
  Peloton: ["equipment-flexible training", "strength workouts"],
  "Nike Training Club": ["training guides", "exercise library"],
  "Fitness Blender": ["personalized workout builder", "training logbook"],
  Fitbod: ["ready-made workouts", "Workout of the Day"],
  Centr: ["exercise demonstrations", "workout formats"],
  Future: ["self-directed training tools", "bodyweight sessions"],
  "Apple Fitness+": ["browser-based workouts", "equipment selection"],
  "SmartGym / Smart Gym": ["clear SmartyGym founder and domain identity"],
});