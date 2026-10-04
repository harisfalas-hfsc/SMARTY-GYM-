import { useNavigate } from "@tanstack/react-router";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Clickable member name — opens Shared Workouts filtered to that member.
 * Renders a span (role=link) so it can sit safely inside card buttons.
 */
export function CreatorLink({
  userId,
  name,
  className,
  children,
}: {
  userId: string | null | undefined;
  name: string | null | undefined;
  className?: string;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const label = children ?? (name || "Smarty member");
  if (!userId) return <span className={className}>{label}</span>;

  function go(e: MouseEvent | KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    void navigate({
      to: "/shared-workouts",
      search: {
        sort: "latest",
        difficulty: 0,
        category: "",
        q: "",
        creator: userId!,
        creatorName: name || "Smarty member",
      },
    });
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go(e);
      }}
      className={cn(
        "cursor-pointer underline-offset-2 hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none",
        className,
      )}
    >
      {label}
    </span>
  );
}
