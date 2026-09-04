import { loadRemote } from "@/lib/remote-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOutAndClearDevice } from "@/lib/sign-out";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Mail, User, ClipboardList, Trash2 } from "lucide-react";
import { DailyCoachingSettings } from "@/components/DailyCoachingSettings";
import { getMyAccessState } from "@/lib/access.functions";
import { deleteMyAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — Smarty Workout" },
      {
        name: "description",
        content: "Manage your Smarty Workout subscription, profile details and sign-in.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, displayName } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [premium, setPremium] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const refresh = useCallback(async () => {
    try {
      const access = await loadRemote("account:access", () => getMyAccessState(), user?.id);
      setPremium(access.premium);
      setQuota({ used: access.generationsUsedToday, limit: access.generationsLimit });
    } catch {
      setPremium(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const c = await loadRemote("account:workout-count", async () => {
        const { count, error } = await supabase
          .from("workouts")
          .select("id", { count: "exact", head: true });
        if (error) throw new Error(error.message);
        return count ?? 0;
      }, user?.id).catch(() => 0);
      setCount(c);
    })();
  }, [user?.id]);

  async function removeAccount() {
    setDeleteBusy(true);
    try {
      const result = await deleteMyAccount({ data: { confirm: confirmText.trim() } });
      if ("error" in result) throw new Error(result.error);
      await signOutAndClearDevice(user?.id, user?.email);
      window.location.href = "/";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete your account");
      setDeleteBusy(false);
    }
  }


  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-6xl lg:px-8 lg:py-16">
      <PageHeader
        className="mb-2"
        eyebrow="Smarty Workout"
        title="My account"
        subtitle="Your personal details and preferences."
      />

      <section className="mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold">{displayName ?? "Athlete"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button asChild variant="secondary" className="h-12 rounded-2xl">
            <Link to="/profile">
              <ClipboardList className="mr-2 h-4 w-4" /> Training profile
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-12 rounded-2xl">
            <Link to="/logbook" search={{ filter: "all" as const, view: "list" as const }}>
              Logbook{count !== null ? ` (${count})` : ""}
            </Link>
          </Button>
        </div>
      </section>

      <DailyCoachingSettings premium={premium === true} />

      <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
        <p className="font-bold">Need a hand?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything in Smarty Workout is free for members.
        </p>
        <Button asChild variant="secondary" className="mt-4 h-12 rounded-2xl">
          <Link to="/contact">
            <Mail className="mr-2 h-4 w-4" /> Contact support
          </Link>
        </Button>
      </section>


      <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
        <p className="font-bold">Delete account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This permanently removes your profile, workouts, logbook and notifications.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="mt-5 h-12 w-full rounded-2xl text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Type DELETE to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-12 rounded-2xl"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="h-12 rounded-2xl">Keep my account</AlertDialogCancel>
              <AlertDialogAction
                className="h-12 rounded-2xl"
                disabled={deleteBusy || confirmText.trim() !== "DELETE"}
                onClick={(e) => {
                  e.preventDefault();
                  void removeAccount();
                }}
              >
                {deleteBusy ? "Deleting…" : "Delete permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <Button
        variant="ghost"
        className="mt-6 h-12 w-full rounded-2xl text-destructive"
        onClick={async () => {
          await signOutAndClearDevice(user?.id, user?.email);
          window.location.href = "/";
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
