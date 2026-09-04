import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { resolveLegacyPath } from "@/lib/seo/legacy-redirects";

/**
 * Catch-all for addresses this app does not define.
 *
 * Its only job is invisible SEO preservation: an address that the previous
 * smartygym.com site published (all the old ".html" pages, /workout/*,
 * /trainingprogram/*, /blog/*) is answered with a permanent 301 redirect to the
 * closest page here, so the indexed ranking transfers instead of 404ing.
 * Anything else falls through to the normal not-found page, unchanged.
 */
export const Route = createFileRoute("/$")({
  beforeLoad: ({ location }) => {
    const target = resolveLegacyPath(location.pathname);
    if (target && target !== location.pathname) {
      throw redirect({ href: target, statusCode: 301 });
    }
    throw notFound();
  },
  component: () => null,
});
