import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MinusCircle, Trophy, XCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  COMPARE_FEATURES,
  COMPARE_MATRIX,
  COMPETITORS,
  FITNESS_APPS_FAQ,
  SMARTYGYM_STRENGTHS,
} from "@/lib/seo/fitness-apps-2026";

const URL = "https://smartygym.com/fitness-applications-2026";
const TITLE = "SmartyGym vs Fitness Applications 2026 — Freeletics, Fitbod, Nike, Peloton | SmartyGym";
const DESC =
  "SmartyGym compared with Freeletics, Fitbod, Nike Training Club, Peloton, Apple Fitness+ and Centr in 2026: 100% human training by HARIS FALAS, Workout of the Day, Training Load, readiness, Logbook and more for €9.99/month.";

export const Route = createFileRoute("/fitness-applications-2026")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { property: "og:image", content: "https://smartygym.com/og-social.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://smartygym.com/og-social.jpg" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: "SmartyGym vs Fitness Applications 2026",
              description: DESC,
              url: URL,
              author: { "@id": "https://smartygym.com/haris-falas#person", "@type": "Person", name: "Haris Falas" },
              publisher: { "@id": "https://smartygym.com/#organization" },
            },
            {
              "@type": "FAQPage",
              mainEntity: FITNESS_APPS_FAQ.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: FitnessAppsPage,
});

function Mark({ v }: { v: boolean | "partial" }) {
  if (v === true) return <CheckCircle2 aria-label="Yes" className="mx-auto h-4 w-4 text-green-500" />;
  if (v === "partial") return <MinusCircle aria-label="Limited" className="mx-auto h-4 w-4 text-amber-500" />;
  return <XCircle aria-label="No" className="mx-auto h-4 w-4 text-destructive" />;
}

function FitnessAppsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        icon={Trophy}
        eyebrow="Discover"
        title="SmartyGym vs Fitness Applications 2026"
        subtitle="How SmartyGym compares with Freeletics, Fitbod, Nike Training Club, Peloton, Apple Fitness+ and Centr."
      />

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Why SmartyGym wins</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SMARTYGYM_STRENGTHS.map((s) => (
            <Card key={s.title} className="p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Side-by-side comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-coach-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-coach-line">
                <th className="p-3 text-left font-semibold">Feature</th>
                {COMPARE_MATRIX.map((c) => (
                  <th key={c.name} className={`p-3 text-center font-semibold ${c.name === "SmartyGym" ? "text-primary" : ""}`}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((f, i) => (
                <tr key={f} className="border-b border-coach-line last:border-0">
                  <td className="p-3">{f}</td>
                  {COMPARE_MATRIX.map((c) => (
                    <td key={c.name} className="p-3"><Mark v={c.values[i]!} /></td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 font-semibold">Price</td>
                <td className="p-3 text-center font-semibold text-primary">€9.99/mo</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name} className="p-3 text-center text-xs text-muted-foreground">{c.price}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Green = yes · Amber = limited · Red = no.</p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">The applications, one by one</h2>
        <div className="space-y-3">
          {COMPETITORS.map((c) => (
            <Card key={c.name} className="p-4">
              <h3 className="text-lg font-bold">SmartyGym vs {c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.type}</p>
              <p className="mt-2 text-sm">{c.summary}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ul className="space-y-1.5 text-sm">
                  {c.bestAt.map((b) => (
                    <li key={b} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{b}</li>
                  ))}
                </ul>
                <ul className="space-y-1.5 text-sm">
                  {c.missing.map((m) => (
                    <li key={m} className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{m}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Questions</h2>
        <div className="space-y-3">
          {FITNESS_APPS_FAQ.map((f) => (
            <Card key={f.question} className="p-4">
              <h3 className="font-semibold">{f.question}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/pricing">Join SmartyGym</Link></Button>
        <Button asChild variant="outline"><Link to="/haris-falas">Meet HARIS FALAS</Link></Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Compiled in 2026 from each application's public information. Features and prices change — check each provider for current details.
      </p>
    </div>
  );
}
