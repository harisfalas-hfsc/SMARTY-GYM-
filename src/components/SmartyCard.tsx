import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SmartyTone =
  | "cyan"
  | "green"
  | "orange"
  | "purple"
  | "yellow"
  | "pink"
  | "blue";

// Card shells stay neutral; brand colour belongs to text and controls.
const BLUE = {
  border: "border border-coach-line",
  text: "text-blue-500 dark:text-blue-300",
  softBg: "bg-muted/40",
  softBorder: "border-coach-line",
};

const TONE: Record<
  SmartyTone,
  { border: string; text: string; softBg: string; softBorder: string }
> = {
  cyan: BLUE,
  green: BLUE,
  orange: BLUE,
  purple: BLUE,
  yellow: BLUE,
  pink: BLUE,
  blue: BLUE,
};


export function toneClasses(tone: SmartyTone) {
  return TONE[tone];
}

interface SmartyCardProps {
  tone?: SmartyTone;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon | string; // Lucide icon component or emoji
  cornerIcon?: LucideIcon | string;
  align?: "left" | "center";
  title?: ReactNode;
  accent?: ReactNode; // colored trailing word appended to title
  description?: ReactNode;
  children?: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
  ctaHref?: string;
  className?: string;
}

function IconOrEmoji({
  icon,
  className,
}: {
  icon: LucideIcon | string;
  className?: string;
}) {
  if (typeof icon === "string") {
    return (
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center text-center text-lg leading-none",
          className,
        )}
      >
        {icon}
      </span>
    );
  }
  const Comp = icon;
  return <Comp className={cn("h-4 w-4 shrink-0", className)} />;
}

export function SmartyCard({
  tone = "cyan",
  eyebrow,
  eyebrowIcon,
  align = "left",
  title,
  accent,
  description,
  children,
  ctaLabel,
  ctaTo,
  ctaHref,
  className,
}: SmartyCardProps) {
  const t = TONE[tone];
  const hasHeader = Boolean(eyebrow);
  const centered = align === "center";
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden p-7 sm:p-9",
        t.border,
        centered && "text-center",
        className,
        "app-card",
      )}
    >
      {hasHeader && (
        <div className={cn("flex min-h-9 items-start", centered && "justify-center")}>
          <div
            className={cn(
              "inline-flex max-w-full min-w-0 items-center gap-3 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]",
              t.softBorder,
              t.text,
            )}
          >
            {eyebrowIcon && (
              <IconOrEmoji icon={eyebrowIcon} className={cn("h-4 w-4 shrink-0 text-sm", `mobile-accent-${({ cyan: 0, blue: 0, green: 1, orange: 2, purple: 3, yellow: 6, pink: 7 })[tone]}`)} />
            )}
            <span className="min-w-0 truncate">{eyebrow}</span>
          </div>
        </div>
      )}

      {title && (
        <h2
          className={cn(
            "text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl",
            hasHeader ? "mt-6" : "mt-0",
          )}
        >
          {title}
          {accent && <span className={cn(" ", t.text)}> {accent}</span>}
        </h2>
      )}

      {description && (
        <p
          className={cn(
            "mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7",
            centered && "mx-auto max-w-xl lg:max-w-3xl",
          )}
        >
          {description}
        </p>
      )}


      {children && <div className="mt-7">{children}</div>}

      {ctaLabel && (ctaTo || ctaHref) && (
        <div className="mt-6">
          {ctaTo ? (
            <Link
              to={ctaTo as never}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold",
                t.text,
              )}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={ctaHref}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold",
                t.text,
              )}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface SmartyRowProps {
  icon?: LucideIcon | string;
  title: string;
  subtitle?: string;
  tone?: SmartyTone;
}

export function SmartyRow({ icon, title, subtitle }: SmartyRowProps) {
  return (
    <div className="grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-4">
      {icon && (
        <div
          className={cn(
            "icon-tone-auto grid h-10 w-10 flex-none place-items-center rounded-xl border",
          )}
        >
          <IconOrEmoji icon={icon} className="h-4 w-4 text-base" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface SmartyPillProps {
  tone?: SmartyTone;
  icon?: LucideIcon | string;
  children: ReactNode;
}

export function SmartyPill({ tone = "cyan", icon, children }: SmartyPillProps) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "app-card grid min-h-14 grid-cols-[2rem_minmax(0,1fr)] items-center gap-4 px-4 py-3",
        t.softBorder,
      )}
    >
      <div className="icon-tone-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg">
        {icon && <IconOrEmoji icon={icon} className="h-4 w-4 text-sm" />}
      </div>
      <span className="text-sm font-medium leading-5 text-foreground">{children}</span>
    </div>
  );
}
