import DOMPurify from "dompurify";
import { contentPdfDocument } from "./content-pdf";

export type ExportArticle = { title: string; excerpt: string | null; content: string; category: string; read_time: string | null; published_at: string | null; is_published: boolean; image_url: string | null; slug: string };

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function meta(a: ExportArticle) {
  const date = a.published_at ? new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not published";
  return `${a.category} · ${a.read_time ?? ""} · ${date} · By Haris Falas`;
}

function absolute(href: string) {
  return href.startsWith("/") ? `https://smartygym.com${href}` : href;
}

export async function exportBlogWord(articles: ExportArticle[], filename: string) {
  const { Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, LevelFormat, AlignmentType } = await import("docx");
  type Run = InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>;
  const children: InstanceType<typeof Paragraph>[] = [];
  const runs = (node: Node, style: { bold?: boolean; italics?: boolean } = {}): Run[] => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [new TextRun({ text: node.textContent, ...style })] : [];
    if (!(node instanceof HTMLElement)) return [];
    const next = { ...style };
    if (["B", "STRONG"].includes(node.tagName)) next.bold = true;
    if (["I", "EM"].includes(node.tagName)) next.italics = true;
    if (node.tagName === "BR") return [new TextRun({ text: "", break: 1 })];
    if (node.tagName === "A") {
      return [new ExternalHyperlink({ link: absolute(node.getAttribute("href") ?? ""), children: [new TextRun({ text: node.textContent ?? "", style: "Hyperlink", ...next })] })];
    }
    return Array.from(node.childNodes).flatMap((c) => runs(c, next));
  };
  const walk = (el: Element, list?: "b" | "n") => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName;
      if (tag === "UL" || tag === "OL") { walk(child, tag === "UL" ? "b" : "n"); continue; }
      const heading = tag === "H2" ? HeadingLevel.HEADING_2 : tag === "H3" ? HeadingLevel.HEADING_3 : undefined;
      children.push(new Paragraph({
        children: runs(child), ...(heading ? { heading } : {}),
        ...(tag === "LI" && list ? { numbering: { reference: list === "n" ? "nums" : "bullets", level: 0 } } : {}),
        spacing: { before: heading ? 240 : 60, after: 120 },
      }));
    }
  };
  articles.forEach((a, i) => {
    children.push(new Paragraph({ pageBreakBefore: i > 0, heading: HeadingLevel.HEADING_1, children: [new TextRun(a.title)] }));
    children.push(new Paragraph({ children: [new TextRun({ text: meta(a), italics: true, color: "666666" })], spacing: { after: 200 } }));
    if (a.excerpt) children.push(new Paragraph({ children: [new TextRun({ text: a.excerpt, bold: true })], spacing: { after: 200 } }));
    const div = document.createElement("div");
    div.innerHTML = DOMPurify.sanitize(a.content);
    walk(div);
  });
  const doc = new Document({
    numbering: { config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
      { reference: "nums", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
    ] },
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{ children }],
  });
  save(await Packer.toBlob(doc), `${filename}.docx`);
}

export function blogPdfContents(articles: ExportArticle[]) {
  return articles.map(article => ({
    title: article.title,
    subtitle: meta(article),
    ...(article.image_url ? { cover: article.image_url } : {}),
    sections: [
      ...(article.excerpt ? [{ html: `<p>${DOMPurify.sanitize(article.excerpt)}</p>` }] : []),
      { html: article.content },
    ],
  }));
}

export async function exportBlogPdf(articles: ExportArticle[], filename: string) {
  const blob = await contentPdfDocument(blogPdfContents(articles), "Blog Articles");
  save(blob, `${filename}.pdf`);
}
