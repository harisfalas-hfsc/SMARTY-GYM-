import { loadRemote } from "@/lib/remote-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOutAndClearDevice } from "@/lib/sign-out";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  Mail,
  User,
  ClipboardList,
  Trash2,
  CreditCard,
  ExternalLink,
  Crown,
  Zap,
} from "lucide-react";
import { DailyCoachingSettings } from "@/components/DailyCoachingSettings";
import { getMyAccessState } from "@/lib/access.functions";
import { deleteMyAccount } from "@/lib/account.functions";
import {
  getMyMembership,
  createPortalSession,
  setMembershipCancellation,
  type MyMembership,
} from "@/utils/payments.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { formatDateLong } from "@/lib/date-format";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";
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
      { title: "My account — Smarty Gym" },
      {
        name: "description",
        content: "Manage your Smarty Gym account, profile details and sign-in.",
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
  const { freeAccessMode } = useFreeAccessMode();
  const [membership, setMembership] = useState<MyMembership | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);


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

  const refreshMembership = useCallback(async () => {
    if (freeAccessMode) return;
    try {
      setMembership(await getMyMembership());
    } catch {
      setMembership(null);
    }
  }, [freeAccessMode]);

  useEffect(() => {
    void refreshMembership();
  }, [refreshMembership, user?.id]);

  async function openPortal() {
    setPortalBusy(true);
    try {
      const result = await createPortalSession({
        data: { returnUrl: `${window.location.origin}/account`, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the billing portal");
    } finally {
      setPortalBusy(false);
    }
  }

  async function toggleCancellation(cancel: boolean) {
    setCancelBusy(true);
    try {
      const result = await setMembershipCancellation({
        data: { cancel, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      toast.success(
        cancel
          ? "Membership will end at the end of your billing period."
          : "Membership renewal restored.",
      );
      await Promise.all([refresh(), refreshMembership()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update your membership");
    } finally {
      setCancelBusy(false);
    }
  }

  const renewLabel = membership?.currentPeriodEnd
    ? formatDateLong(new Date(membership.currentPeriodEnd))
    : null;

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
        eyebrow="Smarty Gym"
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
          <Button asChild variant="secondary" className="h-12 rounded-2xl border-2 border-primary">
            <Link to="/profile">
              <ClipboardList className="mr-2 h-4 w-4" /> Training profile
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-12 rounded-2xl border-2 border-primary">
            <Link to="/logbook" search={{ filter: "all" as const, view: "list" as const }}>
              Logbook{count !== null ? ` (${count})` : ""}
            </Link>
          </Button>
        </div>
      </section>

      <DailyCoachingSettings premium={premium === true} />

      {freeAccessMode || !paymentsConfigured() ? null : (
        <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">Subscription</p>
              <p className="text-sm text-muted-foreground">Smarty Gym · €9.99 / month</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {premium === null
              ? "Checking your membership…"
              : premium
                ? membership?.cancelAtPeriodEnd
                  ? `Your membership is active but set to end${renewLabel ? ` on ${renewLabel}` : ""}. You keep full access until then.`
                  : `Your membership renews automatically every month${renewLabel ? ` — next payment on ${renewLabel}` : ""}. Cancel anytime.`
                : "You don't have an active membership yet. Subscribe to unlock Smarty Coach, Workout of the Day and your full history."}
          </p>

          {premium ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Includes {quota?.limit ?? 2} coach workout generations per day plus your Workout of
              the Day
              {quota ? ` — ${Math.max(0, quota.limit - quota.used)} left today.` : "."}
            </p>
          ) : null}

          {premium && membership?.hasBilling ? (
            <div className="mt-4">
              <Button
                variant="secondary"
                className="h-12 w-full rounded-2xl sm:w-auto"
                disabled={cancelBusy}
                onClick={() => void toggleCancellation(!membership?.cancelAtPeriodEnd)}
              >
                {cancelBusy
                  ? "Saving…"
                  : membership?.cancelAtPeriodEnd
                    ? "Resume membership"
                    : "Cancel membership"}
              </Button>
            </div>
          ) : null}
        </section>
      )}



      <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
        <p className="font-bold">Need a hand?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything in Smarty Gym is free for members.
        </p>
        <Button asChild variant="secondary" className="mt-4 h-12 rounded-2xl">
          <Link to="/contact">
            <Mail className="mr-2 h-4 w-4" /> Contact support
          </Link>
        </Button>
      </section>


      {freeAccessMode || !paymentsConfigured() ? null : (
        <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Manage my membership</p>
              <p className="text-sm text-muted-foreground">
                {membership?.status === "past_due" || membership?.status === "unpaid"
                  ? "A payment did not go through. Update your card or pay the open invoice to keep your membership."
                  : membership?.cancelAtPeriodEnd && membership?.currentPeriodEnd
                    ? `Your membership ends on ${new Date(membership.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                    : membership?.status === "active" || membership?.status === "trialing"
                      ? membership?.currentPeriodEnd
                        ? `Active — renews on ${new Date(membership.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                        : "Your membership is active."
                      : "€9.99 per month. Cancel any time."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {membership?.hasBilling ? (
              <Button
                variant="secondary"
                className="h-12 rounded-2xl"
                disabled={portalBusy}
                onClick={() => void openPortal()}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {portalBusy ? "Opening…" : "Update card, invoices & cancel"}
              </Button>
            ) : null}
            {membership?.status === "active" || membership?.status === "trialing" ? null : (
              <Button className="h-12 rounded-2xl" onClick={() => setCheckoutOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                {membership?.hasBilling ? "Pay & restart membership" : "Subscribe · €9.99 / month"}
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            In the billing portal you can update your card, settle an unpaid invoice, download your
            receipts or cancel your renewal. Deleting your account cancels your membership
            automatically.
          </p>
          <MembershipCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
        </section>
      )}

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
