import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Loader2, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { MembershipRequiredDialog } from "@/components/MembershipRequiredDialog";
import { CheckinsPanel } from "@/components/checkins/CheckinsPanel";
import { getCheckinAccess } from "@/lib/checkins.functions";
import { useAuth } from "@/hooks/useAuth";
import pageHeroImage from "@/assets/explore-checkins.jpg";

export const Route = createFileRoute("/smarty-checkins")({
  component: SmartyCheckinsPage,
  head: () => ({
    meta: [
      { title: "Smarty Check-ins | Daily Readiness Score | SmartyGym" },
      {
        name: "description",
        content:
          "Morning and night Smarty Check-ins: sleep, readiness, soreness, mood, movement, hydration and strain turned into one daily Smarty Score that guides your training.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Smarty Check-ins | SmartyGym" },
      { property: "og:description", content: "Two 30-second check-ins a day and one Smarty Score that guides your training." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SmartyCheckinsPage() {
  const { user, loading: authLoading } = useAuth();
  const fetchAccess = useServerFn(getCheckinAccess);
  const { data, isLoading } = useQuery({
    queryKey: ["checkin-access", user?.id],
    queryFn: () => fetchAccess(),
    enabled: !authLoading && Boolean(user),
  });
  const [membershipOpen, setMembershipOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader
        image={pageHeroImage}
        eyebrow="Smarty Check-ins"
        title={<>Check in. Score. <span className="text-primary">Train smarter.</span></>}
        subtitle={<>Two 30-second check-ins a day turn how you slept, feel and lived into one Smarty Score, designed by <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>.</>}
      />

      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
            How <span className="text-primary">Smarty</span> Check-ins work
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW.map(({ Icon, title, time, desc }) => (
              <div key={title} className="rounded-2xl border-2 border-blue-400 bg-card p-4">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-2 font-bold">{title}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{time}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {authLoading || (Boolean(user) && isLoading) ? (
        <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !user || !data?.premium ? (
        <Card className="bg-muted/50 p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Lock className="h-12 w-12 text-muted-foreground" />
            {user ? (
              <div>
                <h3 className="mb-2 text-xl font-semibold">Premium access required</h3>
                <p className="mb-4 max-w-md text-muted-foreground">
                  Your account does not currently include Smarty Check-ins. View the Premium option to start checking in.
                </p>
                <Button onClick={() => setMembershipOpen(true)}>
                  <Crown className="mr-2 h-4 w-4" /> View Premium option
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="mb-2 text-xl font-semibold">Log in to continue</h3>
                <p className="mb-4 max-w-md text-muted-foreground">
                  Smarty Check-ins are for Premium members. Log in to check your access.
                </p>
                <Button asChild>
                  <Link to="/auth" search={{ next: "/smarty-checkins", mode: "signin" }}>
                    <LogIn className="mr-2 h-4 w-4" /> Log in
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <CheckinsPanel />
      )}

      <MembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        title="Unlock Smarty Check-ins"
        description="Smarty Check-ins are included with Premium: morning and night check-ins, a daily Smarty Score, trends, insights and streak badges."
        label="Premium access"
      />
    </div>
  );
}
