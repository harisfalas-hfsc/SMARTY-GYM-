import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { clearPasswordChangeRequirement } from "@/lib/account.functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_TEMP_PASSWORD } from "@/lib/complimentary";
import { toast } from "sonner";

/** Members created by the admin with a temporary password must set their own before continuing. */
export function PasswordChangeGate() {
  const [required, setRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const check = (meta: Record<string, unknown> | undefined) => setRequired(meta?.must_change_password === true);
    void supabase.auth.getSession().then(({ data }) => check(data.session?.user.app_metadata));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => check(session?.user.app_metadata));
    return () => data.subscription.unsubscribe();
  }, []);

  async function save() {
    setError(null);
    if (password.length < MIN_TEMP_PASSWORD) return setError(`Use at least ${MIN_TEMP_PASSWORD} characters.`);
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const result = await clearPasswordChangeRequirement();
      if ("error" in result) throw new Error(result.error);
      await supabase.auth.refreshSession();
      setRequired(false);
      toast.success("Your new password is saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={required}>
      <DialogContent className="[&>button]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose your own password</DialogTitle>
          <DialogDescription>
            Welcome to SMARTYGYM. You signed in with a temporary password — please set your own to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" autoComplete="new-password" placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
