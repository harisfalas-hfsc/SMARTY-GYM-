import DOMPurify from "dompurify";
import { blobDataUrl } from "./exercise-card-export";

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
export const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export function exportTheme() {
  const style = getComputedStyle(document.documentElement);
  return ["background", "foreground", "card", "card-foreground", "primary", "primary-foreground", "muted", "muted-foreground", "border"].map(key => `--${key}:${style.getPropertyValue(`--${key}`)}`).join(";");
}

export const STANDALONE_CSS = `
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--foreground);font:16px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:0}main{max-width:1152px;margin:auto;padding:32px 24px}h1{font-size:36px;line-height:1.15;margin:8px 0;overflow-wrap:anywhere}h2{font-size:22px;line-height:1.3}h3{font-size:18px}p{margin:10px 0}header,.panel{background:var(--card);color:var(--card-foreground);border:2px solid var(--primary);border-radius:24px;padding:24px;margin-bottom:20px}.eyebrow,.accent{color:var(--primary);font-weight:700}.muted{color:var(--muted-foreground)}.facts{display:flex;flex-wrap:wrap;gap:10px 24px;font-size:14px}.cover{width:100%;height:208px;object-fit:cover;border-radius:16px;margin-top:20px}button{font:inherit;cursor:pointer;min-height:44px;padding:8px 16px;border:2px solid var(--primary);border-radius:12px;background:var(--card);color:var(--foreground)}button.primary{background:var(--primary);color:var(--primary-foreground);font-weight:700}button:disabled{opacity:.4;cursor:default}button:focus-visible,a:focus-visible{outline:3px solid var(--primary);outline-offset:3px}.start{width:100%;margin-top:20px}.exercise-eye{display:inline-grid;place-items:center;min-height:28px;width:32px;padding:0;margin-left:8px;color:var(--primary);vertical-align:middle}.workout-html ul,.workout-html ol{padding-left:24px}.workout-html li{margin:8px 0}.workout-html a{color:var(--primary)}.workout-html img{max-width:100%;height:auto}footer{text-align:center;color:var(--muted-foreground);font-size:12px;margin-top:32px}dialog{background:var(--card);color:var(--foreground);border:2px solid var(--primary);border-radius:20px;width:min(960px,calc(100% - 32px));max-height:92dvh;padding:0}dialog::backdrop{background:color-mix(in srgb,var(--foreground) 65%,transparent)}.dialog-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)}.dialog-top strong{overflow-wrap:anywhere}.dialog-body{padding:20px;overflow:auto}.demo{display:block;width:100%;height:300px;object-fit:contain;background:var(--muted);border-radius:12px}.exercise-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px}.exercise-facts div{border:1px solid var(--primary);border-radius:12px;padding:10px}dt{color:var(--primary);font-size:11px;text-transform:uppercase}dd{margin:0;text-transform:capitalize}.player-content{text-align:center}.player-content h2{margin:12px 0}.player-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}.clock{font-size:40px;font-variant-numeric:tabular-nums;line-height:1.2;margin-top:16px}.progress{font-size:13px;color:var(--muted-foreground)}.phase{margin-top:32px;border-top:1px solid var(--border);padding-top:24px}.phase-heading{display:flex;gap:12px;align-items:center}.phase-heading h2{margin:0}.phase-heading p{margin:0}.phase-icon{font-size:28px}.reader-bar{display:flex;gap:8px;margin-bottom:20px}@media(min-width:1024px){main{padding:64px 32px}header{padding:28px}h1{font-size:40px}.player-content .demo{height:360px}}@media(max-width:600px){main{padding:20px 12px}h1{font-size:28px}header,.panel{padding:20px;border-radius:20px}dialog{width:calc(100% - 16px);max-height:96dvh}.dialog-body{padding:14px}.demo{height:230px}}@media print{button,dialog,.reader-bar{display:none}main{padding:0}.panel,header{break-inside:avoid}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
`;

export function htmlDocument(title: string, body: string, script = "", theme = exportTheme()) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | SmartyGym</title><style>:root{${theme}}${STANDALONE_CSS}</style></head><body><main>${body}<footer>SMARTYGYM<br>Your Gym Re-imagined. Anywhere, Anytime.<br>smartygym.com</footer></main>${script ? `<script>${script}</script>` : ""}</body></html>`;
}

export function createAssetEmbedder() {
  const cache = new Map<string, Promise<string>>();
  return (src: string): Promise<string> => {
    if (src.startsWith("data:image/")) return Promise.resolve(src);
    const url = new URL(src, window.location.origin);
    if (!["https:", "http:"].includes(url.protocol)) return Promise.reject(new Error("Unsupported picture source."));
    const existing = cache.get(url.href);
    if (existing) return existing;
    const result = (async () => {
      const response = await fetch(url.href);
      if (!response.ok) throw new Error("A picture could not be downloaded. Please try again.");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("A demonstration is not an image.");
      return blobDataUrl(blob);
    })();
    cache.set(url.href, result);
    return result;
  };
}

export async function embeddedHtml(html: string | null, embed: (src: string) => Promise<string>) {
  const holder = document.createElement("div");
  holder.innerHTML = DOMPurify.sanitize(html ?? "", { FORBID_TAGS: ["iframe", "form", "input", "textarea", "select", "video", "audio"], FORBID_ATTR: ["style", "srcset"] });
  await Promise.all(Array.from(holder.querySelectorAll("img")).map(async image => { image.src = await embed(image.getAttribute("src") ?? ""); }));
  holder.querySelectorAll("a[href]").forEach(a => { a.setAttribute("href", new URL(a.getAttribute("href") ?? "", window.location.origin).href); a.setAttribute("rel", "noreferrer noopener"); });
  return holder.innerHTML;
}

export type HtmlExportFile = { name: string; html: string };
export async function packageHtmlFiles(files: HtmlExportFile[], name: string) {
  if (!files.length) throw new Error("Select at least one item.");
  if (files.length === 1) return { blob: new Blob([files[0].html], { type: "text/html;charset=utf-8" }), filename: files[0].name };
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  files.forEach((file, index) => zip.file(`${String(index + 1).padStart(3, "0")}-${file.name}`, file.html));
  return { blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 3 } }), filename: `${name}.zip` };
}