import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyAccessState } from "@/lib/access.functions";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { isOnline } from "@/lib/connectivity";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";

/**
 * Members-only wrapper for the member's saved training data (logbook,
 * progress, saved workouts). Data is never deleted: when a membership lapses
 * it stays in the account and reappears as soon as the member renews.
 */
export function PremiumGate({
  children,
  title = "Premium access required",
  description = "Your workouts, logbook and progress are safely kept in your account. Renew your Smarty Gym membership to open them again.",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const [state, setState] = useState<"checking" | "allowed" | "locked">(
    isSupabaseConfigured() ? "checking" : "allowed",
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    void getMyAccessState({})
      .then((a) => {
        if (!active) return;
        setFailed(false);
        setState(a?.premium === true ? "allowed" : "locked");
      })
      // Offline: keep data already on the device readable. Online but the check
      // failed: stay locked and offer a retry (never assume access).
      .catch(() => {
        if (!active) return;
        if (!isOnline()) return setState("allowed");
        setFailed(true);
        setState("locked");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state === "locked" && failed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-xl font-extrabold uppercase tracking-tight">Couldn't check your membership</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
        <Button className="mt-5 h-12 rounded-2xl font-bold" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  if (state === "checking") return <div className="min-h-[50vh]" />;
  if (state === "allowed") return <>{children}</>;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-3 text-xl font-extrabold uppercase tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-5 h-12 rounded-2xl font-bold" onClick={() => setCheckoutOpen(true)}>
        Renew my membership
      </Button>
      <MembershipCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
