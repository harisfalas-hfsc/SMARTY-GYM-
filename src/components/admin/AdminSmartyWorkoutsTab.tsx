import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutDisplay } from "@/components/workout/WorkoutDisplay";
import {
  SMARTY_WORKOUT_CATEGORIES,
  adminCreateSmartyWorkout,
  adminDeleteSmartyWorkout,
  adminListSmartyWorkouts,
  adminSmartyWorkoutImage,
  adminUpdateSmartyWorkout,
  type SmartyWorkout,
} from "@/lib/smarty-workouts.functions";
import { CATEGORY_FORMATS, FOCUS_CATEGORIES, STRENGTH_FOCUS, type Category } from "@/lib/workout/spec";
import { EQUIPMENT, LOCATIONS, TIMES } from "@/lib/coach-options";
import { categoryLabel, smartyToWorkoutRow } from "@/lib/smarty-workout-row";

const LEVELS = [
  { v: 1, label: "Beginner" },
  { v: 2, label: "Intermediate" },
  { v: 3, label: "Advanced" },
];

export function AdminSmartyWorkoutsTab() {
  const list = useServerFn(adminListSmartyWorkouts);
  const update = useServerFn(adminUpdateSmartyWorkout);
  const remove = useServerFn(adminDeleteSmartyWorkout);
  const [rows, setRows] = useState<SmartyWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [vis, setVis] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SmartyWorkout | null>(null);
  const [viewing, setViewing] = useState<SmartyWorkout | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await list();
    if ("error" in r) toast.error(r.error);
    else setRows(r.workouts);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const shown = rows.filter(
    (w) =>
      (cat === "all" || w.category === cat) &&
      (vis === "all" || (vis === "visible" ? w.is_visible : !w.is_visible)),
  );

  async function toggle(w: SmartyWorkout) {
    const r = await update({ data: { id: w.id, patch: { is_visible: !w.is_visible } } });
    if ("error" in r) return toast.error(r.error);
    toast.success(w.is_visible ? "Hidden from Smarty Workouts" : "Now visible on Smarty Workouts");
    void load();
  }

  async function del(w: SmartyWorkout) {
    if (!window.confirm(`Delete "${w.name}"? This cannot be undone.`)) return;
    const r = await remove({ data: { id: w.id } });
    if ("error" in r) return toast.error(r.error);
    toast.success("Workout deleted");
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">Smarty Workouts</h2>
          <p className="text-xs text-muted-foreground">Ready workouts shown on the Smarty Workouts page. New workouts start hidden.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Create New Workout
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {SMARTY_WORKOUT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vis} onValueChange={setVis}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visible & hidden</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No Smarty Workouts yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shown.map((w) => (
            <div key={w.id} className="flex gap-3 overflow-hidden rounded-2xl border-2 border-blue-400 bg-card p-3">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                {w.image_url && <img src={w.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold leading-snug">{w.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">{categoryLabel(w.category)}</Badge>
                  <Badge variant="outline">{w.duration_min} min</Badge>
                  <Badge variant={w.is_visible ? "default" : "outline"}>{w.is_visible ? "Visible" : "Hidden"}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => setViewing(w)}><Eye className="mr-1 h-3.5 w-3.5" />View</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(w)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => void toggle(w)}>
                    {w.is_visible ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" />Show</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void del(w)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async (id) => {
          setCreating(false);
          const r = await list();
          if (!("error" in r)) {
            setRows(r.workouts);
            const w = r.workouts.find((x) => x.id === id);
            if (w) setEditing(w);
          }
        }}
      />
      {editing && (
        <EditDialog
          workout={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-6xl overflow-y-auto p-0 sm:w-full">
          <DialogHeader className="px-4 pt-4"><DialogTitle className="pr-8 text-left">{viewing?.name}</DialogTitle></DialogHeader>
          {viewing && <WorkoutDisplay workout={smartyToWorkoutRow(viewing)} previewMode onComplete={() => {}} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const create = useServerFn(adminCreateSmartyWorkout);
  const [category, setCategory] = useState<string>("STRENGTH");
  const [format, setFormat] = useState<string>("auto");
  const [focus, setFocus] = useState<string>("none");
  const [stars, setStars] = useState(2);
  const [minutes, setMinutes] = useState(30);
  const [location, setLocation] = useState<string>("gym");
  const [equipment, setEquipment] = useState<string[]>(["bodyweight"]);
  const [note, setNote] = useState("");
  const [withImage, setWithImage] = useState(true);
  const [busy, setBusy] = useState(false);

  const formats = (CATEGORY_FORMATS as Record<string, readonly string[]>)[category] ?? [];
  const showFocus = FOCUS_CATEGORIES.includes(category as Category);

  async function go() {
    setBusy(true);
    const r = await create({
      data: {
        category: category as never,
        format: format === "auto" ? null : format,
        focus: showFocus && focus !== "none" ? focus : null,
        stars,
        minutes,
        equipment,
        location,
        ...(note.trim() ? { note: note.trim() } : {}),
        withImage,
      },
    });
    setBusy(false);
    if ("error" in r) return toast.error(r.error);
    if (r.imageError) toast.warning(`Workout created, picture failed: ${r.imageError}`);
    else toast.success("Workout created (hidden). Review and edit it.");
    onCreated(r.id);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[95dvh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Workout</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Category">
            <Select value={category} onValueChange={(v) => { setCategory(v); setFormat("auto"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SMARTY_WORKOUT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Format">
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Let Smarty decide</SelectItem>
                {formats.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          {showFocus && (
            <Field label="Focus">
              <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific focus</SelectItem>
                  {STRENGTH_FOCUS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Difficulty">
              <Select value={String(stars)} onValueChange={(v) => setStars(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l.v} value={String(l.v)}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Duration">
              <Select value={String(minutes)} onValueChange={(v) => setMinutes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMES.map((t) => <SelectItem key={t} value={String(t)}>{t} min</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Location">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Equipment">
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT.filter((e) => e.id !== "other").map((e) => {
                const on = equipment.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEquipment((cur) => (on ? cur.filter((x) => x !== e.id) : [...cur, e.id]))}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Coach note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
          </Field>
          <label className="flex items-center justify-between gap-2 text-sm">
            Generate picture
            <Switch checked={withImage} onCheckedChange={setWithImage} />
          </label>
          <Button className="w-full" disabled={busy} onClick={() => void go()}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate workout</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Section = "description_html" | "main_workout" | "instructions_html" | "tips_html";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "description_html", label: "Description" },
  { key: "main_workout", label: "Workout" },
  { key: "instructions_html", label: "Instructions" },
  { key: "tips_html", label: "Tips" },
];

function EditDialog({ workout, onClose, onSaved }: { workout: SmartyWorkout; onClose: () => void; onSaved: () => void }) {
  const update = useServerFn(adminUpdateSmartyWorkout);
  const image = useServerFn(adminSmartyWorkoutImage);
  const [w, setW] = useState<SmartyWorkout>(workout);
  const [active, setActive] = useState<Section>("main_workout");
  const [saving, setSaving] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function insertExercise(id: string, name: string) {
    const token = `{{exercise:${id}:${name}}}`;
    const el = areaRef.current;
    const cur = w[active] ?? "";
    const at = el ? el.selectionStart : cur.length;
    const next = cur.slice(0, at) + token + cur.slice(at);
    setW({ ...w, [active]: next });
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = at + token.length;
      }
    });
  }

  async function save() {
    setSaving(true);
    const r = await update({
      data: {
        id: w.id,
        patch: {
          name: w.name,
          category: w.category as never,
          format: w.format,
          difficulty_stars: w.difficulty_stars,
          duration_min: w.duration_min,
          equipment: w.equipment,
          description_html: w.description_html,
          main_workout: w.main_workout,
          instructions_html: w.instructions_html,
          tips_html: w.tips_html,
          is_visible: w.is_visible,
        },
      },
    });
    setSaving(false);
    if ("error" in r) return toast.error(r.error);
    toast.success("Workout saved");
    onSaved();
  }

  async function regen(upload?: { base64: string; ext: "png" | "jpg" | "webp" }) {
    setImgBusy(true);
    const r = await image({ data: { id: w.id, ...(upload ? { upload } : {}) } });
    setImgBusy(false);
    if ("error" in r) return toast.error(r.error);
    setW((cur) => ({ ...cur, image_url: r.image_url }));
    toast.success("Picture updated");
  }

  async function onFile(f: File) {
    const ext = f.type.includes("png") ? "png" : f.type.includes("webp") ? "webp" : "jpg";
    const buf = new Uint8Array(await f.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 1) bin += String.fromCharCode(buf[i]!);
    await regen({ base64: btoa(bin), ext });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto sm:w-full">
        <DialogHeader><DialogTitle>Edit workout</DialogTitle></DialogHeader>
        {preview ? (
          <div className="-mx-6">
            <Button variant="outline" size="sm" className="mx-6 mb-2" onClick={() => setPreview(false)}>Back to editor</Button>
            <WorkoutDisplay workout={smartyToWorkoutRow(w)} previewMode onComplete={() => {}} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <div className="aspect-[3/2] overflow-hidden rounded-xl bg-muted">
                  {w.image_url && <img src={w.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <Button size="sm" variant="outline" className="w-full" disabled={imgBusy} onClick={() => void regen()}>
                  {imgBusy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
                  {w.image_url ? "Regenerate picture" : "Generate picture"}
                </Button>
                <Button size="sm" variant="outline" className="w-full" disabled={imgBusy} onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> Upload picture
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="space-y-2">
                <Field label="Name"><Input value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label="Category">
                    <Select value={w.category} onValueChange={(v) => setW({ ...w, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SMARTY_WORKOUT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Format"><Input value={w.format ?? ""} onChange={(e) => setW({ ...w, format: e.target.value || null })} /></Field>
                  <Field label="Difficulty">
                    <Select value={String(w.difficulty_stars)} onValueChange={(v) => setW({ ...w, difficulty_stars: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map((l) => <SelectItem key={l.v} value={String(l.v)}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Minutes">
                    <Input type="number" value={w.duration_min} onChange={(e) => setW({ ...w, duration_min: Math.max(1, Number(e.target.value) || 1) })} />
                  </Field>
                </div>
                <Field label="Equipment (comma separated)">
                  <Input
                    value={w.equipment.join(", ")}
                    onChange={(e) => setW({ ...w, equipment: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={w.is_visible} onCheckedChange={(v) => setW({ ...w, is_visible: v })} />
                  Visible on Smarty Workouts
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {SECTIONS.map((s) => (
                <Button key={s.key} size="sm" variant={active === s.key ? "default" : "outline"} onClick={() => setActive(s.key)}>
                  {s.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
              <Textarea
                ref={areaRef}
                value={w[active] ?? ""}
                onChange={(e) => setW({ ...w, [active]: e.target.value })}
                rows={16}
                className="font-mono text-xs"
              />
              <ExerciseSearch onPick={insertExercise} />
            </div>
            <p className="text-xs text-muted-foreground">
              Exercises from the library appear as {"{{exercise:ID:Name}}"}; members see the name with its GIF, instructions and tips. You can type any other text or HTML freely.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(true)}><Eye className="mr-1 h-4 w-4" />Preview</Button>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExerciseSearch({ onPick }: { onPick: (id: string, name: string) => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ id: string; name: string; body_part: string | null; equipment: string | null }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes([]);
      return;
    }
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase
        .from("exercises")
        .select("id,name,body_part,equipment")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(30);
      setRes((data ?? []) as never);
      setBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-xl border border-border p-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercise library" className="pl-8" />
      </div>
      <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
        {busy && <Loader2 className="mx-auto h-4 w-4 animate-spin" />}
        {res.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick(r.id, r.name)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-accent"
          >
            <span className="font-semibold capitalize">{r.name}</span>
            <span className="block text-muted-foreground">{[r.body_part, r.equipment].filter(Boolean).join(" · ")}</span>
          </button>
        ))}
        {!busy && q.trim().length >= 2 && res.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">No exercises found.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
