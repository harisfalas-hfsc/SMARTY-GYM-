/**
 * Set when the browser fails to download part of a page (bad connection or a
 * replaced file after a publish). The update notice then offers a refresh, and
 * Vite resolves the failed import as empty, so the router's follow-up
 * "reading 'component'" error is the same failure, not a new crash.
 */
let pageDownloadFailed = false;

export function markPageImportFailed() {
  pageDownloadFailed = true;
}

/** A failed route import needs a fresh document, not an in-place router retry. */
export function isRecoverablePageImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|unable to preload css|loading chunk [\w-]+ failed|chunkloaderror/i.test(message))
    return true;
  const emptyRouteModule = /reading 'component'|evaluating '[^']*\.component'/i.test(message);
  if (!emptyRouteModule) return false;
  if (pageDownloadFailed) return true;
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  return /lazyRouteComponent/.test(stack);
}
