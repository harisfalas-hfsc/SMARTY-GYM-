import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Heart, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { equipmentBadges } from "@/lib/format/labels";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listSmartyWorkouts, type SmartyWorkoutCard } from "@/lib/smarty-workouts.functions";
import { categoryLabel } from "@/lib/smarty-workout-row";
import { CATEGORY_DETAILS, categoryFromSlug } from "@/lib/smarty-workout-categories";
import { CATEGORY_FORMATS, difficultyLabel, type Category } from "@/lib/workout/spec";

export const Route = createFileRoute("/smarty-workouts/category/$category")({
  loader: ({ params }) => {
    const category = categoryFromSlug(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    const label = loaderData ? categoryLabel(loaderData.category) : "Smarty Workouts";
    const title = `${label} Workouts — Smarty Workouts | SMARTYGYM`;
    const description = loaderData
      ? `${CATEGORY_DETAILS[loaderData.category].description} Ready ${label.toLowerCase()} workouts by Haris Falas.`
      : "Ready workouts by Haris Falas.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: `https://smartygym.com/smarty-workouts/category/${params.category}` }],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-extrabold">Category not found</h1>
      <Link to="/smarty-workouts" className="mt-4 inline-block text-primary">← Smarty Workouts</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-extrabold">Something went wrong</h1>
      <Link to="/smarty-workouts" className="mt-4 inline-block text-primary">← Smarty Workouts</Link>
    </div>
  ),
  component: CategoryPage,
});

const ALL = "all";

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const detail = CATEGORY_DETAILS[category];
  const [rows, setRows] = useState<SmartyWorkoutCard[] | null>(null);
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState(ALL);
  const [duration, setDuration] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [format, setFormat] = useState(ALL);
  // Strength, Muscle Building, Mobility & Stability and Pilates are always sets & reps.
  const showFormat = (CATEGORY_FORMATS[category as Category] ?? []).length > 1;

  useEffect(() => {
    void listSmartyWorkouts()
      .then((r) => setRows(r.workouts.filter((w) => w.category === category)))
      .catch(() => setRows([]));
  }, [category]);

  // The member's own progress on each ready workout (done / favourite).
  const { user } = useAuth();
  const [mineById, setMine] = useState<Record<string, { done: boolean; fav: boolean }>>({});
  useEffect(() => {
    if (!user) { setMine({}); return; }
    void supabase
      .from("workouts")
      .select("created_by,status,is_favorite")
      .like("created_by", "smarty:%")
      .then(({ data }) => {
        const map: Record<string, { done: boolean; fav: boolean }> = {};
        for (const r of data ?? []) {
          const id = String(r.created_by).slice(7);
          const cur = map[id] ?? { done: false, fav: false };
          map[id] = { done: cur.done || r.status === "completed", fav: cur.fav || Boolean(r.is_favorite) };
        }
        setMine(map);
      });
  }, [user]);

  const formats = useMemo(() => [...new Set((rows ?? []).map((r) => r.format).filter((v): v is string => Boolean(v)))], [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((w) => {
      if (q && !`${w.name} ${w.format ?? ""} ${w.equipment.join(" ")}`.toLowerCase().includes(q)) return false;
      const bw = w.equipment.length === 0 || w.equipment.every((i) => i.toLowerCase() === "bodyweight");
      if (equipment === "bodyweight" && !bw) return false;
      if (equipment === "equipment" && bw) return false;
      if (duration !== ALL) {
        const [min, max] = duration.split("-").map(Number);
        if (w.duration_min < min || w.duration_min > max) return false;
      }
      if (difficulty !== ALL && String(w.difficulty_stars) !== difficulty) return false;
      if (format !== ALL && (w.format ?? "").toLowerCase() !== format) return false;
      return true;
    });
  }, [rows, search, equipment, duration, difficulty, format]);

  const hasFilters = search || equipment !== ALL || duration !== ALL || difficulty !== ALL || format !== ALL;
  const clear = () => { setSearch(""); setEquipment(ALL); setDuration(ALL); setDifficulty(ALL); setFormat(ALL); };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-[1600px] lg:px-8 lg:py-16 xl:px-12">
      <Link to="/smarty-workouts" className="mb-3 inline-block text-xs font-bold uppercase tracking-wider text-primary">← Smarty Workouts</Link>
      <PageHeader image={detail.image} eyebrow="SMARTY WORKOUTS" title={categoryLabel(category)} subtitle={detail.description} />

      <div className={`mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 ${showFormat ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workouts" className="pl-9" />
        </div>
        <Select value={equipment} onValueChange={setEquipment}>
          <SelectTrigger aria-label="Equipment"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All equipment</SelectItem><SelectItem value="bodyweight">Bodyweight</SelectItem><SelectItem value="equipment">Equipment</SelectItem></SelectContent>
        </Select>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger aria-label="Duration"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All durations</SelectItem><SelectItem value="5-20">Up to 20 min</SelectItem><SelectItem value="21-30">21–30 min</SelectItem><SelectItem value="31-45">31–45 min</SelectItem><SelectItem value="46-180">46+ min</SelectItem></SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger aria-label="Difficulty"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All levels</SelectItem><SelectItem value="1">Beginner</SelectItem><SelectItem value="2">Intermediate</SelectItem><SelectItem value="3">Advanced</SelectItem></SelectContent>
        </Select>
        {showFormat && (
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger aria-label="Format"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>All formats</SelectItem>{formats.map((f) => <SelectItem key={f} value={f.toLowerCase()}>{f}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {rows === null ? (
        <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Showing {filtered.length} workout{filtered.length === 1 ? "" : "s"}</span>
            {hasFilters && <Button variant="outline" size="sm" onClick={clear}><X className="mr-1 h-3.5 w-3.5" />Clear filters</Button>}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-primary/35 px-5 py-10 text-center">
              <p className="font-semibold text-foreground">{rows.length ? "No workouts match these filters." : "Ready workouts are coming soon."}</p>
              <p className="mt-1 text-sm text-muted-foreground">{rows.length ? "Try a different duration, level or equipment option." : "New sessions will appear here when they are published."}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((w) => {
                const bw = w.equipment.length === 0 || w.equipment.every((i) => i.toLowerCase() === "bodyweight");
                const mine = mineById[w.id];
                const badges = equipmentBadges(w.equipment);
                return (
                  <Link key={w.id} to="/smarty-workouts/$workoutId" params={{ workoutId: w.id }} className="group relative block aspect-[4/5] overflow-hidden rounded-lg border-2 border-border bg-muted transition hover:border-primary hover:shadow-lg sm:aspect-[3/4]">
                    <img src={w.image_url ?? detail.image} alt={w.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full border border-primary/40 bg-background/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur">{bw ? "Bodyweight" : "Equipment"}</span>
                    <div className="absolute inset-x-2 bottom-2 flex flex-col items-end gap-1.5 rounded-lg bg-background/90 p-3 text-right shadow-sm backdrop-blur">
                      <h3 className="font-bold leading-snug text-foreground">{w.name}</h3>
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{w.duration_min} min</span>
                        <span>{difficultyLabel(w.difficulty_stars)}</span>
                        {w.format && <span>{w.format}</span>}
                        {user && (mine?.done
                          ? <span className="inline-flex items-center gap-1 font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Completed</span>
                          : <span>Not done</span>)}
                        {user && <Heart aria-label={mine?.fav ? "Favourite" : "Not favourite"} className={`h-4 w-4 ${mine?.fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />}
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {(bw ? ["Bodyweight"] : badges.shown).map((e) => (
                          <span key={e} className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">{e}</span>
                        ))}
                        {!bw && badges.overflow ? <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">+{badges.overflow}</span> : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
