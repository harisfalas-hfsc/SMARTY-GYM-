// Payments have been removed: free access is always on.
export const FREE_ACCESS_SETTING_KEY = "free_access_mode";

export async function fetchFreeAccessMode(_force = false): Promise<boolean> {
  return true;
}

export function seedFreeAccessMode(_value: boolean) {
  /* no-op: free access is always on */
}

export function setFreeAccessModeCache(_value: boolean) {
  /* no-op: free access is always on */
}

export function useFreeAccessMode(): { freeAccessMode: boolean; loading: boolean } {
  return { freeAccessMode: true, loading: false };
}
