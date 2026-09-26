import { createFileRoute, redirect } from "@tanstack/react-router";

/** Preserve old bookmarks while moving visitors to the renamed workout page. */
export const Route = createFileRoute("/coach")({
  beforeLoad: () => {
    throw redirect({ to: "/create-your-workout", replace: true });
  },
  component: () => null,
});
