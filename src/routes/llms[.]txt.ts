import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { LLMS_STATIC } from "@/lib/seo/llms-static";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        let free = false;
        try {
          const { isFreeAccessMode } = await import("@/lib/free-access.server");
          free = await isFreeAccessMode();
        } catch { /* Conservative membership description. */ }
        const access = free
          ? "Access: registered members currently have free access."
          : "Access: premium membership is EUR 9.99 per month; full workouts and personal training data require an active membership.";
        return new Response(`${LLMS_STATIC.trimEnd()}\n\n${access}\n`, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});