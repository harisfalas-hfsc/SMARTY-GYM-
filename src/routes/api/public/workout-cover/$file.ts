import { createFileRoute } from "@tanstack/react-router";

type EdgeCache = { match(req: Request): Promise<Response | undefined>; put(req: Request, res: Response): Promise<void> };

function edgeCache(): EdgeCache | null {
  const c = (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches;
  return c?.default ?? null;
}

/** Serves Smarty Workout cover pictures from the private bucket under a stable URL. */
export const Route = createFileRoute("/api/public/workout-cover/$file")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const file = String(params.file ?? "");
        if (!/^[a-z0-9][a-z0-9-]*\.(png|jpg|jpeg|webp)$/i.test(file)) {
          return new Response("Not found", { status: 404 });
        }
        // File names are never reused, so a cached copy is always correct.
        const cache = edgeCache();
        const key = new Request(new URL(request.url).toString(), { method: "GET" });
        try {
          const hit = await cache?.match(key);
          if (hit) return hit;
        } catch {
          /* cache unavailable — serve from storage */
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("smarty-workout-images").download(file);
        if (error || !data) return new Response("Not found", { status: 404 });
        const ext = file.split(".").pop()?.toLowerCase() ?? "";
        const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const res = new Response(await data.arrayBuffer(), {
          headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
        });
        try {
          await cache?.put(key, res.clone());
        } catch {
          /* ignore */
        }
        return res;
      },
    },
  },
});
