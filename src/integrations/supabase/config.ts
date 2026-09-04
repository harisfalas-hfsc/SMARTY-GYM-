// Companion to the auto-generated client.ts (which must not be edited).
// Reports whether the Lovable Cloud backend environment is available.
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const publishableKey =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

  return Boolean(url && publishableKey);
}
