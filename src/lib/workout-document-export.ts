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
  const ink = tokenColor("foreground"), accent = tokenColor("primary"), paper = tokenColor("card");
  const children: InstanceType<typeof Paragraph>[] = [];
  type Run = InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>;
  const runs = (node: Node, bold = false, italics = false): Run[] => {
    if (node.nodeType === Node.TEXT_NODE) return [new TextRun({ text: node.textContent ?? "", bold, italics })];
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
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 800, bottom: 800, left: 800, right: 800 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("SMARTYGYM · smartygym.com · "), new TextRun({ children: [PageNumber.CURRENT] })] })] }) }, children }],
  });
  return Packer.toBlob(doc);
}

export async function workoutPdfDocument(hosts: HTMLElement[], report: (message: string) => void = () => {}, cancelled: () => boolean = () => false): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await withExportDeadline(Promise.all([import("jspdf"), import("html2canvas-pro"), document.fonts.ready]), "PDF tools or fonts took too long to load. Please retry.");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const paper = tokenColor("card"), ink = tokenColor("foreground");
  let first = true, y = 14;
  const page = () => {
    if (!first) pdf.addPage(); first = false; y = 14;
    pdf.setFillColor(`#${paper}`); pdf.rect(0, 0, 210, 297, "F");
    pdf.setTextColor(`#${ink}`); pdf.setFontSize(8); pdf.text(`SMARTYGYM · smartygym.com · ${pdf.getNumberOfPages()}`, 105, 288, { align: "center" });
  };
  for (const [workoutIndex, host] of hosts.entries()) {
    if (cancelled()) throw new Error("Download cancelled.");
    report(`Creating PDF · workout ${workoutIndex + 1} of ${hosts.length}…`);
    page();
    host.style.position = "fixed"; host.style.left = "-10000px"; host.style.top = "0";
    document.body.append(host);
    try {
      // Render each paragraph/list item independently so no exercise is sliced at a page boundary.
      const blocks = Array.from(host.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,li,img,table"))
        .filter(el => !el.parentElement?.closest("li,table") && !(el.tagName === "IMG" && el.parentElement?.closest("p")));
      host.id = `workout-pdf-${workoutIndex}`;
      let origin = host.getBoundingClientRect();
      let bounds = blocks.map(block => block.getBoundingClientRect());
      // Capture once, rather than cloning the entire app for every paragraph.
      const rendered = await withExportDeadline(html2canvas(host, {
        scale: 1.5, backgroundColor: `#${paper}`, logging: false, imageTimeout: 15_000,
        ignoreElements: el => !document.head.contains(el) && !el.contains(host) && !host.contains(el),
        onclone: doc => {
          const clonedHost = doc.getElementById(host.id);
          if (!clonedHost) throw new Error("The PDF layout could not be prepared.");
          origin = clonedHost.getBoundingClientRect();
          bounds = Array.from(clonedHost.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,li,img,table"))
            .filter(el => !el.parentElement?.closest("li,table") && !(el.tagName === "IMG" && el.parentElement?.closest("p")))
            .map(block => block.getBoundingClientRect());
        },
      }), "The PDF took too long to render. Please retry or download Word.");
      const scale = rendered.width / origin.width;
      for (let index = 0; index < blocks.length; index++) {
        if (cancelled()) throw new Error("Download cancelled.");
        const block = blocks[index]; if (!block) continue;
        const rect = bounds[index]; if (!rect) continue;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(rect.width * scale); canvas.height = Math.ceil(rect.height * scale);
        if (!canvas.width || !canvas.height) continue;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("The PDF could not be rendered.");
        context.fillStyle = `#${paper}`; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(rendered, Math.round((rect.left - origin.left) * scale), Math.round((rect.top - origin.top) * scale), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        const width = Math.min(182, canvas.width * 182 / 624);
        const height = canvas.height * width / canvas.width;
        if (height > 266) throw new Error("One workout block is too large for an A4 page. Download Word or HTML for this workout.");
        const next = blocks[index + 1];
        const keepHeading = /^H[1-4]$/.test(block.tagName) && next ? next.getBoundingClientRect().height * 182 / 624 + 5 : 0;
        if (y + height + keepHeading > 278 && y > 14) page();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 14, y, width, height); y += height + 3;
      }
    } finally { host.remove(); }
  }
  return pdf.output("blob");
}