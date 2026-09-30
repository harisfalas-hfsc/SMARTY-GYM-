const COVER_PREFIX = "/api/public/workout-cover/";

/**
 * Smaller WebP copy of a stored workout cover (640 for cards, 1280 for large
 * views). Returns the original for any other address; callers fall back to
 * the original on load error, so covers without a small copy still show.
 */
export function coverVariant(url: string | null | undefined, width: 640 | 1280): string | null {
  if (!url) return null;
  if (!url.startsWith(COVER_PREFIX) || /-(640|1280)\.webp$/i.test(url)) return url;
  return url.replace(/\.(png|jpe?g|webp)$/i, `-${width}.webp`);
}

/** onError handler: swap a missing small copy for the original picture once. */
export function fallbackTo(original: string | null | undefined) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (original && img.dataset.fallback !== "1") {
      img.dataset.fallback = "1";
      img.src = original;
    }
  };
}
