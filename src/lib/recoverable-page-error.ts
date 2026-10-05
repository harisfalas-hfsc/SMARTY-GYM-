/** A failed route import needs a fresh document, not an in-place router retry. */
export function isRecoverablePageImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|loading chunk [\w-]+ failed|chunkloaderror/i.test(message))
    return true;
  // After a new publish, the router's lazy loader swallows the missing-file error
  // (it schedules its own reload) and then reads `.component` from nothing.
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  return /reading 'component'|undefined is not an object \(evaluating '[^']*\.component'\)/i.test(message) && /lazyRouteComponent/.test(stack);
}
