import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { claimReferral, trackReferralClick } from "@/lib/partners/partners.functions";
import { normalizePartnerCode, REFERRAL_STORAGE_KEY, REFERRAL_WINDOW_MS } from "@/lib/partners/commission";

type Stored = { code: string; at: number };

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    if (!v?.code || Date.now() - Number(v.at) > REFERRAL_WINDOW_MS) {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

/** Remembers ?ref=code for 30 days and links it to the member once signed in. Renders nothing. */
export function ReferralCapture() {
  const { user } = useAuth();
  const track = useServerFn(trackReferralClick);
  const claim = useServerFn(claimReferral);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = normalizePartnerCode(url.searchParams.get("ref") ?? "");
    if (!code) return;
    const current = readStored();
    if (current?.code !== code) {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code, at: Date.now() }));
      void track({ data: { code } }).catch(() => {});
    }
    url.searchParams.delete("ref");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [track]);

  useEffect(() => {
    if (!user) return;
    const stored = readStored();
    if (!stored) return;
    void claim({ data: { code: stored.code } })
      .then(() => window.localStorage.removeItem(REFERRAL_STORAGE_KEY))
      .catch(() => {});
  }, [user, claim]);

  return null;
}
