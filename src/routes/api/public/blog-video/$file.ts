import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves a blog article video from the private `blog-images` bucket under a
 * stable, non-expiring URL so it can be embedded in article content.
 * Read-only and public by design, mirroring /api/public/blog-cover.
 * Supports HTTP Range requests because iOS Safari requires them for <video>.
 */
export const Route = createFileRoute("/api/public/blog-video/$file")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const file = String(params.file ?? "");
        // No traversal, no nested paths — plain video file names only.
        if (!/^[a-z0-9][a-z0-9-]*\.(mp4|webm)$/i.test(file)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("blog-images").download(file);
        if (error || !data) return new Response("Not found", { status: 404 });

        const ext = file.split(".").pop()?.toLowerCase() ?? "";
        const type = ext === "webm" ? "video/webm" : "video/mp4";
        const buffer = await data.arrayBuffer();
        const total = buffer.byteLength;

        const range = request.headers.get("range");
        const match = range?.match(/^bytes=(\d*)-(\d*)$/);
        if (match && (match[1] !== "" || match[2] !== "")) {
          const start = match[1] === "" ? Math.max(0, total - Number(match[2])) : Number(match[1]);
          const end = match[1] !== "" && match[2] !== "" ? Math.min(total - 1, Number(match[2])) : total - 1;
          if (start >= total || start > end) {
            return new Response(null, {
              status: 416,
              headers: { "Content-Range": `bytes */${total}` },
            });
          }
          return new Response(buffer.slice(start, end + 1), {
            status: 206,
            headers: {
              "Content-Type": type,
              "Content-Range": `bytes ${start}-${end}/${total}`,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        return new Response(buffer, {
          headers: {
            "Content-Type": type,
            "Accept-Ranges": "bytes",
            // Immutable: every upload gets a unique file name.
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
