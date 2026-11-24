import DOMPurify from "dompurify";
import { createAssetEmbedder } from "./standalone-html";
import { withExportDeadline } from "./export-timing";
import { nativePdfDocument } from "./workout-document-export";

export type ContentDocument = { title: string; subtitle: string; cover?: string; sections: { title?: string; subtitle?: string; html: string }[] };

export function contentPictureSource(src: string, origin: string) {
  const url = new URL(src, origin);
  // App-owned media must use the current app host, avoiding cross-origin fetch restrictions in preview/native shells.
  if (["smartygym.com", "www.smartygym.com", "thesmartygym.lovable.app"].includes(url.hostname) && url.pathname.startsWith("/api/public/")) {
    return new URL(`${url.pathname}${url.search}`, origin).href;
  }
  return url.href;
}

export async function contentPdfDocument(documents: ContentDocument[], collection: string): Promise<Blob> {
  if (!documents.length) throw new Error("Select at least one item to download.");
  const embed = createAssetEmbedder();
  const hosts: HTMLElement[] = [];
  for (const item of documents) {
    const host = document.createElement("article");
    const title = document.createElement("h1"); title.textContent = item.title;
    const subtitle = document.createElement("p"); subtitle.textContent = item.subtitle;
    host.append(title, subtitle);
    if (item.cover) {
      const cover = document.createElement("img"); cover.src = item.cover; cover.alt = `${item.title} cover`; host.append(cover);
    }
    for (const part of item.sections) {
      const section = document.createElement("section");
      if (part.title) { const heading = document.createElement("h2"); heading.textContent = part.title; section.append(heading); }
      if (part.subtitle) { const time = document.createElement("p"); time.textContent = part.subtitle; section.append(time); }
      const content = document.createElement("div"); content.innerHTML = DOMPurify.sanitize(part.html);
      // Preserve plain-text and inline-only content as a paragraph too.
      if (!content.querySelector("p,h1,h2,h3,h4,ul,ol,table,blockquote,div")) {
        const paragraph = document.createElement("p"); paragraph.append(...Array.from(content.childNodes)); content.append(paragraph);
      }
      content.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(link => {
        link.href = new URL(link.getAttribute("href") ?? "", "https://smartygym.com").href;
      });
      section.append(content); host.append(section);
    }
    for (const image of host.querySelectorAll<HTMLImageElement>("img")) {
      image.src = await withExportDeadline(embed(contentPictureSource(image.src, window.location.origin)), "A document picture took too long to load. Please retry.");
      await withExportDeadline(image.decode(), "A document picture could not be opened. Please retry.");
    }
    hosts.push(host);
  }
  return nativePdfDocument(hosts, undefined, undefined, collection);
}