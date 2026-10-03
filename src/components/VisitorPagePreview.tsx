import { Link, useRouter } from "@tanstack/react-router";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Info = { title: string; text: string; points: string[] };

const PAGES: Record<string, Info> = {
  "/create-your-own-workout": {
    title: "Create Your Own Workout",
    text: "Your personal workout for today, built in two ways: let Smarty Coach design it from your answers, or build it yourself with exercises from the Exercise Library.",
    points: [
      "Smarty Coach: answer a few questions about your goal, time, equipment and level",
      "Build It Yourself: pick your own exercises for Activation, Main Workout, Finisher and Cool Down",
      "Every workout is saved to your Logbook, ready to start, favorite and share",
    ],
  },
  "/logbook": {
    title: "Logbook",
    text: "Your complete training history in one place: every workout you created, saved, started and completed.",
    points: [
      "All your workouts, favorites and completed sessions",
      "Track sets, results and personal records",
      "Pick up any workout again with one tap",
    ],
  },
  "/progress": {
    title: "Progress",
    text: "See how your training adds up over time with your training load, consistency and results.",
    points: ["Training load and weekly consistency", "Results and personal records", "Clear view of your progress over time"],
  },
  "/profile": {
    title: "Training Profile",
    text: "Your goals, level, equipment and health readiness, so every workout fits you.",
    points: ["Goals, level and available equipment", "Health readiness (PAR-Q)", "Used to personalise your workouts"],
  },
  "/account": {
    title: "My Account",
    text: "Manage your SmartyGym membership, email, password and settings.",
    points: ["Membership and billing", "Email and password", "Account settings"],
  },
  "/inbox": {
    title: "Inbox",
    text: "Messages and updates from SmartyGym, all in one place.",
    points: ["Messages from SmartyGym", "Workout and community updates", "Notifications about your training"],
  },
  "/messages": {
    title: "Messages",
    text: "Messages and updates from SmartyGym, all in one place.",
    points: ["Messages from SmartyGym", "Workout and community updates", "Notifications about your training"],
  },
  "/notifications": {
    title: "Notifications",
    text: "Stay up to date with your workouts, community and SmartyGym news.",
    points: ["Workout reminders", "Community activity", "SmartyGym news"],
  },
};

const FALLBACK: Info = {
  title: "Your Workout",
  text: "Your workouts open here for SmartyGym members.",
  points: ["Full exercise list and instructions", "Guided workout player", "Saved to your Logbook"],
};

export function VisitorPagePreview({ pathname }: { pathname: string }) {
  const info = PAGES[pathname] ?? FALLBACK;
  const router = useRouter();
  // Tapping anywhere outside the card dismisses it, like every other announcement.
  const dismiss = () => {
    if (window.history.length > 1) router.history.back();
    else void router.navigate({ to: "/" });
  };
  return (
    <div className="min-h-[70vh] px-4 py-10" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">{info.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{info.text}</p>
        <ul className="mt-5 space-y-2 text-left">
          {info.points.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>Available to SmartyGym Premium members.</span>
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild>
            <Link to="/auth" search={{ next: pathname, mode: "signup" }}>Join now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth" search={{ next: pathname, mode: "signin" }}>Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
