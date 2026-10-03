import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo/site";

const BASE_URL = SITE_URL;

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** /image-sitemap.xml — every public image (article covers, page images) so Google Images can index them. */
export const Route = createFileRoute("/image-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const pages: { path: string; images: { loc: string; title?: string; caption?: string }[] }[] = [
          { path: "/", images: [{ loc: `${BASE_URL}/og-social.jpg`, title: "SmartyGym — Your Gym Re-imagined. Anywhere, Anytime." }] },
        ];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const rows: any[] = [];
            for (let offset = 0; offset < 49000; offset += 1000) {
              const { data, error } = await (supabaseAdmin as any)
                .from("blog_articles").select("slug,title,seo_title,image_url,image_alt")
                .eq("is_published", true).not("image_url", "is", null)
                .order("published_at", { ascending: false }).range(offset, offset + 999);
              if (error) throw error;
              rows.push(...(data ?? []));
              if (!data || data.length < 1000) break;
            }
            for (const a of rows) {
             if (!a.slug || !/^[a-z0-9-]+$/.test(a.slug)) continue;
            pages.push({
              path: `/blog/${a.slug}`,
              images: [{ loc: String(a.image_url), title: String(a.seo_title ?? a.title ?? ""), caption: a.image_alt ? String(a.image_alt) : undefined }],
            });
          }
         } catch (error) {
           console.error("[seo/image-sitemap] published covers lookup failed", error);
            return new Response("Image sitemap source temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
          ...pages.map((p) =>
            [
              "  <url>",
              `    <loc>${BASE_URL}${p.path}</loc>`,
              ...p.images.map((i) =>
                [
                  "    <image:image>",
                  `      <image:loc>${esc(i.loc)}</image:loc>`,
                  i.title ? `      <image:title>${esc(i.title)}</image:title>` : null,
                  i.caption ? `      <image:caption>${esc(i.caption)}</image:caption>` : null,
                  "    </image:image>",
                ].filter(Boolean).join("\n"),
              ),
              "  </url>",
            ].join("\n"),
          ),
          "</urlset>",
        ].join("\n");
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
