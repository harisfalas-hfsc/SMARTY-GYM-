import { stateForScore } from "./readiness";

/** Visual bands follow the existing readiness states, never change coaching rules. */
export function readinessBand(score: number | null | undefined): "low" | "moderate" | "ready" | "uncalibrated" {
  if (score == null || !Number.isFinite(score)) return "uncalibrated";
  const state = stateForScore(score);
  return state === "Ready" ? "ready" : state === "Moderate" ? "moderate" : "low";
}

export function readinessTone(score: number | null | undefined) {
  switch (readinessBand(score)) {
    case "low": return "text-readiness-low border-readiness-low";
    case "moderate": return "text-readiness-moderate border-readiness-moderate";
    case "ready": return "text-readiness-ready border-readiness-ready";
    default: return "text-muted-foreground border-border";
  }
}