export const WOD_PHOTO_INTERVAL_MS = 1_500;

/** Rotate only the published daily pictures; a recovery day has one picture. */
export function wodPhotoAt(photos: readonly string[], elapsedMs: number, fallback: string) {
  if (photos.length === 0) return fallback;
  const index = Math.floor(Math.max(0, elapsedMs) / WOD_PHOTO_INTERVAL_MS) % photos.length;
  return photos[index] ?? fallback;
}