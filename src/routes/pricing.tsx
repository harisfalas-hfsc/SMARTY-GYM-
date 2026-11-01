import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MembershipCheckoutDialog } from "@/components/MembershipCheckoutDialog";
import { SmartyCard, SmartyPill } from "@/components/SmartyCard";
import { PageHeader } from "@/components/PageHeader";
import pageHeroImage from "@/assets/premium-membership-card.jpg";

export const Route = createFileRoute("/pricing")({
  // While Global Free Access Mode is ON there is no purchase path at all:
  // the pricing page itself must not exist for visitors.
  beforeLoad: async () => {
    let free = false;
    try {
      const { getFreeAccessMode } = await import("@/lib/free-access.functions");
      free = (await getFreeAccessMode()).freeAccessMode;
    } catch {
      free = false;
    }
    if (free) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Pricing — SmartyGym subscription €9.99/month" },
      {
        name: "description",
        content:
          "SmartyGym membership: €9.99 per month for more than 600 Smarty Workouts, Workout of the Day, your personal Smarty Coach, Smarty Rituals and Check-ins, the full exercise library, Logbook and progress, Smarty Tools and blog articles.",
      },

      { property: "og:title", content: "SmartyGym Pricing — €9.99/month" },
      {
        property: "og:description",
        content: "More than 600 Smarty Workouts, Workout of the Day, your personal Smarty Coach, Smarty Rituals and Check-ins, the full exercise library, Logbook and progress, Smarty Tools and blog articles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://smartygym.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: "SmartyGym Subscription",
              description:
                "One SmartyGym membership includes more than 600 Smarty Workouts, Workout of the Day, your personal Smarty Coach, Smarty Rituals and Check-ins, the full exercise library, Logbook and progress, Smarty Tools and blog articles.",
              brand: { "@id": "https://smartygym.com/#organization" },
              category: "Fitness subscription",
              image: "https://smartygym.com/og-social.jpg",
              offers: {
                "@type": "Offer",
                price: "9.99",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
                url: "https://smartygym.com/pricing",
                category: "subscription",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "9.99",
                  priceCurrency: "EUR",
                  billingIncrement: 1,
                  unitCode: "MON",
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                { "@type": "ListItem", position: 2, name: "Pricing", item: "https://smartygym.com/pricing" },
              ],
            },
          ],
        }),
      },
    ],
  }),

  component: PricingPage,
});

const INCLUDES: { icon: string; label: string }[] = [
  { icon: "🏋️", label: "More than 600 Smarty Workouts" },
  { icon: "📅", label: "Workout of the Day" },
  { icon: "🧠", label: "Your personal Smarty Coach" },
  { icon: "☀️", label: "Smarty Rituals and Check-ins" },
  { icon: "📚", label: "Full exercise library" },
  { icon: "📓", label: "Logbook and progress" },
  { icon: "⏱️", label: "Smarty Tools" },
  { icon: "📰", label: "Blog articles" },
];

function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader image={pageHeroImage}
        eyebrow="Pricing"
        title={
          <>
            One subscription
            <br />
            <span className="text-primary">Everything included</span>
          </>
        }
        subtitle="Train with Smarty Coach every day — no add-ons, no upsells."
      />

      <SmartyCard
        tone="pink"
        eyebrow="Membership"
        eyebrowIcon="👑"
        title="€9.99"
        accent="per month."
        description="All your SmartyGym benefits in one membership. Cancel anytime."
      >
        <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Your membership includes
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDES.map((it) => (
                <SmartyPill tone="pink" key={it.label} icon={it.icon}>
                  {it.label}
                </SmartyPill>
              ))}
            </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={() => {
              if (user) setCheckoutOpen(true);
              else void navigate({ to: "/auth", search: { mode: "signup" } });
            }}
          >
            Subscribe · €9.99 / month
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Flow: create your account → complete the mandatory Training Profile → activate Premium → choose Workout of the Day or create a workout.
        </p>
      </SmartyCard>
      <MembershipCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
