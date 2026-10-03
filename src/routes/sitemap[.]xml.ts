import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { STATIC_SITEMAP_ENTRIES } from "@/lib/seo/route-inventory";
import { SITE_URL } from "@/lib/seo/site";


const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
  /** Optional image entry, so Google Images can index article covers. */
  image?: { loc: string; title?: string; caption?: string };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const ENTRIES: (SitemapEntry & { paidOnly?: boolean })[] = STATIC_SITEMAP_ENTRIES;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { isFreeAccessMode } = await import("@/lib/free-access.server");
        const freeAccessMode = await isFreeAccessMode();
        const base: SitemapEntry[] = (freeAccessMode
          ? ENTRIES.filter((e) => !e.paidOnly)
          : ENTRIES
        ).map(({ paidOnly: _p, ...e }) => e);

        let articles: SitemapEntry[] = [];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const rows: any[] = [];
            for (let offset = 0; offset < 49000; offset += 1000) {
              const { data, error } = await (supabaseAdmin as any)
                .from("blog_articles")
                .select("slug,title,seo_title,image_alt,image_url,published_at,updated_at,created_at,seo_optimized_at")
                .eq("is_published", true).order("published_at", { ascending: false }).range(offset, offset + 999);
              if (error) throw error;
              rows.push(...(data ?? []));
              if (!data || data.length < 1000) break;
            }
            articles = rows.filter((a) => a.slug && /^[a-z0-9-]+$/.test(a.slug)).map((a) => ({
            path: `/blog/${a.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
            lastmod: new Date(
              a.updated_at ?? a.seo_optimized_at ?? a.published_at ?? a.created_at,
            )
              .toISOString()
              .slice(0, 10),
            ...(a.image_url
              ? {
                  image: {
                    loc: String(a.image_url),
                    title: String(a.seo_title ?? a.title ?? ""),
                    caption: a.image_alt ? String(a.image_alt) : undefined,
                  },
                }
              : {}),
          }));
         } catch (error) {
           console.error("[seo/sitemap] published article lookup failed", error);
            return new Response("Sitemap source temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }

        // Shared community workouts are membership-gated while payments are ON,
        // so they only enter the sitemap when Free Access Mode makes them public.
        let sharedWorkouts: SitemapEntry[] = [];
        if (freeAccessMode) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const rows: any[] = [];
              for (let offset = 0; offset < 49000; offset += 1000) {
                const { data, error } = await (supabaseAdmin as any)
                  .from("community_workouts_public").select("id,shared_at,image_url,name")
                  .order("shared_at", { ascending: false }).range(offset, offset + 999);
                if (error) throw error;
                rows.push(...(data ?? []));
                if (!data || data.length < 1000) break;
              }
              sharedWorkouts = rows.filter((w) => /^[0-9a-f-]{36}$/i.test(w.id)).map((w) => ({
              path: `/community/workout/${w.id}`,
              changefreq: "monthly" as const,
              priority: "0.5",
              ...(w.shared_at
                ? { lastmod: new Date(w.shared_at).toISOString().slice(0, 10) }
                : {}),
              ...(w.image_url
                ? { image: { loc: String(w.image_url), title: String(w.name ?? "") } }
                : {}),
            }));
           } catch (error) {
             console.error("[seo/sitemap] public shared workout lookup failed", error);
              return new Response("Sitemap source temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
          }
        }

        const entries = [...base, ...articles, ...sharedWorkouts];
        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            e.image ? "    <image:image>" : null,
            e.image ? `      <image:loc>${escapeXml(e.image.loc)}</image:loc>` : null,
            e.image?.title ? `      <image:title>${escapeXml(e.image.title)}</image:title>` : null,
            e.image?.caption
              ? `      <image:caption>${escapeXml(e.image.caption)}</image:caption>`
              : null,
            e.image ? "    </image:image>" : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
          '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
