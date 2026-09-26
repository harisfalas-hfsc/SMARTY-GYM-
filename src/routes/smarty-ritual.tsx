import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Crown, Loader2, Lock, Moon, Sparkles, Sun, Sunrise, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTodaysRitual } from "@/lib/ritual.functions";
import { RitualHTML } from "@/components/ritual/RitualHTML";
import { MembershipRequiredDialog } from "@/components/MembershipRequiredDialog";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/smarty-ritual")({
  component: SmartyRitualPage,
  head: () => ({
    meta: [
      { title: "Smarty Ritual | Daily Movement System | SmartyGym" },
      { name: "description", content: "Your daily Morning, Midday and Evening ritual for movement, recovery and performance, designed by Haris Falas." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Smarty Ritual | SmartyGym" },
      { property: "og:description", content: "Daily Morning, Midday and Evening ritual designed by Haris Falas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PHASES = [
  { key: "morning_content", title: "Morning Ritual", time: "~8:00 AM • Start Strong", Icon: Sunrise, tone: "bg-orange-100 dark:bg-orange-900/20 text-orange-500" },
  { key: "midday_content", title: "Midday Ritual", time: "~1:00 PM • Reset & Reload", Icon: Sun, tone: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600" },
  { key: "evening_content", title: "Evening Ritual", time: "~8:00 PM • Unwind & Recover", Icon: Moon, tone: "bg-purple-100 dark:bg-purple-900/20 text-purple-600" },
] as const;

function SmartyRitualPage() {
  const { user, loading: authLoading } = useAuth();
  const fetchRitual = useServerFn(getTodaysRitual);
  const { data, isLoading } = useQuery({
    queryKey: ["smarty-ritual", user?.id],
    queryFn: () => fetchRitual(),
    enabled: !authLoading && Boolean(user),
  });
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);

  const dateLabel = data
    ? new Date(`${data.today}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-6xl lg:px-8 lg:py-16">
      <PageHeader
        eyebrow="Smarty Ritual"
        title={<>Move. Reset. <span className="text-primary">Recover.</span></>}
        subtitle={<>Your daily Morning, Midday and Evening plan for movement, recovery and performance, designed by <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>.</>}
      />

      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8">
          {data?.ritual && (
            <Button variant="outline" size="sm" className="absolute right-4 top-4" onClick={() => setReaderOpen(true)}>
              <BookOpen className="mr-2 h-4 w-4" /> Reader
            </Button>
          )}
          <div className="flex flex-col items-center text-center">
            <Sparkles aria-label="Smarty Ritual" className="mb-3 h-16 w-16 text-purple-500 sm:h-20 sm:w-20" />
            <p className="mb-2 text-sm text-muted-foreground">
              Designed by <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>
            </p>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
              Daily <span className="text-primary">Smarty</span> Ritual
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">Your all-day game plan for movement, recovery, and performance</p>
            {dateLabel && <p className="mt-3 text-sm font-semibold">{dateLabel}</p>}
          </div>
        </div>

        {authLoading || (Boolean(user) && isLoading) ? (
          <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !user || data?.locked ? (
          <div className="bg-muted/50 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="mb-2 text-xl font-semibold">Premium members only</h3>
                <p className="mb-4 max-w-md text-muted-foreground">
                  The Daily Smarty Ritual is part of SmartyGym Premium. Become a member to unlock a fresh ritual every day.
                </p>
                {user ? (
                  <Button onClick={() => setMembershipOpen(true)}>
                    <Crown className="mr-2 h-4 w-4" /> Become a member
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/auth" search={{ next: "/smarty-ritual", mode: "signup" }}>
                      <Crown className="mr-2 h-4 w-4" /> Become a member
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : !data?.ritual ? (
          <div className="bg-muted/50 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Today's Ritual is Being Prepared</h3>
              <p className="max-w-md text-muted-foreground">Check back shortly!</p>
            </div>
          </div>
        ) : (
          <CardContent className="space-y-8 p-6">
            {PHASES.map(({ key, title, time, Icon, tone }, i) => (
              <div key={key} className="space-y-4">
                {i > 0 && <Separator className="mb-8" />}
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${tone}`}><Icon className="h-6 w-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{time}</p>
                  </div>
                </div>
                <div className="sm:pl-12"><RitualHTML html={data.ritual![key]} /></div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
      {data?.ritual && (
        <Dialog open={readerOpen} onOpenChange={setReaderOpen}>
          <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 text-foreground sm:h-[92vh] sm:w-[min(760px,calc(100%-2rem))] sm:rounded-2xl sm:border [&>button:last-child]:hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <DialogTitle className="text-base font-bold">
                 Daily Smarty Ritual
              </DialogTitle>
              <Button variant="ghost" size="icon" aria-label="Close reader" onClick={() => setReaderOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
              <p className="mb-6 text-sm text-muted-foreground">{dateLabel}</p>
              {PHASES.map(({ key, title, time, Icon, tone }, i) => (
                <section key={key} className={i > 0 ? "mt-8 border-t border-border pt-8" : ""}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-full p-2 ${tone}`}><Icon className="h-6 w-6" /></div>
                    <div>
                      <h2 className="text-xl font-bold">{title}</h2>
                      <p className="text-sm text-muted-foreground">{time}</p>
                    </div>
                  </div>
                  <div className="text-base leading-relaxed [&_.prose]:text-base">
                    <RitualHTML html={data.ritual![key]} />
                  </div>
                </section>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <MembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        title="Unlock the Daily Smarty Ritual"
      />
    </div>
  );
}
