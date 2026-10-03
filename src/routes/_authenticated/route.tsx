import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { isOnline } from "@/lib/connectivity";
import { VisitorPagePreview } from "@/components/VisitorPagePreview";

/** Signed-out visitors see a description of the page instead of being sent away; member data loads only with a session (server checks still apply). */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isSupabaseConfigured()) return { user: null };
    if (!isOnline()) {
      const { data: local } = await supabase.auth.getSession();
      return { user: local.session?.user ?? null };
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
      if (error) throw error;
    } catch {
      const { data: local } = await supabase.auth.getSession();
      if (local.session?.user) return { user: local.session.user };
    }
    return { user: null };
  },
  component: AuthLayout,
});

/** Pages visitors can fully explore; the Premium step inside asks them to join. */
const EXPLORABLE = ["/create-your-own-workout"];

function AuthLayout() {
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname }).replace(/\/$/, "");
  if (!user && isSupabaseConfigured() && !EXPLORABLE.includes(pathname)) {
    const base = pathname.startsWith("/workout/") ? "/workout" : pathname;
    return <VisitorPagePreview pathname={base} />;
  }
  return <Outlet />;
}
