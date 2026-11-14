"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const CENTER_CLASSES =
  "fixed outline-none left-[50%] top-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-5 overflow-y-auto rounded-3xl border border-coach-line bg-card p-5 shadow-soft duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-6";

/** Phones: native bottom sheet sliding up from the bottom edge. Larger screens: unchanged centered card. */
export const SHEET_CLASSES =
  "app-sheet fixed outline-none z-50 grid gap-5 overflow-y-auto border border-coach-line bg-card shadow-soft duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "max-sm:inset-x-0 max-sm:bottom-0 max-sm:!w-full max-sm:!max-w-none max-sm:!mx-0 max-sm:max-h-[88dvh] max-sm:!rounded-b-none max-sm:!rounded-t-3xl max-sm:border-b-0 max-sm:px-5 max-sm:pt-2 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom " +
  "sm:left-[50%] sm:top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl sm:p-6 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95";

/** Grab handle; swiping down on it closes the sheet. */
export function SheetHandle({ onDismiss }: { onDismiss: () => void }) {
  const start = React.useRef<number | null>(null);
  return (
    <div
      aria-hidden
      className="sticky top-0 z-40 order-first -mb-3 flex h-6 shrink-0 touch-none items-center justify-center sm:hidden"
      onTouchStart={(e) => { start.current = e.touches[0]?.clientY ?? null; }}
      onTouchEnd={(e) => {
        const y = e.changedTouches[0]?.clientY ?? 0;
        if (start.current !== null && y - start.current > 50) onDismiss();
        start.current = null;
      }}
    >
      <span className="h-1.5 w-11 rounded-full bg-muted-foreground/35" />
    </div>
  );
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean; sheet?: boolean }
>(({ className, children, onOpenAutoFocus, hideClose = false, sheet = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      // Keep the round close button visually identical in every dialog: never auto-select it on open.
      onOpenAutoFocus={onOpenAutoFocus ?? ((e) => { e.preventDefault(); (e.currentTarget as HTMLElement | null)?.focus({ preventScroll: true }); })}
      className={cn(
        sheet ? SHEET_CLASSES : CENTER_CLASSES,
        className,
      )}
      {...props}
    >
      {sheet ? <DialogPrimitive.Close asChild><SheetHandleClose /></DialogPrimitive.Close> : null}
      {/* Sticky close: stays visible while long dialog content scrolls. */}
      {hideClose ? null : <div className="sticky top-0 z-50 order-first -mb-10 flex h-10 shrink-0 items-start justify-end">
        <DialogPrimitive.Close className="pointer-events-auto grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors outline-none [@media(hover:hover)]:hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>}

      {children}

    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// Wraps the handle so a downward swipe triggers the dialog's own close action.
const SheetHandleClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ onClick, ...rest }, ref) => {
    const btn = React.useRef<HTMLButtonElement | null>(null);
    return (
      <>
        <button ref={(n) => { btn.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }} type="button" tabIndex={-1} aria-hidden className="hidden" onClick={onClick} {...rest} />
        <SheetHandle onDismiss={() => btn.current?.click()} />
      </>
    );
  },
);
SheetHandleClose.displayName = "SheetHandleClose";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col items-center space-y-2 px-10 text-center sm:items-start sm:pl-0 sm:pr-10 sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-3 pt-1 sm:grid-cols-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-extrabold leading-tight text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
