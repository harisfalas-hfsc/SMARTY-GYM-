import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { AI_TXT } from "@/lib/seo/ai-txt";

/** /ai.txt — structured facts for AI systems. Pricing lines drop out while Free Access Mode is ON. */
export const Route = createFileRoute("/ai.txt")({
  server: {
    handlers: {
      GET: async () => {
        let body = AI_TXT;
        try {
          const { isFreeAccessMode } = await import("@/lib/free-access.server");
          if (await isFreeAccessMode()) {
            body = body
              .replace(/# =+\n# MEMBERSHIP PRICING\n# =+\n[\s\S]*?(?=# =+\n# )/, "")
              .split("\n")
              .filter((l) => !/€9\.99|\/pricing/.test(l))
              .join("\n");
          }
        } catch {
          body = AI_TXT;
        }
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
