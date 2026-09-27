import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  icon?: LucideIcon | string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  /**
   * Heading element used for the title. Defaults to "h1".
   * Pass "p" when the page already renders its own <h1> elsewhere,
   * so the document keeps exactly one h1. Styling is identical.
   */
  as?: "h1" | "h2" | "p";
  titleClassName?: string;
  /** Desktop-only banner picture. Mobile layout is unchanged. */
  image?: string;
}

/**
 * Standard page header used across every route:
 * centered eyebrow + centered uppercase title in one consistent size.
 * Any icon sits inline with the title on a single line, mobile included.
 */
export function PageHeader({
  eyebrow,
  icon,
  title,
  subtitle,
  className,
  as: Heading = "h1",
  titleClassName,
  image,
}: PageHeaderProps) {
  const Icon = typeof icon === "function" ? icon : null;
  return (
    <div
      className={cn(
        "mb-8 text-center",
        image &&
          "lg:relative lg:mb-12 lg:overflow-hidden lg:rounded-3xl lg:border-2 lg:border-primary/40 lg:px-14 lg:py-20 lg:text-left lg:shadow-soft",
        className,
      )}
    >
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="eager"
            className="absolute inset-0 hidden h-full w-full object-cover lg:block"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/85 to-background/10 lg:block" />
        </>
      )}
      <div className={image ? "lg:relative lg:max-w-2xl" : undefined}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-2 text-balance text-3xl font-extrabold uppercase tracking-tight sm:text-4xl",
          image && "lg:justify-start lg:text-5xl",
          eyebrow ? "mt-2" : "mt-0",
          titleClassName,
        )}
      >
        {Icon && <Icon className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />}
        {typeof icon === "string" && (
          <span className="text-2xl leading-none sm:text-3xl">{icon}</span>
        )}
        <span className="min-w-0">{title}</span>
      </Heading>

      {subtitle && (
        <p
          className={cn(
            "mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base",
            image && "lg:mx-0 lg:mt-4 lg:text-lg lg:leading-8 lg:text-foreground/80",
          )}
        >
          {subtitle}
        </p>
      )}
      </div>
    </div>
  );
}
