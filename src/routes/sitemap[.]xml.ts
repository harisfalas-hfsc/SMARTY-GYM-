import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { STATIC_SITEMAP_ENTRIES } from "@/lib/seo/route-inventory";


const BASE_URL = "https://smartygym.com";

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
          const { data } = await (supabaseAdmin as any)
            .from("blog_articles")
            .select(
              "slug,title,seo_title,image_alt,image_url,published_at,updated_at,created_at,seo_optimized_at",
            )
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(1000);
          articles = ((data as any[]) ?? []).map((a) => ({
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
        } catch {
          articles = [];
        }

        // Shared community workouts are membership-gated while payments are ON,
        // so they only enter the sitemap when Free Access Mode makes them public.
        let sharedWorkouts: SitemapEntry[] = [];
        if (freeAccessMode) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await (supabaseAdmin as any)
              .from("community_workouts_public")
              .select("id,shared_at,image_url,name")
              .order("shared_at", { ascending: false })
              .limit(2000);
            sharedWorkouts = ((data as any[]) ?? []).map((w) => ({
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
          } catch {
            sharedWorkouts = [];
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
