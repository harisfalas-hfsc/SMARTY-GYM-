import { parsePlanned, type StepTracking } from "./tracking-model";
import type { PlayerSlide } from "./parse-steps";

export function playerLogStepIndex(slide: PlayerSlide): number | null {
  return slide.kind === "exercise" ? slide.stepIndex : null;
}

/** Rest comes from the prescription, never a player-wide default. */
export function prescribedRestSeconds(prescription: string): number {
  const match = prescription.match(/\brest\s*(?:[:—–-]\s*)?(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m)\b/i);
  if (!match) return 0;
  return Math.round(Number(match[1]) * (/^m/i.test(match[2] ?? "") ? 60 : 1));
}

export function playerSetTarget(prescription: string, tracking: StepTracking | null): number {
  return tracking?.roundsTotal ?? parsePlanned(prescription).sets ?? 1;
}

export function afterPlayerSet(input: { logged: number; target: number; restSeconds: number }) {
  return {
    nextExercise: input.logged >= input.target,
    restSeconds: input.restSeconds,
  };
}