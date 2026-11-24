import DOMPurify from "dompurify";
import { contentPdfDocument } from "./content-pdf";

export type ExportRitual = {
  number: number;
  morning_content: string;
  midday_content: string;
  evening_content: string;
};

const PHASES = [
  { key: "morning_content", name: "Morning Ritual", time: "~8:00 AM • Start Strong", icon: "🌅" },
  { key: "midday_content", name: "Midday Ritual", time: "~1:00 PM • Reset & Reload", icon: "☀️" },
  { key: "evening_content", name: "Evening Ritual", time: "~8:00 PM • Unwind & Recover", icon: "🌙" },
] as const;

const emojiPattern = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
const emojiCache = new Map<string, Promise<string | null>>();

function emojiImage(emoji: string): Promise<string | null> {
  const cached = emojiCache.get(emoji);
  if (cached) return cached;
  const key = [...emoji].filter((c) => c !== "\uFE0F" && c !== "\u200D").map((c) => c.codePointAt(0)?.toString(16)).join("-");
  const result = (async () => {
    try {
      const response = await fetch(`/ritual-emoji/${key}.svg`);
      if (!response.ok) return null;
      const svg = await response.text();
      const image = new Image();
      const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      try {
        image.src = objectUrl;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(image, 0, 0, 64, 64);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return null;
    }
  })();
  emojiCache.set(emoji, result);
  return result;
}

async function makeEmojiImages(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  await Promise.all(nodes.map(async (node) => {
    const text = node.textContent ?? "";
    const matches = [...text.matchAll(emojiPattern)];
    if (!matches.length || !node.parentNode) return;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of matches) {
      fragment.append(document.createTextNode(text.slice(offset, match.index)));
      const png = await emojiImage(match[0]);
      if (png) {
        const img = document.createElement("img");
        img.src = png;
        img.alt = match[0];
        img.className = "emoji";
        fragment.append(img);
      } else fragment.append(document.createTextNode(match[0]));
      offset = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(offset)));
    node.replaceWith(fragment);
  }));
}

async function sheet(ritual: ExportRitual): Promise<HTMLElement> {
  const el = document.createElement("article");
  el.className = "export-sheet";
  const heading = document.createElement("h1");
  heading.textContent = `Daily Smarty Ritual ${ritual.number}`;
  el.append(heading);
  const byline = document.createElement("p");
  byline.className = "byline";
  byline.textContent = "SmartyGym · Designed by Haris Falas";
  el.append(byline);
  for (const phase of PHASES) {
    const section = document.createElement("section");
    section.className = "phase";
    const headingRow = document.createElement("div");
    headingRow.className = "phase-heading";
    const icon = document.createElement("span");
    icon.textContent = phase.icon;
    const labels = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = phase.name;
    const time = document.createElement("p");
    time.className = "time";
    time.textContent = phase.time;
    labels.append(title, time);
    headingRow.append(icon, labels);
    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = DOMPurify.sanitize(ritual[phase.key]);
    content.querySelectorAll("ul, ol").forEach((list) => {
      Array.from(list.children).forEach((item, index) => {
        if (item.tagName !== "LI") return;
        const marker = document.createElement("span");
        marker.className = "list-marker";
        marker.textContent = list.tagName === "OL" ? `${index + 1}.` : "•";
        item.prepend(marker);
      });
    });
    section.append(headingRow, content);
    el.append(section);
  }
  await makeEmojiImages(el);
  return el;
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function imageBytes(src: string): Uint8Array {
  const binary = atob(src.split(",")[1] ?? "");
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function exportWord(rituals: ExportRitual[], filename: string) {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, LevelFormat, AlignmentType } = await import("docx");
  type WordRun = InstanceType<typeof TextRun> | InstanceType<typeof ImageRun>;
  const children: InstanceType<typeof Paragraph>[] = [];
  const readRuns = (node: Node, style: { bold?: boolean; italics?: boolean; underline?: object; color?: string } = {}): WordRun[] => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [new TextRun({ text: node.textContent, ...style })] : [];
    if (!(node instanceof HTMLElement)) return [];
    if (node.classList.contains("list-marker")) return [];
    if (node.tagName === "IMG" && node instanceof HTMLImageElement) return [new ImageRun({ type: "png", data: imageBytes(node.src), transformation: { width: 13, height: 13 }, altText: { title: node.alt, name: node.alt, description: node.alt } })];
    const next = { ...style };
    if (["B", "STRONG"].includes(node.tagName)) next.bold = true;
    if (["I", "EM"].includes(node.tagName)) next.italics = true;
    if (node.tagName === "U") next.underline = {};
    if (node.tagName === "A") { next.underline = {}; next.color = "087EA4"; }
    if (node.tagName === "BR") return [new TextRun({ text: "", break: 1 })];
    return Array.from(node.childNodes).flatMap((child) => readRuns(child, next));
  };
  const contentParagraphs = (element: HTMLElement, list?: "bullet" | "number") => {
    for (const child of Array.from(element.children)) {
      const tag = child.tagName;
      if (tag === "UL" || tag === "OL") contentParagraphs(child as HTMLElement, tag === "UL" ? "bullet" : "number");
      else if (tag === "LI" && Array.from(child.children).some((e) => ["UL", "OL"].includes(e.tagName))) {
        const runs = Array.from(child.childNodes).filter((n) => !(n instanceof HTMLElement && ["UL", "OL"].includes(n.tagName))).flatMap((n) => readRuns(n));
        children.push(new Paragraph({ children: runs, numbering: { reference: list === "number" ? "ritual-numbers" : "ritual-bullets", level: 0 }, spacing: { after: 100 } }));
        contentParagraphs(child as HTMLElement);
      } else {
        children.push(new Paragraph({ children: readRuns(child), ...(list ? { numbering: { reference: list === "number" ? "ritual-numbers" : "ritual-bullets", level: 0 } } : {}), spacing: { before: tag === "P" ? 110 : 55, after: 115 }, ...(tag === "H3" ? { heading: HeadingLevel.HEADING_3 } : {}) }));
      }
    }
  };
  for (let i = 0; i < rituals.length; i++) {
    const el = await sheet(rituals[i]);
    children.push(new Paragraph({ pageBreakBefore: i > 0, heading: HeadingLevel.HEADING_1, children: readRuns(el.querySelector("h1") as HTMLElement) }));
    children.push(new Paragraph({ children: readRuns(el.querySelector(".byline") as HTMLElement), spacing: { after: 230 } }));
    for (const phase of el.querySelectorAll(".phase")) {
      const title = phase.querySelector("h2");
      const icon = phase.querySelector(".phase-heading .emoji");
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [...(icon ? readRuns(icon) : []), new TextRun(" "), ...(title ? readRuns(title) : [])], spacing: { before: 260, after: 35 }, keepNext: true }));
      const time = phase.querySelector(".time");
      if (time) children.push(new Paragraph({ children: readRuns(time), spacing: { after: 185 }, keepNext: true }));
      contentParagraphs(phase.querySelector(".content") as HTMLElement);
    }
  }
  const document = new Document({
    numbering: { config: [
      { reference: "ritual-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
      { reference: "ritual-numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
    ] },
    styles: { default: { document: { run: { font: "Arial", size: 22 } } }, paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 34, bold: true, color: "171B1D" }, paragraph: { spacing: { after: 85 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 27, bold: true, color: "171B1D" }, paragraph: { spacing: { after: 140 }, outlineLevel: 1 } },
    ] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 950, right: 950 } } }, children }],
  });
  save(await Packer.toBlob(document), `${filename}.docx`);
}

export function ritualPdfContents(rituals: ExportRitual[]) {
  return rituals.map(ritual => ({
    title: `Daily Smarty Ritual ${ritual.number}`,
    subtitle: "SmartyGym · Designed by HARIS FALAS",
    sections: PHASES.map(phase => ({ title: phase.name, subtitle: phase.time, html: ritual[phase.key] })),
  }));
}

export async function exportPdf(rituals: ExportRitual[], filename: string) {
  const blob = await contentPdfDocument(ritualPdfContents(rituals), "Smarty Rituals");
  save(blob, `${filename}.pdf`);
}
