import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { WorkoutDisplay } from "@/components/workout/WorkoutDisplay";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";
import { getSmartyWorkout, type SmartyWorkout } from "@/lib/smarty-workouts.functions";
import { smartyToWorkoutRow } from "@/lib/smarty-workout-row";

export const Route = createFileRoute("/smarty-workouts/$workoutId")({
  head: () => ({
    meta: [
      { title: "Smarty Workout — SMARTYGYM" },
      { name: "description", content: "A ready workout by Haris Falas on SmartyGym." },
      { property: "og:title", content: "Smarty Workout — SMARTYGYM" },
      { property: "og:description", content: "A ready workout by Haris Falas on SmartyGym." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmartyWorkoutPage,
});

function SmartyWorkoutPage() {
  const { workoutId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const getWorkout = useServerFn(getSmartyWorkout);
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "ok"; w: SmartyWorkout } | { kind: "locked" } | { kind: "error"; msg: string }
  >({ kind: "loading" });
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    void getWorkout({ data: { id: workoutId } })
      .then((r) => {
        if ("workout" in r) setState({ kind: "ok", w: r.workout });
        else if ("locked" in r) setState({ kind: "locked" });
        else setState({ kind: "error", msg: r.error });
      })
      .catch(() => setState({ kind: "error", msg: "Could not load this workout." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, user, authLoading]);

  const back = (
    <Link to="/smarty-workouts" className="text-xs font-bold uppercase tracking-wider text-primary">
      ← Smarty Workouts
    </Link>
  );

  if (!authLoading && !user) {
    return (
      <Notice back={back} title="Premium access required" text="Smarty Workouts are for Premium members. Log in to open this workout.">
        <Button asChild>
          <Link to="/auth" search={{ redirect: `/smarty-workouts/${workoutId}` } as never}>Log in</Link>
        </Button>
      </Notice>
    );
  }
  if (state.kind === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state.kind === "locked") {
    return (
      <Notice back={back} title="Premium access required" text="Smarty Workouts are part of the Premium membership.">
        <Button onClick={() => setCheckout(true)}>View Premium</Button>
        <MembershipCheckoutDialog open={checkout} onOpenChange={setCheckout} />
      </Notice>
    );
  }
  if (state.kind === "error") return <Notice back={back} title="Workout unavailable" text={state.msg} />;

  return (
    <div className="mx-auto w-full max-w-4xl py-4 lg:max-w-7xl">
      <div className="px-4 pb-2">{back}</div>
      <WorkoutDisplay workout={smartyToWorkoutRow(state.w)} previewMode onComplete={() => {}} />
    </div>
  );
}

function Notice({ back, title, text, children }: { back: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      {back}
      <div className="mt-4 rounded-3xl border-2 border-blue-400 bg-card p-6 text-center">
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        {children && <div className="mt-4 flex justify-center">{children}</div>}
      </div>
    </div>
  );
}
