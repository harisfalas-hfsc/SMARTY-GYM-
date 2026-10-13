// Training Profile "Injuries & limitations" — deterministic exercise exclusions.
// Each limitation removes the movements that load the affected area or condition,
// from the main pool AND from Activation / Cool Down. Pure, client-safe.

import { LIMITATIONS } from "@/lib/coach-options";

export const LIMITATION_RULES: Record<string, RegExp> = {
  lower_back:
    /\b(deadlift|good ?morning|back extension|hyperextension|superman|sit-?ups?|v-?ups?|jackknife|toes[- ]to[- ]bar|russian twist|bent[- ]over (barbell )?row|barbell row|snatch|clean|jerk|burpee|back squat|swing)\b/i,
  neck: /\b(neck|shrug|headstand|crunch|sit-?ups?|v-?ups?|behind[- ]the[- ]neck|wrestler)\b/i,
  shoulder:
    /\b(overhead|military|shoulder press|push press|snatch|jerk|handstand|pike push|dips?|upright row|behind[- ]the[- ]neck|arnold|pull-?ups?|chin-?ups?|muscle-?up|kipping|thruster|wall ball)\b/i,
  elbow: /\b(dips?|skull ?crusher|triceps? extension|close[- ]grip|diamond push|french press|chin-?ups?|muscle-?up)\b/i,
  wrist:
    /\b(push-?ups?|pushups?|plank|handstand|burpee|front squat|clean|snatch|crawl|mountain climber|wrist|pike push|dips?)\b/i,
  hip: /\b(pistol|cossack|jump|jumping|bound|plyo|leap|sumo|deep squat|skater)\b/i,
  knee:
    /\b(jump|jumping|pistol|lunges?|bulgarian|split squat|step-?ups?|box|skater|sprint|deep squat|leg extension|sissy|hop|hopping|bound|burpee|tuck jump)\b/i,
  ankle: /\b(jump|jumping|hop|hopping|skip|skipping|bound|sprint|run|running|skater|burpee|jacks?|jump rope)\b/i,
  hernia:
    /\b(deadlift|crunch|sit-?ups?|v-?ups?|leg raise|jackknife|good ?morning|back squat|barbell squat|toes[- ]to[- ]bar|russian twist|clean|snatch)\b/i,
  pregnancy:
    /\b(crunch|sit-?ups?|v-?ups?|jackknife|russian twist|jump|jumping|burpee|plyo|sprint|leg raise|plank jack|mountain climber|lying|supine|prone|deadlift|snatch|clean)\b/i,
  high_bp: /\b(handstand|headstand|inverted|burpee|sprint|wall sit|max|deadlift|leg press)\b/i,
  asthma: /\b(sprint|burpee|jump rope|battle rope|assault bike|air bike|shuttle|tuck jump)\b/i,
};

/** Ids of the member's limitations that the engine knows how to respect. */
export function knownLimitations(ids: readonly string[] | null | undefined): string[] {
  return (ids ?? []).filter((id) => id in LIMITATION_RULES);
}

/** True when the exercise name conflicts with any of the given limitations. */
export function conflictsWithLimitations(name: string, ids: readonly string[]): boolean {
  return ids.some((id) => LIMITATION_RULES[id]?.test(name));
}

export function limitationLabel(id: string): string {
  return LIMITATIONS.find((l) => l.id === id)?.label ?? id;
}
