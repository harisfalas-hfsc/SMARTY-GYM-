import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Sitemap index: one entry per real sitemap so search consoles can be pointed
 * at a single address. No lastmod — the child sitemaps are generated live and
 * carry their own per-URL timestamps.
 */
export const Route = createFileRoute("/sitemap-index.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          `  <sitemap><loc>${SITE_URL}/sitemap.xml</loc></sitemap>`,
          `  <sitemap><loc>${SITE_URL}/sitemap-exercises.xml</loc></sitemap>`,
          `  <sitemap><loc>${SITE_URL}/image-sitemap.xml</loc></sitemap>`,
          "</sitemapindex>",
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
