import { SITE_URL } from "@/lib/seo/site";

export function blogShareDetails(article: { slug: string; title: string; excerpt: string | null }) {
  return {
    title: `${article.title} — SmartyGym`,
    text: [article.title, article.excerpt].filter(Boolean).join("\n"),
    url: `${SITE_URL}/blog/${encodeURIComponent(article.slug)}`,
  };
}

export function blogSharePayload(details: ShareData, file: File | null, acceptsFiles: boolean): ShareData {
  return file && acceptsFiles ? { ...details, files: [file] } : { ...details };
}