import type { ExportRitual } from "./ritual-export";
import { embeddedHtml, htmlDocument, type HtmlExportFile } from "./standalone-html";

const phases = [
  { key: "morning_content", title: "Morning Ritual", time: "~8:00 AM • Start Strong", icon: "🌅" },
  { key: "midday_content", title: "Midday Ritual", time: "~1:00 PM • Reset & Reload", icon: "☀️" },
  { key: "evening_content", title: "Evening Ritual", time: "~8:00 PM • Unwind & Recover", icon: "🌙" },
] as const;

export async function ritualHtmlFile(ritual: ExportRitual, embed: (src: string) => Promise<string>): Promise<HtmlExportFile> {
  const sections = await Promise.all(phases.map(async phase => `<section class="phase"><div class="phase-heading"><span class="phase-icon">${phase.icon}</span><div><h2>${phase.title}</h2><p class="muted">${phase.time}</p></div></div><div class="workout-html">${await embeddedHtml(ritual[phase.key], embed)}</div></section>`));
  const title = `Daily Smarty Ritual ${ritual.number}`;
  return { name: `smarty-ritual-${ritual.number}.html`, html: htmlDocument(title, `<header><p class="eyebrow">Smarty Ritual</p><h1>${title}</h1><p class="muted">Designed by HARIS FALAS</p></header><article class="panel">${sections.join("")}</article>`) };
}