export type ExportExercise = {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target_muscle: string | null;
  secondary_muscles: string[] | null;
  difficulty: string | null;
  description: string | null;
  instructions: string[] | null;
  gif_path: string | null;
};

export function exerciseFilename(ex: Pick<ExportExercise, "id" | "name">) {
  return `${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "exercise"}-${ex.id}`;
}

export function exerciseFacts(ex: ExportExercise): [string, string][] {
  return [
    ["Body part", ex.body_part], ["Target", ex.target_muscle],
    ["Equipment", ex.equipment], ["Level", ex.difficulty],
    ["Secondary muscles", ex.secondary_muscles?.join(", ")],
  ].flatMap(([label, value]) => label && value ? [[label, value] as [string, string]] : []);
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));

export async function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare the demonstration."));
    reader.readAsDataURL(blob);
  });
}

export function exerciseHtml(ex: ExportExercise, media: string | null, colors: { background: string; foreground: string; primary: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(ex.name)} | SmartyGym</title><style>
  :root{--paper:${colors.background};--ink:${colors.foreground};--accent:${colors.primary}}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Arial,sans-serif}article{max-width:720px;margin:auto;padding:24px}img{display:block;width:100%;max-height:320px;object-fit:contain}h1{line-height:1.2;text-transform:capitalize}dl{display:grid;grid-template-columns:1fr 1fr;gap:12px}dl div,section{border:2px solid var(--accent);border-radius:8px;padding:12px;margin-bottom:12px}dt,h2{font-size:12px;color:var(--accent);text-transform:uppercase}dd{margin:0;text-transform:capitalize}li{margin-bottom:8px}footer{border-top:2px solid var(--accent);padding-top:16px;text-align:center;font-size:12px}@page{size:A4;margin:12mm}@media print{article{padding:0}section,li{break-inside:avoid}body{print-color-adjust:exact}}
  </style></head><body><article>${media ? `<img src="${media}" alt="${escapeHtml(ex.name)} demonstration">` : ""}<h1>${escapeHtml(ex.name)}</h1><dl>${exerciseFacts(ex).map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${ex.description ? `<section>${escapeHtml(ex.description)}</section>` : ""}${ex.instructions?.length ? `<section><h2>How to perform</h2><ol>${ex.instructions.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol></section>` : ""}<footer>SMARTYGYM<br>Your Gym Re-imagined. Anywhere, Anytime.<br>smartygym.com</footer></article></body></html>`;
}

export async function deliverExerciseFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exercisePdf(ex: ExportExercise, image: string | null, primary: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = 18;
  const text = (value: string, size = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, 178) as string[];
    for (const line of lines) {
      if (y > 276) { doc.addPage(); y = 18; }
      doc.text(line, 16, y);
      y += size * 0.5;
    }
    y += 3;
  };
  if (image) {
    const props = doc.getImageProperties(image);
    const height = Math.min(76, 178 * props.height / props.width);
    const width = height * props.width / props.height;
    doc.addImage(image, "PNG", (210 - width) / 2, y, width, height);
    y += height + 8;
  }
  text(ex.name, 17, true);
  exerciseFacts(ex).forEach(([label, value]) => text(`${label}: ${value}`));
  if (ex.description) text(ex.description);
  if (ex.instructions?.length) {
    text("How to perform", 11, true);
    ex.instructions.forEach((step, index) => text(`${index + 1}. ${step}`));
  }
  // Resolve the theme color through canvas: jsPDF cannot parse oklch tokens.
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) { ctx.fillStyle = primary; ctx.fillRect(0, 0, 1, 1); const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data; doc.setDrawColor(r ?? 0, g ?? 0, b ?? 0); }
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i); doc.line(16, 285, 194, 285); doc.setFontSize(8);
    doc.text(`SMARTYGYM | smartygym.com | ${i}/${doc.getNumberOfPages()}`, 105, 291, { align: "center" });
  }
  return doc.output("blob");
}