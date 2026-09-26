import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Clock, Crown, Loader2, Lock, Moon, Share2, Sparkles, Sun, Sunrise } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTodaysRitual } from "@/lib/ritual.functions";
import { RitualHTML } from "@/components/ritual/RitualHTML";
import { MembershipRequiredDialog } from "@/components/MembershipRequiredDialog";

export const Route = createFileRoute("/_authenticated/smarty-ritual")({
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
  const fetchRitual = useServerFn(getTodaysRitual);
  const { data, isLoading } = useQuery({ queryKey: ["smarty-ritual"], queryFn: () => fetchRitual() });
  const [membershipOpen, setMembershipOpen] = useState(false);

  const dateLabel = data
    ? new Date(`${data.today}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  async function share() {
    const url = `${window.location.origin}/smarty-ritual`;
    const text = "My Daily Smarty Ritual on SmartyGym";
    try {
      if (navigator.share) await navigator.share({ title: "Smarty Ritual", text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6">
      <Card className="mb-6 border-2 border-primary/40">
        <div className="p-4 text-center sm:p-5">
          <h2 className="mb-3 text-xl font-extrabold uppercase tracking-tight sm:text-2xl">Smarty Ritual</h2>
          <p className="text-sm font-bold text-muted-foreground sm:text-base">
            Your all-day game plan for movement, recovery, and performance. Each day brings a fresh ritual with three expertly designed phases:
          </p>
          <div className="mt-4 grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-3">
            <span className="flex items-center gap-2 text-sm font-bold"><Sunrise className="h-4 w-4 text-orange-500" /> Morning: Activation</span>
            <span className="flex items-center gap-2 text-sm font-bold"><Sun className="h-4 w-4 text-yellow-600" /> Midday: Reset</span>
            <span className="flex items-center gap-2 text-sm font-bold"><Moon className="h-4 w-4 text-purple-600" /> Evening: Unwind</span>
          </div>
          <p className="mt-4 text-sm font-semibold sm:text-base">
            Designed by <Link to="/haris-falas" className="text-primary hover:underline">Haris Falas</Link> to keep you energized, mobile, and performing at your best.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8">
          {data?.ritual && (
            <Button variant="outline" size="sm" className="absolute right-4 top-4" onClick={share}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          )}
          <div className="flex flex-col items-center text-center">
            <Sparkles aria-label="Smarty Ritual" className="mb-3 h-16 w-16 text-purple-500 sm:h-20 sm:w-20" />
            <p className="mb-2 text-sm text-muted-foreground">
              Designed by <Link to="/haris-falas" className="font-semibold text-primary hover:underline">Haris Falas</Link>
            </p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              Daily <span className="text-primary">Smarty</span> Ritual
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">Your all-day game plan for movement, recovery, and performance</p>
            {dateLabel && <p className="mt-3 text-sm font-semibold">{dateLabel}{data?.ritual ? ` • Ritual ${data.ritual.position}` : ""}</p>}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data?.locked ? (
          <div className="bg-muted/50 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="mb-2 text-xl font-semibold">Premium members only</h3>
                <p className="mb-4 max-w-md text-muted-foreground">
                  The Daily Smarty Ritual is part of SmartyGym Premium. Become a member to unlock a fresh ritual every day.
                </p>
                <Button onClick={() => setMembershipOpen(true)}>
                  <Crown className="mr-2 h-4 w-4" /> Become a member
                </Button>
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
      <MembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        title="Unlock the Daily Smarty Ritual"
      />
    </div>
  );
}
