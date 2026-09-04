// Payments have been removed from this project: every signed-in member has
// full access. These helpers stay so existing call sites keep working.
export const FREE_ACCESS_SETTING_KEY = "free_access_mode";

export async function isFreeAccessMode(): Promise<boolean> {
  return true;
}

export async function setFreeAccessMode(_value: boolean): Promise<boolean> {
  return true;
}

/** JSON body returned by any legacy billing entry point. */
export const FREE_ACCESS_BLOCK = {
  error: "All content is free for signed-in members. No purchase is required.",
  freeAccessMode: true as const,
};
