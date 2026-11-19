export const CHECKINS_CHANGED = "smarty:checkins-changed";

export function subscribeToCheckinChanges(target: EventTarget, onChange: () => void) {
  target.addEventListener(CHECKINS_CHANGED, onChange);
  return () => target.removeEventListener(CHECKINS_CHANGED, onChange);
}