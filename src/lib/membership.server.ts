// Server-side membership boundary for member-only training data and actions.
// Mirrors public.has_active_membership() in the database, so the screen, the
// server functions and direct database reads all agree.
export const MEMBERSHIP_REQUIRED_MESSAGE =
  "An active SmartyGym membership is required. Your saved data is kept — renew to open it again.";

export async function requireActiveMembership(context: { supabase: unknown; userId: string }) {
  const { getAccessStateForUser } = await import("@/lib/eligibility.server");
  const access = await getAccessStateForUser(context.supabase as never, context.userId);
  if (!access.premium) throw new Error(MEMBERSHIP_REQUIRED_MESSAGE);
  return access;
}
