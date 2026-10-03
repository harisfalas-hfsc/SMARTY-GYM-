import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { aiText } from "@/lib/seo/ai-txt";

/** /ai.txt — structured facts for AI systems. Pricing lines drop out while Free Access Mode is ON. */
export const Route = createFileRoute("/ai.txt")({
  server: {
    handlers: {
      GET: async () => {
        let free = false;
        try {
          const { isFreeAccessMode } = await import("@/lib/free-access.server");
          free = await isFreeAccessMode();
        } catch {
          // Conservative paid-access description if settings cannot be read.
        }
        return new Response(aiText(free), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
