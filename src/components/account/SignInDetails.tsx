import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lets a signed-in member change their sign-in email and password. */
export function SignInDetails({ email }: { email: string | null | undefined }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"email" | "password" | null>(null);

  async function changeEmail() {
    const next = newEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(next)) return toast.error("Enter a valid email address.");
    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email: next },
      { emailRedirectTo: `${window.location.origin}/account` },
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    setNewEmail("");
    toast.success("Check your inbox to confirm the new email address.");
  }

  async function changePassword() {
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    if (password !== confirm) return toast.error("The two passwords don't match.");
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return toast.error(error.message);
    setPassword("");
    setConfirm("");
    toast.success("Your password has been changed.");
  }

  return (
    <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
      <p className="font-bold">Sign-in details</p>
      <p className="mt-1 text-sm text-muted-foreground">Current email: {email ?? "—"}</p>
      <div className="mt-3 grid gap-2">
        <Input
          type="email"
          placeholder="New email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          autoComplete="email"
        />
        <Button variant="secondary" className="h-11 rounded-2xl" disabled={busy !== null} onClick={changeEmail}>
          {busy === "email" ? "Sending…" : "Change email"}
        </Button>
      </div>
      <div className="mt-4 grid gap-2">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        <Button variant="secondary" className="h-11 rounded-2xl" disabled={busy !== null} onClick={changePassword}>
          {busy === "password" ? "Saving…" : "Change password"}
        </Button>
      </div>
    </section>
  );
}
