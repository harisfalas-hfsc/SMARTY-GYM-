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
