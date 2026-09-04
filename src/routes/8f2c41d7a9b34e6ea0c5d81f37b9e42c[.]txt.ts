import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { INDEXNOW_KEY } from "@/lib/seo/indexnow.server";

/**
 * IndexNow ownership key file. Bing and the other IndexNow partners fetch this to
 * confirm that the site owner submitted the URLs. No visible page.
 */
export const Route = createFileRoute("/8f2c41d7a9b34e6ea0c5d81f37b9e42c.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(INDEXNOW_KEY, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
        }),
    },
  },
});
