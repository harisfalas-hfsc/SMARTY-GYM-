import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MobilePageDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mobile-page-description", className)}>{children}</p>;
}