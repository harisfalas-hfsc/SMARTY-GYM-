import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Membership confirmed — Smarty Gym" },
       { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Your Smarty Gym membership is active. Head back to Smarty Coach and create your next personalized workout.",
      },
      { property: "og:title", content: "Membership confirmed — Smarty Gym" },
      {
        property: "og:description",
        content: "Your Smarty Gym membership is active — start training today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      {sessionId ? (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight">
            Your membership is live
          </h1>
          <p className="mt-2 text-muted-foreground">
            Thanks for joining SmartyGym. Your two daily workouts and the Workout of the Day are
            unlocked.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight">Nothing to show</h1>
          <p className="mt-2 text-muted-foreground">We couldn't find a checkout to confirm.</p>
        </>
      )}
      <Button asChild className="mt-6 h-12 rounded-2xl font-bold">
        <Link to="/create-your-own-workout">Start training</Link>
      </Button>
    </div>
  );
}
