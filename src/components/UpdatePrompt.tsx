import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { isRecoverablePageImportError } from "@/lib/recoverable-page-error";

/**
 * Branded "new version available" prompt.
 *
 * After a publish, browsers holding a stale cached page can fail to load a
 * code-split chunk ("Failed to fetch dynamically imported module"). Instead
 * of letting that surface as a crash, we catch the failure and offer a
 * one-tap refresh that heals the session.
 */
export function UpdatePrompt({ forceVisible = false }: { forceVisible?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);

    const onPreloadError = (event: Event) => {
      // Vite fires this when a dynamic import fails; prevent the default
      // throw so the app keeps running behind the prompt.
      event.preventDefault();
      show();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (isRecoverablePageImportError(reason)) {
        event.preventDefault();
        show();
      }
    };
    const onError = (event: ErrorEvent) => {
      if (isRecoverablePageImportError(event.message)) {
        event.preventDefault();
        show();
      }
    };

    window.addEventListener("vite:preloadError", onPreloadError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  if (!visible && !forceVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[9990] flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        className="pointer-events-auto w-full max-w-[342px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                  SmartyGym Update
                </span>
              </div>
              <h3 className="text-[15px] font-semibold leading-tight text-foreground">
                This page didn't finish loading
              </h3>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                A quick refresh usually gets you back on track.
              </p>
            </div>
            <button
              type="button"
              aria-label={forceVisible ? "Go home" : "Dismiss"}
              onClick={() => {
                setVisible(false);
                if (forceVisible) window.location.assign("/");
              }}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Refresh App
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-green-500 to-primary" />
      </div>
    </div>
  );
}
