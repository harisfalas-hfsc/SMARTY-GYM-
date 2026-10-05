import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { loadRemote } from "@/lib/remote-data";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, X, Dumbbell, Heart, ThumbsDown, Plus, Check, Trash2, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  DRAFT_EVENT,
  DRAFT_SECTIONS,
  addToDraft,
  isDraftSection,
  loadDraft,
  removeFromDraft,
  type DraftSection,
  type ManualDraft,
} from "@/lib/manual-workout-draft";
import { toast } from "sonner";
import { ExerciseGif } from "@/components/ExerciseGif";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  getExercisePreferences,
  getAllowedExerciseIds,
  setExercisePreference,
  type ExercisePreferences,
} from "@/lib/preferences.functions";
import type { ExerciseSchemaItem } from "@/lib/seo/exercise-schema.functions";
import pageHeroImage from "@/assets/explore-exercise-library.jpg";


const URL = "https://smartygym.com/exercise-library";
const TITLE = "Exercise Library — 1,300+ demos | SmartyGym";
const DESCRIPTION =
  "Browse the SmartyGym exercise library: 1,300+ barbell, dumbbell, kettlebell, band, machine and bodyweight movements with animated demonstrations, filtered by body part, equipment, target muscle and difficulty, curated by sports scientist Haris Falas (CSCS).";


export const Route = createFileRoute("/exercise-library")({
  validateSearch: (search: Record<string, unknown>): { section?: DraftSection } =>
    isDraftSection(search.section) ? { section: search.section } : {},
  loader: async () => {
    try {
      const { getExerciseSchemaList } = await import("@/lib/seo/exercise-schema.functions");
      return { schemaExercises: await getExerciseSchemaList() };
    } catch {
      return { schemaExercises: [] as ExerciseSchemaItem[] };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/exercise-library", "exercise library, exercise database, animated exercise demonstrations, exercises by muscle group, exercises by equipment, movement pattern, how to perform exercise"),
      },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              url: URL,
              name: TITLE,
              description: DESCRIPTION,
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              about: {
                "@type": "Thing",
                name: "Exercise database",
                description:
                  "A curated library of over 1,300 resistance, bodyweight and conditioning exercises with animated demonstrations.",
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                { "@type": "ListItem", position: 2, name: "Exercise Library", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),


  component: ExerciseLibraryPage,
});

type Exercise = {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target_muscle: string | null;
  secondary_muscles: string[];
  instructions: string[];
  difficulty: string | null;
  category: string | null;
  description: string | null;
  gif_path: string | null;
};

const ALL = "all";
type PreferenceFilter = "all" | "liked" | "disliked";

function normalize(term: string): string[] {
  const n = term.toLowerCase().trim();
  if (!n) return [];
  const v = new Set<string>([n]);
  if (n.includes("body weight")) v.add(n.replace("body weight", "bodyweight"));
  if (n.includes("bodyweight")) v.add(n.replace("bodyweight", "body weight"));
  if (n.includes("dumbell")) v.add(n.replace("dumbell", "dumbbell"));
  if (n.includes("-")) {
    v.add(n.replace(/-/g, " "));
    v.add(n.replace(/-/g, ""));
  }
  if (n.includes(" ")) v.add(n.replace(/ /g, "-"));
  if (n.endsWith("s")) v.add(n.slice(0, -1));
  return [...v];
}

function preferenceSignature(ids: string[] | null): string {
  if (!ids) return "all";
  let hash = 2166136261;
  for (const id of ids) {
    for (let index = 0; index < id.length; index++) {
      hash ^= id.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return `${ids.length}-${hash >>> 0}`;
}

function PreferenceButtons({
  state,
  busy,
  onLike,
  onDislike,
  onAdd,
  direct,
}: {
  state: "like" | "dislike" | "none";
  busy: boolean;
  onLike: () => void;
  onDislike: () => void;
  onAdd?: (section: DraftSection) => void;
  /** Set when the member came from one section of Build It Yourself: one tap adds, tap again removes. */
  direct?: { added: number; onAdd: () => void; onRemove: () => void };
}) {
  const [addOpen, setAddOpen] = useState(false);
  const touchOpen = useRef(false);
  const addOpenRef = useRef(false);
  const swallowTouchClick = useRef(false);
  const directControls = direct ? (
      <>
        {direct.added > 0 ? (
          <>
            <span className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground">
              <Check className="h-3.5 w-3.5" /> Added{direct.added > 1 ? ` ×${direct.added}` : ""}
            </span>
            <button
              type="button"
              onClick={direct.onRemove}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-destructive px-3 text-xs font-bold text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={direct.onAdd}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-primary px-3 text-xs font-bold text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </>
  ) : null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        aria-label="Like this exercise"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
          state === "like"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-primary"
        }`}
      >
        <Heart className={`h-4 w-4 ${state === "like" ? "fill-current" : ""}`} />
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDislike}
        aria-label="Dislike this exercise"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
          state === "dislike"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border text-muted-foreground hover:text-destructive"
        }`}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
      {directControls ? directControls : onAdd ? (
        <DropdownMenu
          modal={false}
          open={addOpen}
          onOpenChange={(open) => {
            addOpenRef.current = open;
            setAddOpen(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onPointerDown={(e) => {
                touchOpen.current = e.pointerType === "touch";
                if (touchOpen.current) {
                  // Open on tap (click) instead of press, so a scroll that
                  // starts on the button never opens the menu.
                  e.preventDefault();
                  // If the menu is already open, Radix's outside-press
                  // dismissal closes it before the click arrives; swallow the
                  // click instead of re-opening the menu.
                  swallowTouchClick.current = addOpenRef.current;
                }
              }}
              onClick={() => {
                if (!touchOpen.current) return;
                if (swallowTouchClick.current) {
                  swallowTouchClick.current = false;
                  return;
                }
                // While the menu is open Radix blocks pointer events outside
                // it, so a second tap can deliver only this click — close.
                if (addOpenRef.current) {
                  addOpenRef.current = false;
                  setAddOpen(false);
                  return;
                }
                addOpenRef.current = true;
                setAddOpen(true);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-primary px-3 text-xs font-bold text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add to workout
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {DRAFT_SECTIONS.map((s) => (
              <DropdownMenuItem key={s.id} onSelect={() => onAdd(s.id)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}

function ExerciseLibraryPage() {

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState("");
  const [bodyPart, setBodyPart] = useState(ALL);
  const [equipment, setEquipment] = useState(ALL);
  const [target, setTarget] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [preferenceFilter, setPreferenceFilter] = useState<PreferenceFilter>("liked");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [options, setOptions] = useState<{
    bodyParts: string[];
    equipment: string[];
    targets: string[];
    difficulties: string[];
  }>({ bodyParts: [], equipment: [], targets: [], difficulties: [] });

  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ExercisePreferences | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Rule-allowed exercises are liked by default for everyone.
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [allowedReady, setAllowedReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    let active = true;
    getAllowedExerciseIds()
      .then((ids) => {
        if (active) {
          setAllowedIds(new Set(ids));
          setAllowedReady(true);
        }
      })
      .catch(() => {
        if (active) setAllowedReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPrefs(null);
      setPreferencesReady(true);
      return;
    }
    let active = true;
    setPreferencesReady(false);
    getExercisePreferences()
      .then((p) => {
        if (active) {
          setPrefs(p);
          setPreferencesReady(true);
        }
      })
      .catch(() => {
        if (active) setPreferencesReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const stateFor = (id: string): "like" | "dislike" | "none" =>
    prefs?.dislikedIds.includes(id)
      ? "dislike"
      : prefs?.favoriteIds.includes(id) || allowedIds.has(id)
        ? "like"
        : "none";

  async function mark(id: string, next: "like" | "dislike") {
    if (!user) {
      toast.error("Sign in to save your liked and disliked exercises.");
      return;
    }
    if (!prefs?.premium) {
      toast.error("Liking and disliking exercises is part of the premium membership.");
      return;
    }
    const current = stateFor(id);
    // Un-liking a default-liked (rule-allowed) exercise stores a dislike so it
    // leaves that member's workouts; un-liking an explicitly liked one clears it.
    const state =
      next === "like" && current === "like"
        ? prefs.favoriteIds.includes(id)
          ? "none"
          : "dislike"
        : current === next
          ? "none"
          : next;
    setSavingId(id);
    try {
      const updated = await setExercisePreference({ data: { exerciseId: id, state } });
      setPrefs(updated);
      toast.success(
        state === "none"
          ? "Preference cleared."
          : state === "like"
            ? "Added to your liked exercises."
            : "Removed from your liked exercises — it won't be used in your workouts.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setSavingId(null);
    }
  }

  const navigate = useNavigate();
  const { section: targetSection } = Route.useSearch();
  const targetLabel = targetSection ? DRAFT_SECTIONS.find((s) => s.id === targetSection)!.label : "";
  const [draft, setDraft] = useState<ManualDraft | null>(null);
  useEffect(() => {
    const sync = () => setDraft(loadDraft());
    sync();
    window.addEventListener(DRAFT_EVENT, sync);
    return () => window.removeEventListener(DRAFT_EVENT, sync);
  }, []);
  const sectionList = targetSection && draft ? draft.sections[targetSection] : [];
  const backToWorkout = () => navigate({ to: "/create-your-own-workout", search: { mode: "build" } });
  function directFor(ex: { id: string; name: string }) {
    if (!targetSection) return undefined;
    return {
      added: sectionList.filter((x) => x.id === ex.id).length,
      onAdd: () => {
        if (!user) return void toast.error("Sign in to build your own workout.");
        if (!prefs?.premium) return void toast.error("Building your own workout is part of the premium membership.");
        addToDraft(targetSection, ex);
      },
      onRemove: () => removeFromDraft(targetSection, ex.id),
    };
  }
  function addExercise(section: DraftSection, ex: { id: string; name: string }) {
    if (!user) {
      toast.error("Sign in to build your own workout.");
      return;
    }
    if (!prefs?.premium) {
      toast.error("Building your own workout is part of the premium membership.");
      return;
    }
    addToDraft(section, ex);
    toast.success(`Added to ${DRAFT_SECTIONS.find((s) => s.id === section)!.label}.`, {
      action: {
        label: "Go to my workout",
        onClick: () => navigate({ to: "/create-your-own-workout", search: { mode: "build" } }),
      },
    });
  }

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    let active = true;
    const load = async () => {
      const all: any[] = [];
      let page = 0;
      const size = 1000;
      for (;;) {
        const { data, error } = await supabase
          .from("exercises")
          .select("body_part,equipment,target_muscle,difficulty")
          .range(page * size, (page + 1) * size - 1);
        if (error || !data?.length) break;
        all.push(...data);
        if (data.length < size) break;
        page++;
      }
      if (!active) return all;
      const uniq = (key: string) =>
        [...new Set(all.map((d) => d[key]).filter(Boolean))].sort() as string[];
      const next = {
        bodyParts: uniq("body_part"),
        equipment: uniq("equipment"),
        targets: uniq("target_muscle"),
        difficulties: uniq("difficulty"),
      };
      setOptions(next);
      return next;
    };
    void loadRemote("library:filters", load)
      .then((next) => {
        if (active && next && "bodyParts" in next) setOptions(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const fetchExercises = useCallback(async () => {
    if (!allowedReady || !preferencesReady) return;
    setLoading(true);
    const likedIds = new Set([...allowedIds, ...(prefs?.favoriteIds ?? [])]);
    for (const id of prefs?.dislikedIds ?? []) likedIds.delete(id);
    const preferenceIds =
      preferenceFilter === "liked"
        ? [...likedIds]
        : preferenceFilter === "disliked"
          ? (prefs?.dislikedIds ?? [])
          : null;

    const buildQuery = (ids?: string[]) => {
      let query = supabase
        .from("exercises")
        .select(
          "id,name,body_part,equipment,target_muscle,secondary_muscles,instructions,difficulty,category,description,gif_path",
        );
      if (bodyPart !== ALL) query = query.eq("body_part", bodyPart);
      if (equipment !== ALL) query = query.eq("equipment", equipment);
      if (target !== ALL) query = query.eq("target_muscle", target);
      if (difficulty !== ALL) query = query.eq("difficulty", difficulty);
      if (ids) query = query.in("id", ids);
      if (nameSearch.trim()) {
        const conditions = normalize(nameSearch)
          .flatMap((t) => [
            `name.ilike.%${t}%`,
            `target_muscle.ilike.%${t}%`,
            `body_part.ilike.%${t}%`,
            `equipment.ilike.%${t}%`,
          ])
          .join(",");
        if (conditions) query = query.or(conditions);
      }
      return query;
    };

    const rows = await loadRemote(
      `library:list:${bodyPart}|${equipment}|${target}|${difficulty}|${preferenceFilter}|${nameSearch.trim()}|${preferenceSignature(preferenceIds)}`,
      async () => {
        if (preferenceIds?.length === 0) return [] as Exercise[];
        if (!preferenceIds) {
          const { data, error } = await buildQuery().order("name").limit(60);
          if (error) throw new Error(error.message);
          return (data as Exercise[]) ?? [];
        }
        const batches: Exercise[][] = [];
        for (let index = 0; index < preferenceIds.length; index += 150) {
          const { data, error } = await buildQuery(preferenceIds.slice(index, index + 150)).order("name");
          if (error) throw new Error(error.message);
          batches.push((data as Exercise[]) ?? []);
        }
        return batches.flat().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
      },
    ).catch(() => [] as Exercise[]);
    setExercises(rows);
    setLoading(false);
  }, [allowedIds, allowedReady, bodyPart, difficulty, equipment, nameSearch, preferenceFilter, preferencesReady, prefs, target]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(fetchExercises, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [fetchExercises]);

  const clearAll = () => {
    setNameSearch("");
    setBodyPart(ALL);
    setEquipment(ALL);
    setTarget(ALL);
    setDifficulty(ALL);
    setPreferenceFilter("liked");
  };

  const hasFilters =
    nameSearch.trim() !== "" ||
    preferenceFilter !== "liked" ||
    [bodyPart, equipment, target, difficulty].some((v) => v !== ALL);

  const filters: { label: string; value: string; set: (v: string) => void; items: string[] }[] = [
    { label: "Body part", value: bodyPart, set: setBodyPart, items: options.bodyParts },
    { label: "Equipment", value: equipment, set: setEquipment, items: options.equipment },
    { label: "Target muscle", value: target, set: setTarget, items: options.targets },
    { label: "Difficulty", value: difficulty, set: setDifficulty, items: options.difficulties },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      {targetSection ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-card p-3">
          <p className="min-w-0 text-sm">
            Adding to <strong className="text-primary">{targetLabel}</strong>. Tap <strong>Add</strong> on any
            exercise, tap <strong>Remove</strong> to take it out.
          </p>
          <Button size="sm" className="shrink-0 rounded-full font-bold" onClick={backToWorkout}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
      ) : null}
      {!targetSection ? (
        <PageHeader image={pageHeroImage}
          eyebrow="Exercise library"
          title={
            <>
              Every <span className="text-primary">movement</span> demonstrated
            </>
          }
          subtitle={
            <>
              Browse the exercise database{" "}
              <span className="font-bold text-primary">Smarty Coach</span> builds your sessions from.
              Filter by body part, equipment, target muscle or difficulty. Exercises you{" "}
              <span className="font-semibold text-primary">like</span> are prioritised and the ones
              you <span className="font-semibold text-primary">dislike</span> are avoided every
              time a workout is generated for you.
            </>
          }
        />
      ) : null}

      <Card className="mb-6 border-2 border-primary/30">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Exercise Database</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search exercises…"
              aria-label="Search exercises"
              className="pl-9"
            />

          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {filters.map((f) => (
              <Select key={f.label} value={f.value} onValueChange={f.set}>
                <SelectTrigger aria-label={f.label} className="h-9 min-w-0 px-2 text-xs xl:px-3 xl:text-sm">
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value={ALL}>All {f.label.toLowerCase()}</SelectItem>
                  {f.items.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <Select value={preferenceFilter} onValueChange={(value) => setPreferenceFilter(value as PreferenceFilter)}>
              <SelectTrigger aria-label="Exercise preference" className="h-9 min-w-0 px-2 text-xs xl:px-3 xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liked">Liked only</SelectItem>
                <SelectItem value="disliked">Disliked only</SelectItem>
                <SelectItem value="all">All preferences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Searching…"
                : `${exercises.length} exercise${exercises.length === 1 ? "" : "s"} shown`}
            </p>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
          </div>

          {/* Results scroll inside the card */}
          <div className="max-h-[55vh] overflow-y-auto rounded-2xl border bg-muted/20 p-2 sm:max-h-[420px]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : exercises.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No exercises match those filters.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary"
                  >
                    <button onClick={() => setSelected(ex)} className="shrink-0" aria-label={`Open ${ex.name}`}>
                      <ExerciseGif path={ex.gif_path} alt={ex.name} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setSelected(ex)} className="block w-full text-left">
                        <span className="block text-sm font-bold capitalize leading-snug">{ex.name}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {[ex.body_part, ex.equipment].filter(Boolean).map((tag) => (
                            <Badge key={tag as string} variant="secondary" className="capitalize">
                              {tag}
                            </Badge>
                          ))}
                        </span>
                      </button>
                      <PreferenceButtons
                        state={stateFor(ex.id)}
                        busy={savingId === ex.id}
                        onLike={() => mark(ex.id, "like")}
                        onDislike={() => mark(ex.id, "dislike")}
                        onAdd={(sec) => addExercise(sec, ex)}
                        direct={directFor(ex)}
                      />
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>
        </CardContent>
      </Card>

      {!targetSection ? (
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Want these exercises built into a session?{" "}
          <Link to="/create-your-own-workout" className="font-semibold text-primary">
            Ask Smarty Coach →
          </Link>
        </div>
      ) : null}

      {targetSection ? (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6">
          <Button
            className="h-12 rounded-full px-6 text-sm font-extrabold shadow-xl"
            onClick={backToWorkout}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to my workout · {targetLabel} ({sectionList.length})
          </Button>
        </div>
      ) : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[78vh] w-[calc(100vw-3rem)] max-w-md gap-0 overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-primary p-0 sm:max-h-[86vh] sm:w-full sm:max-w-lg [&>button]:hidden [&>div:first-child]:hidden">
          {/* Media hero — flush to the top edge of the card */}
          <div className="relative w-full overflow-hidden rounded-t-[calc(1rem-2px)] border-b-2 border-primary bg-white">
            <DialogClose className="absolute right-2.5 top-2.5 z-20 grid h-9 w-9 place-items-center rounded-full border-2 border-primary bg-background/90 text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-4 w-4" strokeWidth={3} />
              <span className="sr-only">Close</span>
            </DialogClose>

            {selected?.gif_path ? (
              <ExerciseGif
                path={selected.gif_path}
                alt={`${selected.name} demonstration`}
                className="block h-auto max-h-[38vh] w-full rounded-none bg-white object-contain sm:max-h-[34vh]"
              />
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-secondary text-muted-foreground">
                <Dumbbell className="h-9 w-9" />
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-left text-xl font-bold capitalize leading-tight">
                {selected?.name ?? "Exercise"}
              </DialogTitle>
            </DialogHeader>

            {selected && (
              <>
                <PreferenceButtons
                  state={stateFor(selected.id)}
                  busy={savingId === selected.id}
                  onLike={() => mark(selected.id, "like")}
                  onDislike={() => mark(selected.id, "dislike")}
                  onAdd={(sec) => addExercise(sec, selected)}
                  direct={directFor(selected)}
                />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Body part", selected.body_part],
                    ["Target", selected.target_muscle],
                    ["Equipment", selected.equipment],
                    ["Level", selected.difficulty],
                  ].map(([label, value]) =>
                    value ? (
                      <div
                        key={label as string}
                        className="rounded-xl border-2 border-primary/60 bg-primary/5 p-2.5"
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                          {label}
                        </p>
                        <p className="font-medium capitalize">{value as string}</p>
                      </div>
                    ) : null,
                  )}
                </div>

                {selected.secondary_muscles?.length > 0 && (
                  <div className="rounded-xl border-2 border-primary/60 bg-primary/5 p-3 text-sm">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                      Secondary muscles
                    </p>
                    <p className="capitalize">{selected.secondary_muscles.join(", ")}</p>
                  </div>
                )}

                {selected.description && (
                  <div className="rounded-xl border-2 border-primary/60 p-3 text-sm leading-relaxed">
                    {selected.description}
                  </div>
                )}

                {selected.instructions?.length > 0 && (
                  <div className="rounded-xl border-2 border-primary/60 p-3">
                    <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                      How to perform
                    </p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                      {selected.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
