import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualWorkout } from "@/lib/manual-workout.functions";
import { AppConfirmDialog } from "@/components/ui/app-dialog";
import {
  DRAFT_EVENT,
  DRAFT_SECTIONS,
  clearDraft,
  loadDraft,
  saveDraft,
  type DraftSection,
  type ManualDraft,
} from "@/lib/manual-workout-draft";

function SectionCard({
  section,
  draft,
  onChange,
}: {
  section: (typeof DRAFT_SECTIONS)[number];
  draft: ManualDraft;
  onChange: (d: ManualDraft) => void;
}) {
  const list = draft.sections[section.id];

  const update = (next: typeof list) =>
    onChange({ ...draft, sections: { ...draft.sections, [section.id]: next } });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    update(next);
  };

  return (
    <section className="rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-lg font-extrabold">{section.label}</h2>
      <div className="mt-3 space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises yet.</p>
        ) : null}
        {list.map((ex, i) => (
          <div key={ex.key} className="rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">{ex.name}</p>
            </div>
            <Input
              value={ex.dose}
              onChange={(e) =>
                update(list.map((x) => (x.key === ex.key ? { ...x, dose: e.target.value.slice(0, 60) } : x)))
              }
              placeholder="e.g. 3 × 10 reps or 30 sec"
              className="mt-2 h-9 text-sm"
              aria-label={`Reps or time for ${ex.name}`}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {list.length > 1 ? (
                <>
                  <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="mr-1 h-3.5 w-3.5" /> Do earlier
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="mr-1 h-3.5 w-3.5" /> Do later
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-destructive text-xs text-destructive"
                onClick={() => update(list.filter((x) => x.key !== ex.key))}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-2xl font-bold">
        <Link to="/exercise-library" search={{ section: section.id }}>
          <Plus className="mr-2 h-4 w-4" /> Add exercises to {section.label}
        </Link>
      </Button>
    </section>
  );
}

export function ManualWorkoutBuilder({
  premium,
  onLocked,
}: {
  premium: boolean | null;
  onLocked: () => void;
}) {
  const navigate = useNavigate();
  const create = useServerFn(createManualWorkout);
  const [draft, setDraft] = useState<ManualDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    const sync = () => setDraft(loadDraft());
    sync();
    window.addEventListener(DRAFT_EVENT, sync);
    return () => window.removeEventListener(DRAFT_EVENT, sync);
  }, []);

  if (!draft) return null;
  const change = (d: ManualDraft) => saveDraft(d);

  async function submit() {
    if (!draft) return;
    if (premium === false) return onLocked();
    if (!draft.name.trim()) return void toast.error("Give your workout a name.");
    if (!draft.sections.main.length) return void toast.error("Add at least one exercise to the Main Workout.");
    setBusy(true);
    try {
      const strip = (s: DraftSection) => draft.sections[s].map(({ id, dose }) => ({ id, dose }));
      const res = await create({
        data: {
          name: draft.name.trim(),
          sections: { activation: strip("activation"), main: strip("main"), finisher: strip("finisher"), cooldown: strip("cooldown") },
        },
      });
      clearDraft();
      toast.success("Your workout is in your logbook.");
      navigate({ to: "/workout/$workoutId", params: { workoutId: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the workout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border-2 border-primary bg-card p-5">
        <h2 className="text-lg font-extrabold">Name your workout</h2>
        <Input
          value={draft.name}
          maxLength={80}
          onChange={(e) => change({ ...draft, name: e.target.value })}
          placeholder="e.g. My Monday Session"
          className="mt-3"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Browse the library for each part below, or tap <strong>Add to workout</strong> on any exercise in the{" "}
          <Link to="/exercise-library" className="font-semibold text-primary">
            Exercise Library
          </Link>
          .
        </p>
      </section>
      {DRAFT_SECTIONS.map((s) => (
        <SectionCard key={s.id} section={s} draft={draft} onChange={change} />
      ))}
      <Button className="h-14 w-full rounded-2xl text-base font-extrabold" disabled={busy} onClick={() => void submit()}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create my workout"}
      </Button>
      <Button
        variant="outline"
        className="h-12 w-full rounded-2xl font-bold text-destructive"
        disabled={busy}
        onClick={() => setDiscardOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" /> Discard workout
      </Button>
      <AppConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard this workout?"
        description="The workout name and every exercise you added will be removed."
        confirmLabel="Discard workout"
        cancelLabel="Keep building"
        tone="danger"
        onConfirm={() => {
          clearDraft();
          setDiscardOpen(false);
          toast.success("Workout discarded. You can start a new one.");
        }}
      />
    </div>
  );
}
