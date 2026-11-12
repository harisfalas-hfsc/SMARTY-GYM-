import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, Dumbbell, LogIn, MessageCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ITEMS = [
  { to: "/smarty-workouts", label: "Workouts", Icon: Dumbbell, iconColor: "text-chart-1" },
  { to: "/wod", label: "WOD", Icon: CalendarCheck, iconColor: "text-chart-2" },
  { to: "/create-your-own-workout", label: "Create", Icon: Sparkles, iconColor: "text-chart-3" },
] as const;
const MEMBER_LAST = { to: "/logbook", label: "Logbook", Icon: BookOpen, iconColor: "text-chart-5" } as const;
const VISITOR_LAST = { to: "/auth", label: "Sign in", Icon: LogIn, iconColor: "text-chart-5" } as const;

export function BottomNav() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return null;
  const items = [...ITEMS, user ? MEMBER_LAST : VISITOR_LAST];

  return (
    <>
      <div aria-hidden className={`${user ? "" : "md:hidden "}h-[calc(3.5rem+env(safe-area-inset-bottom))]`} />
      <nav
        className={`${user ? "" : "md:hidden "}fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        <li>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("smarty:open-coach"))}
            className="flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            Coach
          </button>
        </li>
        {items.map(({ to, label, Icon, iconColor }) => {
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
