// Export rituals to Word (.doc) or PDF (browser print → Save as PDF), keeping
// the original HTML, emojis and spacing exactly as they appear.

export type ExportRitual = {
  number: number;
  morning_content: string;
  midday_content: string;
  evening_content: string;
};

const STYLE = `
  body { font-family: -apple-system, "Segoe UI", Roboto, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Arial, sans-serif; color: #111; line-height: 1.5; font-size: 12pt; margin: 24px; }
  h1 { font-size: 20pt; margin: 0 0 4px; }
  h2 { font-size: 15pt; margin: 18px 0 6px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0 6px 22px; padding: 0; }
  li { margin: 2px 0; }
  a { color: #0e7490; }
  .ritual { page-break-after: always; }
  .ritual:last-child { page-break-after: auto; }
  .sub { color: #555; font-size: 10pt; margin: 0 0 8px; }
`;

function body(rituals: ExportRitual[]) {
  return rituals
    .map(
      (r) => `<div class="ritual">
  <h1>Daily Smarty Ritual ${r.number}</h1>
  <p class="sub">SmartyGym · Designed by Haris Falas</p>
  <h2>🌅 Morning Ritual</h2><p class="sub">~8:00 AM • Start Strong</p>${r.morning_content}
  <h2>☀️ Midday Ritual</h2><p class="sub">~1:00 PM • Reset &amp; Reload</p>${r.midday_content}
  <h2>🌙 Evening Ritual</h2><p class="sub">~8:00 PM • Unwind &amp; Recover</p>${r.evening_content}
</div>`,
    )
    .join("\n");
}

function doc(title: string, rituals: ExportRitual[]) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${STYLE}</style></head><body>${body(rituals)}</body></html>`;
}

export function exportWord(rituals: ExportRitual[], filename: string) {
  const html = doc(filename, rituals);
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportPdf(rituals: ExportRitual[], filename: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(doc(filename, rituals));
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  }, 600);
  return true;
}
