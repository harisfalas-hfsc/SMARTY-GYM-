/**
 * Server-only admin allow-list.
 * Kept in a *.server.ts module so these addresses are never shipped in the
 * client bundle. Client code must resolve admin status through a server call.
 * 
 * Note: A migration has been added to automatically promote the first signed-up 
 * user to admin in the database.
 */
export const ADMIN_EMAILS: string[] = [];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
