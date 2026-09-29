/** Hand-off from the Member workouts tab: a freshly duplicated draft to open in the Smarty editor. */
let pending: string | null = null;
export const SMARTY_DRAFT_EVENT = "smarty:open-draft";

export function requestSmartyDraft(id: string) {
  pending = id;
  window.dispatchEvent(new CustomEvent(SMARTY_DRAFT_EVENT));
}

export function takeSmartyDraft(): string | null {
  const id = pending;
  pending = null;
  return id;
}
