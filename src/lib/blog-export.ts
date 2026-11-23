import DOMPurify from "dompurify";

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

export async function exportBlogPdf(articles: ExportArticle[], filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  let first = true;
  for (const a of articles) {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;padding:56px;background:#fff;color:#171b1d;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;box-sizing:border-box";
    const cover = a.image_url ? `<img src="${a.image_url}" crossorigin="anonymous" style="width:100%;border-radius:12px;margin-bottom:20px"/>` : "";
    host.innerHTML = `${cover}<h1 style="font-size:28px;margin:0 0 6px">${DOMPurify.sanitize(a.title)}</h1><p style="color:#666;font-size:12px;margin:0 0 18px">${meta(a)}</p>${a.excerpt ? `<p style="font-weight:bold">${DOMPurify.sanitize(a.excerpt)}</p>` : ""}<div class="c">${DOMPurify.sanitize(a.content)}</div>`;
    host.querySelectorAll("a").forEach((l) => { (l as HTMLElement).style.color = "#087EA4"; });
    document.body.append(host);
    try {
      await Promise.all(Array.from(host.querySelectorAll("img")).map((img) => img.decode().catch(() => img.remove())));
      const canvas = await html2canvas(host, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const sliceH = Math.floor(canvas.width * (ph / pw));
      for (let y = 0; y < canvas.height; y += sliceH) {
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = Math.min(sliceH, canvas.height - y);
        slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, pw, (slice.height * pw) / slice.width);
      }
    } finally { host.remove(); }
  }
  pdf.save(`${filename}.pdf`);
}
