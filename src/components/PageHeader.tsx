import { iconInk, iconTone } from "@/lib/icon-tone";
import { isValidElement, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobilePageDescription } from "@/components/MobilePageDescription";

/** Visible text of a title, used to size it so it stays on one line on phones. */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children);
  return "";
}

/** True when the author asked for a deliberate line break; those are kept. */
function hasExplicitBreak(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasExplicitBreak);
  if (isValidElement(node)) {
    if (node.type === "br") return true;
    return hasExplicitBreak((node.props as { children?: ReactNode }).children);
  }
  return false;
}

interface PageHeaderProps {
  eyebrow?: string;
  icon?: LucideIcon | string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional shorter introduction for phones; desktop keeps the original subtitle. */
  mobileSubtitle?: ReactNode;
  mobileDescriptionCard?: boolean;
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
  mobileSubtitle,
  mobileDescriptionCard = true,
  className,
  as: Heading = "h1",
  titleClassName,
  image,
}: PageHeaderProps) {
  const Icon = typeof icon === "function" ? icon : null;
  const Description = mobileDescriptionCard ? MobilePageDescription : "p";
  const titleText = nodeText(title).replace(/\s+/g, " ").trim();
  const titleFitsOneLine =
    titleText.length > 0 && !hasExplicitBreak(title) && !Icon && typeof icon !== "string";
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
        {Icon && <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${iconInk(typeof title === "string" ? title : "page")}`} />}
        {typeof icon === "string" && (
          <span className="text-2xl leading-none sm:text-3xl">{icon}</span>
        )}
        <span
          className={cn("min-w-0", titleFitsOneLine && "sg-title-fit")}
          style={
            titleFitsOneLine
              ? ({ "--sg-title-chars": titleText.length } as CSSProperties)
              : undefined
          }
        >
          {title}
        </span>
      </Heading>

      {subtitle && (
        <Description
          className={cn(
            "mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base",
            image && "lg:mx-0 lg:mt-4 lg:text-lg lg:leading-8 lg:text-foreground/80",
          )}
        >
          {mobileSubtitle ? <><span className="md:hidden">{mobileSubtitle}</span><span className="hidden md:inline">{subtitle}</span></> : subtitle}
        </Description>
      )}
      </div>
    </div>
  );
}
