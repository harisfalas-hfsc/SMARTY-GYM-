import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import { difficultyLabel } from "./workout/spec";
import { EXERCISE_TOKEN_RE } from "./workout/tokens";
import { createAssetEmbedder, embeddedHtml, escapeHtml, exportTheme } from "./standalone-html";
import { withExportDeadline } from "./export-timing";
export { withExportDeadline } from "./export-timing";

export function workoutDocumentParts(w: WorkoutRow) {
  return [
    { title: "", html: w.description_html },
    { title: "", html: w.main_workout },
    { title: "How to perform this workout", html: w.instructions_html },
    { title: "Coach tips", html: w.tips_html },
  ].filter(part => Boolean(part.html));
}

export async function prepareWorkoutDocument(w: WorkoutRow, embed = createAssetEmbedder()) {
  const host = document.createElement("article");
  host.style.cssText = `${exportTheme()};width:680px;padding:28px;background:var(--card);color:var(--foreground);font:15px/1.65 Arial,sans-serif;box-sizing:border-box`;
  const creator = String(w.created_by ?? "").startsWith("smarty:") ? "HARIS FALAS" : "user_name" in w && typeof w.user_name === "string" ? w.user_name : "User";
  const meta = [w.category, w.format, w.serial ? `#${w.serial}` : null].filter(Boolean).join(" · ");
  host.innerHTML = `<p style="color:var(--primary);font-weight:bold">SMARTYGYM · ${escapeHtml(meta)}</p><h1 style="font-size:30px;line-height:1.2">${escapeHtml(w.name)}</h1>${w.focus ? `<p>${escapeHtml(w.focus)}</p>` : ""}<p>${escapeHtml([w.difficulty_label ?? difficultyLabel(w.difficulty_stars), w.duration_label ?? `${w.duration_min} min`, w.location, w.equipment?.join(", ") || "bodyweight"].filter(Boolean).join(" · "))}</p><p style="border:1px solid var(--border);border-radius:8px;padding:12px">Created by <strong>${escapeHtml(creator)}</strong></p>`;
  if (w.image_url) {
    const image = document.createElement("img");
    image.src = await embed(w.image_url);
    image.alt = `${w.name} cover`;
    image.style.cssText = "width:100%;height:208px;object-fit:cover;border-radius:8px";
    host.append(image);
  }
  for (const part of workoutDocumentParts(w)) {
    const section = document.createElement("section");
    section.style.cssText = "margin-top:20px;border-top:1px solid var(--border);padding-top:16px";
    const html = await embeddedHtml(part.html, embed);
    section.innerHTML = `${part.title ? `<h2>${escapeHtml(part.title)}</h2>` : ""}${html.replace(new RegExp(EXERCISE_TOKEN_RE.source, "g"), (_match, _id, name: string) => `<strong>${escapeHtml(name)}</strong>`)}`;
    host.append(section);
  }
  host.querySelectorAll<HTMLElement>("h2,h3,h4").forEach(el => { el.style.color = "var(--primary)"; el.style.margin = "16px 0 8px"; });
  host.querySelectorAll<HTMLElement>("a").forEach(el => { el.style.color = "var(--primary)"; });
  host.querySelectorAll<HTMLImageElement>("img").forEach(el => { el.style.maxWidth = "100%"; });
  await withExportDeadline(Promise.all(Array.from(host.querySelectorAll("img")).map(img => img.decode())), "A workout picture took too long to open. Please retry.");
  return host;
}

function tokenColor(token: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Document colors could not be prepared.");
  context.fillStyle = color; context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(c => c.toString(16).padStart(2, "0")).join("");
}

async function imagePng(image: HTMLImageElement) {
  await image.decode();
  const width = Math.min(624, image.naturalWidth);
  const height = image.alt.endsWith(" cover") ? 208 : Math.round(width * image.naturalHeight / image.naturalWidth);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A workout picture could not be prepared.");
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  context.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("A workout picture could not be embedded.")), "image/png"));
  return { data: new Uint8Array(await blob.arrayBuffer()), width, height };
}

export async function workoutWordDocument(hosts: HTMLElement[]): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, ExternalHyperlink, ImageRun, HeadingLevel, LevelFormat, AlignmentType, Footer, PageNumber } = await import("docx");
  const ink = tokenColor("document-ink"), accent = tokenColor("brand-blue"), paper = tokenColor("document-paper");
  const children: InstanceType<typeof Paragraph>[] = [];
  type Run = InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>;
  const runs = (node: Node, bold = false, italics = false): Run[] => {
    if (node.nodeType === Node.TEXT_NODE) return [new TextRun({ text: node.textContent ?? "", bold, italics, color: ink })];
    if (!(node instanceof HTMLElement)) return [];
    if (node.tagName === "BR") return [new TextRun({ break: 1 })];
    if (node.tagName === "A") return [new ExternalHyperlink({ link: node.getAttribute("href") ?? "", children: [new TextRun({ text: node.textContent ?? "", color: accent, underline: {} })] })];
    return Array.from(node.childNodes).flatMap(child => runs(child, bold || ["STRONG", "B"].includes(node.tagName), italics || ["I", "EM"].includes(node.tagName)));
  };
  const walk = async (el: Element, list?: "bullets" | "numbers") => {
    for (const child of Array.from(el.children)) {
      if (["SECTION", "DIV", "ARTICLE", "UL", "OL"].includes(child.tagName) && child.children.length) {
        await walk(child, child.tagName === "UL" ? "bullets" : child.tagName === "OL" ? "numbers" : list); continue;
      }
      const images = child instanceof HTMLImageElement ? [child] : Array.from(child.querySelectorAll("img"));
      for (const image of images) {
        const png = await imagePng(image);
        children.push(new Paragraph({ children: [new ImageRun({ type: "png", ...png, transformation: { width: png.width, height: png.height }, altText: { title: image.alt, description: image.alt, name: image.alt } })], spacing: { after: 180 } }));
      }
      if (!child.textContent?.trim()) continue;
      const heading = child.tagName === "H1" ? HeadingLevel.HEADING_1 : child.tagName === "H2" ? HeadingLevel.HEADING_2 : child.tagName === "H3" ? HeadingLevel.HEADING_3 : undefined;
      const content = heading ? [new TextRun({ text: child.textContent ?? "", bold: true, size: child.tagName === "H1" ? 40 : 30, color: child.tagName === "H1" ? ink : accent })] : runs(child);
      children.push(new Paragraph({ children: content, ...(heading ? { heading } : {}), ...(child.tagName === "LI" && list ? { numbering: { reference: list, level: 0 } } : {}), spacing: { before: heading ? 200 : 60, after: 120 } }));
    }
  };
  for (const [index, host] of hosts.entries()) {
    if (index) children.push(new Paragraph({ pageBreakBefore: true }));
    await walk(host);
  }
  const doc = new Document({
    background: { color: paper },
    styles: { default: { document: { run: { font: "Arial", size: 22, color: ink } } }, paragraphStyles: ["Heading1", "Heading2", "Heading3"].map((id, index) => ({ id, name: id, basedOn: "Normal", next: "Normal", run: { bold: true, color: index ? accent : ink, size: index ? 30 : 40 }, paragraph: { outlineLevel: index, keepNext: true } })) },
    numbering: { config: ["bullets", "numbers"].map(reference => ({ reference, levels: [{ level: 0, format: reference === "bullets" ? LevelFormat.BULLET : LevelFormat.DECIMAL, text: reference === "bullets" ? "•" : "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 250 } } } }] })) },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 800, bottom: 800, left: 800, right: 800 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SMARTYGYM · smartygym.com · ", color: ink }), new TextRun({ children: [PageNumber.CURRENT], color: ink })] })] }) }, children }],
  });
  return Packer.toBlob(doc);
}

type DocumentRun = { text: string; bold: boolean; link?: string };
type DocumentBlock = { kind: "text"; runs: DocumentRun[]; level: number; prefix: string } | { kind: "image"; image: HTMLImageElement };

function documentText(value: string) {
  // Decorative section emoji are not prescriptions; omit unsupported pictographs from PDF fonts.
  return value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ");
}

function documentBlocks(host: HTMLElement): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const runs = (node: Node, bold = false, link?: string): DocumentRun[] => {
    if (node.nodeType === Node.TEXT_NODE) return [{ text: documentText(node.textContent ?? ""), bold, ...(link ? { link } : {}) }];
    if (!(node instanceof HTMLElement)) return [];
    if (node.tagName === "BR") return [{ text: "\n", bold }];
    const href = node.tagName === "A" ? node.getAttribute("href") ?? undefined : link;
    return Array.from(node.childNodes).flatMap(child => runs(child, bold || ["STRONG", "B"].includes(node.tagName), href));
  };
  const walk = (element: Element, prefix = "") => {
    if (element.tagName === "IMG" && element instanceof HTMLImageElement) {
      blocks.push({ kind: "image", image: element }); return;
    }
    if (["UL", "OL"].includes(element.tagName)) {
      Array.from(element.children).forEach((child, index) => walk(child, element.tagName === "OL" ? `${index + 1}. ` : "• "));
      return;
    }
    if (["P", "H1", "H2", "H3", "H4", "LI", "TR", "BLOCKQUOTE"].includes(element.tagName)) {
      const level = /^H[1-4]$/.test(element.tagName) ? Number(element.tagName.slice(1)) : 0;
      const content = element.tagName === "TR"
        ? Array.from(element.children).flatMap((cell, i) => [{ text: i ? " | " : "", bold: false }, ...runs(cell)])
        : Array.from(element.childNodes).filter(node => !(node instanceof HTMLElement && ["UL", "OL"].includes(node.tagName))).flatMap(node => runs(node, level > 0));
      if (content.some(run => run.text.trim())) blocks.push({ kind: "text", runs: content, level, prefix });
      element.querySelectorAll<HTMLImageElement>("img").forEach(image => blocks.push({ kind: "image", image }));
      Array.from(element.children).filter(child => ["UL", "OL"].includes(child.tagName)).forEach(child => walk(child));
      return;
    }
    Array.from(element.children).forEach(child => walk(child));
  };
  walk(host);
  return blocks;
}

export async function workoutPdfDocument(hosts: HTMLElement[], report: (message: string) => void = () => {}, cancelled: () => boolean = () => false): Promise<Blob> {
  const { jsPDF } = await withExportDeadline(import("jspdf"), "PDF tools took too long to load. Please retry.");
  const loadFont = async (name: string) => {
    const response = await fetch(`/fonts/workout-document-${name}.ttf`);
    if (!response.ok) throw new Error("The document font could not be loaded. Please retry.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return btoa(binary);
  };
  const [regular, bold] = await withExportDeadline(Promise.all([loadFont("regular"), loadFont("bold")]), "Document fonts took too long to load. Please retry.");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  pdf.addFileToVFS("Document-Regular.ttf", regular); pdf.addFont("Document-Regular.ttf", "Document", "normal");
  pdf.addFileToVFS("Document-Bold.ttf", bold); pdf.addFont("Document-Bold.ttf", "Document", "bold");
  pdf.setProperties({ title: hosts.length === 1 ? hosts[0]?.querySelector("h1")?.textContent ?? "SmartyGym Workout" : "SmartyGym Workouts", author: "SMARTYGYM", creator: "SMARTYGYM" });
  const ink = tokenColor("document-ink"), accent = tokenColor("brand-blue"), muted = tokenColor("document-muted"), line = tokenColor("document-line");
  const left = 16, right = 194, bottom = 276;
  let y = 18;
  const newPage = () => { pdf.addPage(); y = 18; };
  const ensure = (height: number) => { if (y + height > bottom) newPage(); };
  for (const [workoutIndex, host] of hosts.entries()) {
    if (cancelled()) throw new Error("Download cancelled.");
    if (workoutIndex) newPage();
    report(`Creating PDF · workout ${workoutIndex + 1} of ${hosts.length}…`);
    const blocks = documentBlocks(host);
    for (const block of blocks) {
      if (cancelled()) throw new Error("Download cancelled.");
      if (block.kind === "image") {
        const png = await imagePng(block.image);
        const width = right - left, height = Math.min(100, width * png.height / png.width);
        ensure(height + 6);
        pdf.addImage(png.data, "PNG", left, y, width, height); y += height + 7;
        continue;
      }
      const size = block.level === 1 ? 22 : block.level ? 13 : 10;
      const lineHeight = size * 0.352778 * 1.5;
      if (block.level) { ensure(lineHeight * 3 + 6); y += 4; }
      let x = left + (block.prefix ? 5 : 0);
      const textLeft = x;
      pdf.setFontSize(size);
      if (block.prefix) { ensure(lineHeight); pdf.setFont("Document", "normal"); pdf.setTextColor(`#${ink}`); pdf.text(block.prefix, left, y + size * 0.352778); }
      for (const run of block.runs) {
        pdf.setFont("Document", run.bold ? "bold" : "normal");
        pdf.setTextColor(`#${run.link || block.level > 1 ? accent : ink}`);
        for (const token of run.text.split(/(\s+)/)) {
          if (!token) continue;
          const space = /^\s+$/.test(token);
          if (token.includes("\n")) { y += lineHeight; ensure(lineHeight); x = textLeft; continue; }
          if (space && x === textLeft) continue;
          const width = pdf.getTextWidth(token);
          if (x + width > right && x > textLeft) { y += lineHeight; ensure(lineHeight); x = textLeft; if (space) continue; }
          const pieces = width > right - textLeft ? Array.from(token) : [token];
          for (const piece of pieces) {
            const pieceWidth = pdf.getTextWidth(piece);
            if (x + pieceWidth > right) { y += lineHeight; ensure(lineHeight); x = textLeft; }
            ensure(lineHeight);
            const baseline = y + size * 0.352778;
            pdf.text(piece, x, baseline);
            if (run.link) pdf.link(x, y, pieceWidth, lineHeight, { url: run.link });
            x += pieceWidth;
          }
        }
      }
      y += lineHeight + (block.level ? 3 : 2.5);
    }
  }
  for (let index = 1; index <= pdf.getNumberOfPages(); index++) {
    pdf.setPage(index); pdf.setDrawColor(`#${line}`); pdf.line(left, 284, right, 284);
    pdf.setFont("Document", "normal"); pdf.setFontSize(8); pdf.setTextColor(`#${muted}`);
    pdf.text(`SMARTYGYM · smartygym.com · ${index} / ${pdf.getNumberOfPages()}`, 105, 290, { align: "center" });
  }
  return pdf.output("blob");
}
