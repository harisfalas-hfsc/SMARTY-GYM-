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

function AuthLayout() {
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user && isSupabaseConfigured()) {
    const base = pathname.startsWith("/workout/") ? "/workout" : pathname.replace(/\/$/, "");
    return <VisitorPagePreview pathname={base} />;
  }
  return <Outlet />;
}
