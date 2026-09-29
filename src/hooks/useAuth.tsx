import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import type { Session, User } from "@supabase/supabase-js";
import { isOnline } from "@/lib/connectivity";

type ProfileSummary = {
  display_name: string | null;
  avatar_url: string | null;
};

function nameFromUser(user: User | null) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const name =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;
  return name?.trim() || user.email?.split("@")[0] || null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const cacheKey = (id: string) => `smarty:profile:${id}`;

    async function loadProfile(authUser: User | null) {
      if (!authUser) {
        if (active) setProfile(null);
        return;
      }
      // Show the last known name/avatar instantly while the fresh one loads.
      try {
        const saved = localStorage.getItem(cacheKey(authUser.id));
        if (saved && active) setProfile(JSON.parse(saved) as ProfileSummary);
      } catch {
        /* ignore */
      }
      if (!isOnline()) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle();
        if (!active || !data) return;
        setProfile(data);
        try {
          localStorage.setItem(cacheKey(authUser.id), JSON.stringify(data));
        } catch {
          /* ignore */
        }
      } catch {
        /* offline — keep the saved copy */
      }
    }

    // Tell the owner about brand-new accounts (server ignores accounts older than 2 days).
    function maybeAnnounce(authUser: User | null) {
      if (!authUser?.created_at) return;
      if (Date.now() - new Date(authUser.created_at).getTime() > 2 * 86400000) return;
      const key = `smarty:signup-announced:${authUser.id}`;
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      void import("@/lib/account.functions")
        .then(({ announceNewSignup }) => announceNewSignup())
        .catch(() => undefined);
    }


    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      void loadProfile(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      void loadProfile(s?.user ?? null);
      maybeAnnounce(s?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const displayName = profile?.display_name?.trim() || nameFromUser(user);

  return { session, user, profile, displayName, loading };
}
