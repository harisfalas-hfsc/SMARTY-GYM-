import { createFileRoute, redirect } from "@tanstack/react-router";

/** Preserve old bookmarks while moving visitors to the renamed workout page. */
export const Route = createFileRoute("/create-your-workout")({
  beforeLoad: () => {
    throw redirect({ to: "/create-your-own-workout", replace: true });
  },
  component: () => null,
});
