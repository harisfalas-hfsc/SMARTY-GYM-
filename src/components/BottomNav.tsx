import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, Dumbbell, Share2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ITEMS = [
  { to: "/smarty-workouts", label: "Workouts", Icon: Dumbbell, iconColor: "text-chart-1" },
  { to: "/wod", label: "WOD", Icon: CalendarCheck, iconColor: "text-chart-2" },
  { to: "/create-your-own-workout", label: "Create", Icon: Sparkles, iconColor: "text-chart-3" },
  { to: "/shared-workouts", label: "Shared", Icon: Share2, iconColor: "text-chart-4" },
  { to: "/logbook", label: "Logbook", Icon: BookOpen, iconColor: "text-chart-5" },
] as const;

export function BottomNav() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading || !user) return null;

  return (
    <>
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))]" />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map(({ to, label, Icon, iconColor }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={to}>
              <Link
                to={to}
                {...(to === "/logbook"
                  ? { search: { filter: "all", view: "list" as const } }
                  : {})}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold no-underline transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                style={{ textDecoration: "none" }}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      </nav>
    </>
  );
}
