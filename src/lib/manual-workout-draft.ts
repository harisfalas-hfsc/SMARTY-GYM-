// Browser-only draft for "Build It Yourself" workouts. Kept until the member creates the workout.
export type DraftSection = "activation" | "main" | "finisher" | "cooldown";
export type DraftExercise = { key: string; id: string; name: string; dose: string };
export type ManualDraft = { name: string; sections: Record<DraftSection, DraftExercise[]> };

export const DRAFT_SECTIONS: { id: DraftSection; label: string; defaultDose: string }[] = [
  { id: "activation", label: "Activation", defaultDose: "10 reps" },
  { id: "main", label: "Main Workout", defaultDose: "3 × 10 reps" },
  { id: "finisher", label: "Finisher", defaultDose: "30 sec" },
  { id: "cooldown", label: "Cool Down", defaultDose: "30 sec" },
];

const KEY = "smarty:manual-workout-draft";
const EVENT = "smarty:manual-draft";

export function emptyDraft(): ManualDraft {
  return { name: "", sections: { activation: [], main: [], finisher: [], cooldown: [] } };
}

export function loadDraft(): ManualDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDraft();
    const d = JSON.parse(raw) as ManualDraft;
    return { ...emptyDraft(), ...d, sections: { ...emptyDraft().sections, ...d.sections } };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(d: ManualDraft) {
  localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event(EVENT));
}

export function clearDraft() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function addToDraft(section: DraftSection, ex: { id: string; name: string }) {
  const d = loadDraft();
  const dose = DRAFT_SECTIONS.find((s) => s.id === section)!.defaultDose;
  d.sections[section].push({ key: `${ex.id}-${Date.now()}`, id: ex.id, name: ex.name, dose });
  saveDraft(d);
}

/** Removes the most recently added copy of an exercise from one section. */
export function removeFromDraft(section: DraftSection, id: string) {
  const d = loadDraft();
  const list = d.sections[section];
  const idx = list.map((x) => x.id).lastIndexOf(id);
  if (idx < 0) return;
  list.splice(idx, 1);
  saveDraft(d);
}

export function isDraftSection(v: unknown): v is DraftSection {
  return v === "activation" || v === "main" || v === "finisher" || v === "cooldown";
}

export function draftCount(d: ManualDraft) {
  return Object.values(d.sections).reduce((n, s) => n + s.length, 0);
}

export const DRAFT_EVENT = EVENT;
