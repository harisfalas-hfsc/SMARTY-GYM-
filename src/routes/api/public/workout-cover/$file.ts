import { createFileRoute } from "@tanstack/react-router";

/** Serves Smarty Workout cover pictures from the private bucket under a stable URL. */
export const Route = createFileRoute("/api/public/workout-cover/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = String(params.file ?? "");
        if (!/^[a-z0-9][a-z0-9-]*\.(png|jpg|jpeg|webp)$/i.test(file)) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("smarty-workout-images").download(file);
        if (error || !data) return new Response("Not found", { status: 404 });
        const ext = file.split(".").pop()?.toLowerCase() ?? "";
        const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        return new Response(await data.arrayBuffer(), {
          headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
