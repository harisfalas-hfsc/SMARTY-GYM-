import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.[name];
}
function projectUrl() {
  const value = runtimeEnv("SUPABASE_URL") ?? runtimeEnv("VITE_SUPABASE_URL") ?? import.meta.env.VITE_SUPABASE_URL;
  if (!value) throw new Error("Account services unavailable.");
  return value;
}
function publishableKey() {
  const direct = runtimeEnv("SUPABASE_PUBLISHABLE_KEY") ?? runtimeEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (direct) return direct;
  try {
    const keys: unknown = JSON.parse(runtimeEnv("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    if (keys && typeof keys === "object") {
      const key = Object.values(keys).find((v): v is string => typeof v === "string" && v.startsWith("sb_publishable_"));
      if (key) return key;
    }
  } catch { /* Use configured fallback. */ }
  const key = runtimeEnv("SUPABASE_ANON_KEY") ?? runtimeEnv("VITE_SUPABASE_ANON_KEY") ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Account services unavailable.");
  return key;
}
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token || !ctx.isAuthenticated()) throw new Error("Sign in to connect your account.");
  return createClient(projectUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}