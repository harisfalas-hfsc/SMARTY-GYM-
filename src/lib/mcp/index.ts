import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchExercises from "./tools/search-exercises";
import listMyWorkouts from "./tools/list-my-workouts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";
export default defineMcp({
  name: "smarty-gym",
  title: "SMARTY GYM",
  version: "0.1.0",
  instructions: "Read exercise-library guidance and your own saved workout summaries. Account permissions and active membership still apply. These tools never edit workouts or training history.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated" }),
  tools: [searchExercises, listMyWorkouts],
});