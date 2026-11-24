// Pure builder for member-built workouts. Uses the same section HTML the player already reads.
export const MANUAL_CATEGORY = "MY OWN WORKOUT";

export type ManualItem = { id: string; name: string; dose: string };
export type ManualSections = {
  activation: ManualItem[];
  main: ManualItem[];
  finisher: ManualItem[];
  cooldown: ManualItem[];
};

const HEADINGS: [keyof ManualSections, string][] = [
  ["activation", "🔥 <strong><u>Activation</u></strong>"],
  ["main", "💪 <strong><u>Main Workout</u></strong>"],
  ["finisher", "⚡ <strong><u>Finisher</u></strong>"],
  ["cooldown", "🧘 <strong><u>Cool Down</u></strong>"],
];

const esc = (s: string) =>
  s.replace(/[&<>"{}]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "{": "", "}": "" })[c]!);

export function buildManualWorkoutHtml(sections: ManualSections): string {
  const out: string[] = [];
  for (const [key, heading] of HEADINGS) {
    const list = sections[key];
    if (!list.length) continue;
    out.push(`<p class="tiptap-paragraph">${heading}</p><p class="tiptap-paragraph"></p>`);
    for (const ex of list) {
      const name = ex.name.replace(/[{}:]/g, " ").trim();
      const dose = esc(ex.dose.trim());
      out.push(
        `<ul class="tiptap-bullet-list"><li class="tiptap-list-item"><p class="tiptap-paragraph">${dose ? dose + " " : ""}{{exercise:${ex.id}:${name}}}</p></li></ul>`,
      );
    }
    out.push(`<p class="tiptap-paragraph"></p>`);
  }
  return out.join("");
}

/**
 * Section structure every member-built workout must have: Activation (≥2),
 * Main Workout (≥3) and Cool Down (≥2), Finisher optional, and no exercise in
 * two sections. Shared by the builder screen and the server save.
 */
export const MANUAL_MINIMUMS = { activation: 2, main: 3, cooldown: 2 } as const;
const SECTION_LABEL: Record<keyof ManualSections, string> = {
  activation: "Activation",
  main: "Main Workout",
  finisher: "Finisher",
  cooldown: "Cool Down",
};

export function manualStructureIssues(sections: { [K in keyof ManualSections]: { id: string }[] }): string[] {
  const issues: string[] = [];
  for (const [key, min] of Object.entries(MANUAL_MINIMUMS) as [keyof typeof MANUAL_MINIMUMS, number][]) {
    if (sections[key].length < min) issues.push(`Add at least ${min} exercises to the ${SECTION_LABEL[key]}.`);
  }
  const seen = new Map<string, keyof ManualSections>();
  for (const key of Object.keys(SECTION_LABEL) as (keyof ManualSections)[]) {
    for (const e of sections[key]) {
      const first = seen.get(e.id);
      if (first && first !== key) {
        issues.push(`The same exercise can't be in both the ${SECTION_LABEL[first]} and the ${SECTION_LABEL[key]}.`);
        return issues;
      }
      if (first === key) {
        issues.push(`The same exercise appears twice in the ${SECTION_LABEL[key]}.`);
        return issues;
      }
      seen.set(e.id, key);
    }
  }
  return issues;
}
