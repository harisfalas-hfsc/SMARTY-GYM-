
export const IOS_URL = "https://apps.apple.com/cy/app/smarty-gym/id6776675309?l=el";
export const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.smartygym.webview";


export function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.103 2.715-.688 3.559-1.701" />
    </svg>
  );
}

export function GooglePlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 2 L12.5 12 L3 22 Z" fill="#00A0FF" />
      <path d="M3 2 L17 8.1 L12.5 12 Z" fill="#00E676" />
      <path d="M3 22 L17 15.9 L12.5 12 Z" fill="#FF3A44" />
      <path d="M12.5 12 L17 8.1 L21.5 12 L17 15.9 Z" fill="#FFBC00" />
    </svg>
  );
}

// Store marks only — no card, no labels — sitting flat against the footer.
export function StoreBadges() {
  return (
    <div className="hidden md:flex items-center gap-4 pt-1">
      <a
        href={IOS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download SmartyGym on the App Store"
        className="transition-opacity hover:opacity-70"
      >
        <AppleMark className="h-6 w-6 text-foreground" />
      </a>

      <a
        href={ANDROID_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get SmartyGym on Google Play"
        className="transition-opacity hover:opacity-70"
      >
        <GooglePlayMark className="h-6 w-6" />
      </a>
    </div>
  );
}
