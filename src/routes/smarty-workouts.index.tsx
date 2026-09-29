import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Dumbbell, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import {
  SMARTY_WORKOUT_CATEGORIES,
  listSmartyWorkouts,
  type SmartyWorkoutCard,
} from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { difficultyLabel } from "@/lib/workout/spec";
import pageHeroImage from "@/assets/smarty-workouts-card.jpg";

export const Route = createFileRoute("/smarty-workouts/")({
  head: () => ({
    meta: [
      { name: "keywords", content: withExtendedKeywords("/smarty-workouts", "ready workouts, smarty workouts") },
      { title: "Smarty Workouts — Ready Workouts by Haris Falas | SMARTYGYM" },
      {
        name: "description",
        content:
          "Ready-made workouts by Coach Haris Falas in eight categories: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability and Pilates.",
      },
      { property: "og:title", content: "Smarty Workouts — Ready Workouts | SMARTYGYM" },
      {
        property: "og:description",
        content: "Ready workouts by Haris Falas in eight training categories.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/smarty-workouts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/smarty-workouts" }],
  }),
  component: SmartyWorkoutsPage,
});

function SmartyWorkoutsPage() {
  const [rows, setRows] = useState<SmartyWorkoutCard[] | null>(null);

  useEffect(() => {
    void listSmartyWorkouts()
      .then((r) => setRows(r.workouts))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader
        image={pageHeroImage}
        eyebrow="SMARTYGYM"
        title="Smarty Workouts"
        subtitle="Ready workouts designed by Haris Falas. Pick a category and start training."
      />

      {rows === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">
          {SMARTY_WORKOUT_CATEGORIES.map((cat) => {
            const list = rows.filter((w) => w.category === cat);
            return (
              <section key={cat}>
                <h2 className="mb-3 text-xl font-extrabold tracking-tight">{categoryLabel(cat)}</h2>
                {list.length === 0 ? (
                  <p className="rounded-2xl border-2 border-dashed border-blue-300 p-5 text-sm text-muted-foreground dark:border-blue-500/40">
                    Coming soon.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((w) => (
                      <Link
                        key={w.id}
                        to="/smarty-workouts/$workoutId"
                        params={{ workoutId: w.id }}
                        className="group overflow-hidden rounded-3xl border-2 border-blue-400 bg-card transition hover:shadow-lg"
                      >
                        <div className="aspect-[3/2] bg-muted">
                          {w.image_url && (
                            <img src={w.image_url} alt={w.name} loading="lazy" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-bold leading-snug">{w.name}</p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{w.duration_min} min</span>
                            <span>{difficultyLabel(w.difficulty_stars)}</span>
                            {w.equipment.length > 0 && (
                              <span className="inline-flex items-center gap-1 capitalize"><Dumbbell className="h-3.5 w-3.5" />{w.equipment.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
