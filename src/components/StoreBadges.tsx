import { Download } from "lucide-react";

const IOS_URL = "https://apps.apple.com/cy/app/smarty-gym/id6776675309?l=el";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.smartygym.webview";

// Badges carry the stores' own brand colours on a transparent background — no
// filled chip — so they sit flat against the footer in light and dark view.
const badgeClass =
  "flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 transition-colors hover:border-primary/70";

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.103 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function GooglePlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 2 L12.5 12 L3 22 Z" fill="#00A0FF" />
      <path d="M3 2 L17 8.1 L12.5 12 Z" fill="#00E676" />
      <path d="M3 22 L17 15.9 L12.5 12 Z" fill="#FF3A44" />
      <path d="M12.5 12 L17 8.1 L21.5 12 L17 15.9 Z" fill="#FFBC00" />
    </svg>
  );
}

export function StoreBadges() {
  return (
    <div className="hidden md:flex flex-col items-center gap-3 pt-1">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Download className="h-4 w-4 text-primary" />
        Download our application for better experience.
      </p>

      <div className="flex items-center gap-3">
        <a
          href={IOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download SmartyGym on the App Store"
          className={badgeClass}
        >
          <AppleMark className="h-7 w-7 shrink-0 text-foreground" />
          <span className="flex flex-col text-left leading-none">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Download on the
            </span>
            <span className="mt-1 text-lg font-semibold text-foreground">App Store</span>
          </span>
        </a>

        <a
          href={ANDROID_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get SmartyGym on Google Play"
          className={badgeClass}
        >
          <GooglePlayMark className="h-7 w-7 shrink-0" />
          <span className="flex flex-col text-left leading-none">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Get it on
            </span>
            <span className="mt-1 text-lg font-semibold text-foreground">Google Play</span>
          </span>
        </a>
      </div>
    </div>
  );
}
