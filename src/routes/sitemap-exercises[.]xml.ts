import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo/site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap-exercises.xml")({
  server: {
    handlers: {
      GET: async () => {
        let rows: { slug: string; name: string }[];
        try {
          const { listPublicExerciseSlugs } = await import("@/lib/seo/exercise-public.server");
          rows = await listPublicExerciseSlugs();
        } catch (error) {
          console.error("[seo/sitemap-exercises] exercise lookup failed", error);
          return new Response("Sitemap source temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }

        const urls = rows
          .filter((r) => /^[a-z0-9-]+$/.test(r.slug))
          .map(
            (r) =>
              [
                "  <url>",
                `    <loc>${SITE_URL}/exercise-library/${escapeXml(r.slug)}</loc>`,
                "    <changefreq>monthly</changefreq>",
                "    <priority>0.6</priority>",
                "  </url>",
              ].join("\n"),
          );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
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
