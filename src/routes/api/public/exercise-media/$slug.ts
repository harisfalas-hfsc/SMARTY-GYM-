import { createFileRoute } from "@tanstack/react-router";

/**
 * Stable public address for an exercise's demonstration animation, so search
 * engines can reference it from structured data. The exercise library is free
 * and public; only active exercises are served.
 */
export const Route = createFileRoute("/api/public/exercise-media/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = String(params.slug ?? "").replace(/\.(gif|webp|png|jpg|jpeg|mp4)$/i, "");
        if (!/^[a-z0-9-]+$/.test(slug)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: ex } = await supabaseAdmin
          .from("exercises")
          .select("gif_path")
          .eq("is_active", true)
          .eq("slug", slug)
          .maybeSingle();
        const path = (ex as { gif_path: string | null } | null)?.gif_path;
        if (!path) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("exercise-library").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const type =
          ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : ext === "mp4" ? "video/mp4" : "image/jpeg";
        return new Response(await data.arrayBuffer(), {
          headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
        });
      },
    },
  },
});
