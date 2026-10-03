import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { LLMS_STATIC as LLMS_BASE_STATIC } from "@/lib/seo/llms-static";
import { LLMS_LEGACY } from "@/lib/seo/llms-legacy";

const LLMS_STATIC = `${LLMS_BASE_STATIC.trimEnd()}\n\n${LLMS_LEGACY}`;

/**
 * /llms.txt — served dynamically so the automatic SEO update (Admin → Cron jobs)
 * keeps the coverage section in sync with the live exercise library, workouts and
 * training topics. The static description above it never changes.
 */
/**
 * Removes the pricing block, every paid link and all subscription wording so
 * /llms.txt describes a fully free product while Free Access Mode is ON.
 */
function stripPaidCopy(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let skipSection = false;
  for (const line of lines) {
    if (/^##\s/.test(line)) skipSection = /pricing/i.test(line);
    if (skipSection) continue;
    if (/\/pricing|€9\.99|9\.99 per month|one subscription includes/i.test(line)) continue;
    out.push(
      line
        .replace(/every subscriber/gi, "every member")
        .replace(/Fitness Subscription, Monthly Membership, Cancel Anytime, /gi, "")
        .replace(/subscribers/gi, "members"),
    );
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(
      "## Who SmartyGym is for",
      "## Access\n\nEvery feature is available to all registered users at no cost.\n\n## Who SmartyGym is for",
    );
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
         const extra = "";

        let base = LLMS_STATIC;
        try {
          const { isFreeAccessMode } = await import("@/lib/free-access.server");
          if (await isFreeAccessMode()) {
            base = stripPaidCopy(base);
          }
        } catch {
          base = LLMS_STATIC;
        }

         return new Response(`${base}${extra}`, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
