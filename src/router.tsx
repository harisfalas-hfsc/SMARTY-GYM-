import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Start loading a page as soon as a finger/cursor lands on its link.
    defaultPreload: "intent",
    // Keep the current screen on-screen briefly instead of flashing a spinner.
    defaultPendingMs: 800,
    defaultPendingMinMs: 0,
  });

  return router;
};
