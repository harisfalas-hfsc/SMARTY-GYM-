export const WOD_PHOTO_INTERVAL_MS = 2_000;

export const WOD_LOADING_PHOTO = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

/** Desktop retains its original cover; mobile never flashes it while loading. */
export function wodFeaturePhotoAt(mobile: boolean | null, photos: readonly string[], elapsedMs: number, fallback: string, offset = 0) {
  if (mobile === false) return fallback;
  return wodPhotoAt(photos, elapsedMs + offset * WOD_PHOTO_INTERVAL_MS, WOD_LOADING_PHOTO);
}

/** Rotate only the published daily pictures; a recovery day has one picture. */
export function wodPhotoAt(photos: readonly string[], elapsedMs: number, fallback: string) {
  if (photos.length === 0) return fallback;
  const index = Math.floor(Math.max(0, elapsedMs) / WOD_PHOTO_INTERVAL_MS) % photos.length;
  return photos[index] ?? fallback;
}