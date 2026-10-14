// No exercise repeated across sections (Coach Haris, 14 Oct 2026): the same
// exercise — or a variant of the same movement ("inchworm" / "inchworm v. 2") —
// may appear only once across Activation, Main Workout and Finisher. Cool Down
// stretches are exempt. Pure; used by the publish gate, audits and the
// member/coach generator's final check.
import { parseWorkoutSteps } from "./parse-steps";
import { movementKey } from "./member-quality";

const SECTION: Record<string, "Activation" | "Main Workout" | "Finisher"> = {
  Activation: "Activation", "Warm-up": "Activation", "Main Workout": "Main Workout", Finisher: "Finisher",
};

export type SectionRepeat = { name: string; exerciseId: string; first: string; again: string };

/** Exercises that appear in a later section after already appearing in an earlier one (or twice in the Main/Finisher sequence across sections). */
export function crossSectionRepeats(html: string, nameOf: (id: string, fallback: string) => string = (_i, f) => f, focus?: string | null): SectionRepeat[] {
  const seen = new Map<string, string>();
  const out: SectionRepeat[] = [];
  for (const s of parseWorkoutSteps(html)) {
    const sec = SECTION[s.section];
    if (!sec) continue;
    const name = nameOf(s.exerciseId, s.name);
    const key = movementKey(name, focus);
    if (!key) continue;
    const first = seen.get(key);
    if (first && first !== sec) out.push({ name, exerciseId: s.exerciseId, first, again: sec });
    else if (!first) seen.set(key, sec);
  }
  return out;
}
