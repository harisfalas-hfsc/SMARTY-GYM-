import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Dumbbell, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExerciseGif } from "@/components/ExerciseGif";
import { BODY_PARTS } from "@/components/ExercisePicker";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { addToDraft, type DraftSection } from "@/lib/manual-workout-draft";

type Row = {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target_muscle: string | null;
  difficulty: string | null;
  description: string | null;
  instructions: string[] | null;
  gif_path: string | null;
};

function Chips({ items, value, onChange }: { items: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 pb-1">
      {items.map((it) => (
        <button
          key={it}
          type="button"
          onClick={() => onChange(value === it ? null : it)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
            value === it ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
          }`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

/** Browse the full Exercise Library (body part, equipment, search, animation, instructions) and add to one section. */
export function LibraryBrowserDialog({
  open,
  onOpenChange,
  section,
  sectionLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  section: DraftSection;
  sectionLabel: string;
}) {
  const { exercises } = useExerciseLibrary();
  const equipmentList = useMemo(
    () => [...new Set(exercises.map((e) => e.equipment).filter(Boolean))].sort(),
    [exercises],
  );
  const [part, setPart] = useState<string | null>(null);
  const [equip, setEquip] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(async () => {
      let q = supabase
        .from("exercises")
        .select("id,name,body_part,equipment,target_muscle,difficulty,description,instructions,gif_path")
        .eq("is_active", true)
        .order("name")
        .limit(80);
      if (part) q = q.eq("body_part", part);
      if (equip) q = q.eq("equipment", equip);
      if (term.trim().length >= 2) q = q.ilike("name", `%${term.trim()}%`);
      const { data } = await q;
      if (!cancelled) {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, part, equip, term]);

  function add(r: Row) {
    addToDraft(section, r);
    setAdded((s) => new Set(s).add(r.id));
    toast.success(`Added to ${sectionLabel}.`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setDetail(null);
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto w-[calc(100vw-2rem)] min-w-0 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to {sectionLabel}</DialogTitle>
        </DialogHeader>

        {detail ? (
          <div className="min-w-0 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to the list
            </Button>
            <div className="overflow-hidden rounded-2xl border-2 border-primary bg-white">
              {detail.gif_path ? (
                <ExerciseGif path={detail.gif_path} alt={detail.name} className="mx-auto block h-[36vh] w-full object-contain" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-secondary text-muted-foreground">
                  <Dumbbell className="h-8 w-8" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold capitalize">{detail.name}</h3>
            <p className="text-xs capitalize text-muted-foreground">
              {[detail.body_part, detail.target_muscle, detail.equipment, detail.difficulty].filter(Boolean).join(" · ")}
            </p>
            {detail.description ? <p className="text-sm">{detail.description}</p> : null}
            {detail.instructions?.length ? (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {detail.instructions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            ) : null}
            <Button className="h-12 w-full rounded-2xl font-extrabold" onClick={() => add(detail)}>
              {added.has(detail.id) ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {added.has(detail.id) ? "Added — add again" : `Add to ${sectionLabel}`}
            </Button>
          </div>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-11 pl-9" placeholder="Search by name…" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Body part</p>
            <Chips items={[...BODY_PARTS]} value={part} onChange={setPart} />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equipment</p>
            <Chips items={equipmentList.slice(0, 40)} value={equip} onChange={setEquip} />

            {loading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rows.map((r) => (
                  <div key={r.id} className="overflow-hidden rounded-2xl border border-border">
                    <button type="button" className="block w-full text-left" onClick={() => setDetail(r)}>
                      <div className="aspect-square bg-white">
                        {r.gif_path ? (
                          <ExerciseGif path={r.gif_path} alt={r.name} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-secondary text-muted-foreground">
                            <Dumbbell className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <p className="line-clamp-2 px-2 pt-2 text-xs font-semibold capitalize">{r.name}</p>
                      <p className="truncate px-2 text-[11px] capitalize text-muted-foreground">{r.equipment}</p>
                    </button>
                    <div className="p-2">
                      <Button size="sm" variant={added.has(r.id) ? "secondary" : "default"} className="h-8 w-full rounded-xl text-xs" onClick={() => add(r)}>
                        {added.has(r.id) ? <Check className="mr-1 h-3.5 w-3.5" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
                        {added.has(r.id) ? "Added" : "Add"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">No exercises match. Try another filter.</p>
            )}
            <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
