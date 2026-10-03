/** A failed route import needs a fresh document, not an in-place router retry. */
export function isRecoverablePageImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|loading chunk [\w-]+ failed|chunkloaderror/i.test(message);
}