import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { A4Container } from "@/components/ui/a4-container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutDisplay } from "@/components/workout/WorkoutDisplay";
import {
  SMARTY_WORKOUT_CATEGORIES,
  adminCreateBlankSmartyWorkout,
  adminCreateSmartyWorkout,
  adminDuplicateSmartyWorkout,
  adminDeleteSmartyWorkout,
  adminListSmartyWorkouts,
  adminSmartyWorkoutImage,
  adminUpdateSmartyWorkout,
  type SmartyWorkout,
} from "@/lib/smarty-workouts.functions";
import { CATEGORY_FORMATS, FOCUS_CATEGORIES, STRENGTH_FOCUS, type Category } from "@/lib/workout/spec";
import { EQUIPMENT, LOCATIONS, TIMES } from "@/lib/coach-options";
import { categoryLabel, smartyToWorkoutRow } from "@/lib/smarty-workout-row";
import { SMARTY_DRAFT_EVENT, takeSmartyDraft } from "@/lib/admin-smarty-draft";

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
  const [choosing, setChoosing] = useState(false);
  const [blankBusy, setBlankBusy] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SmartyWorkout | null>(null);
  const [viewing, setViewing] = useState<SmartyWorkout | null>(null);
  const createBlank = useServerFn(adminCreateBlankSmartyWorkout);
  const dup = useServerFn(adminDuplicateSmartyWorkout);

  async function startBlank() {
    setBlankBusy(true);
    const r = await createBlank({ data: { main_workout: STANDARD_SECTIONS_TEMPLATE } });
    if ("error" in r) {
      setBlankBusy(false);
      return toast.error(r.error);
    }
    setBlankBusy(false);
    setChoosing(false);
    await openDraft(r.id);
  }

  async function openDraft(id: string) {
    const l = await list();
    if ("error" in l) return toast.error(l.error);
    setRows(l.workouts);
    setLoading(false);
    const w = l.workouts.find((x) => x.id === id);
    if (w) {
      setDraftId(w.id);
      setEditing(w);
    }
  }

  async function duplicate(w: SmartyWorkout) {
    const r = await dup({ data: { source: "smarty", id: w.id } });
    if ("error" in r) return toast.error(r.error);
    toast.success("Copy created — edit it and press Save Workout.");
    await openDraft(r.id);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const r = await list();
    if ("error" in r) toast.error(r.error);
    else setRows(r.workouts);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const pendingId = takeSmartyDraft();
    if (pendingId) void openDraft(pendingId);
    else void load();
    const onDraft = () => {
      const id = takeSmartyDraft();
      if (id) void openDraft(id);
    };
    window.addEventListener(SMARTY_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(SMARTY_DRAFT_EVENT, onDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Button onClick={() => setChoosing(true)}>
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
        <p className="py-10 text-center text-sm text-muted-foreground">You have not created any Smarty Workouts yet. Press "Create New Workout" to make your first one — it will appear here to view, edit, hide, show or delete.</p>
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

      <Dialog open={choosing} onOpenChange={(o) => !o && !blankBusy && setChoosing(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Workout</DialogTitle>
            <DialogDescription>How do you want to create this workout?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setChoosing(false); setCreating(true); }}
              className="rounded-2xl border-2 border-blue-400 bg-card p-4 text-left hover:bg-accent"
            >
              <Sparkles className="mb-2 h-6 w-6 text-primary" />
              <p className="font-bold">Generate with AI</p>
              <p className="mt-1 text-xs text-muted-foreground">Answer the questions and Smarty builds it. You can edit it afterwards.</p>
            </button>
            <button
              type="button"
              disabled={blankBusy}
              onClick={() => void startBlank()}
              className="rounded-2xl border-2 border-blue-400 bg-card p-4 text-left hover:bg-accent disabled:opacity-60"
            >
              {blankBusy ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" /> : <Pencil className="mb-2 h-6 w-6 text-primary" />}
              <p className="font-bold">Create it myself</p>
              <p className="mt-1 text-xs text-muted-foreground">Open the editor with all sections ready, write it yourself, and generate or upload the picture.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
          onClose={async () => {
            const draft = draftId;
            setEditing(null);
            setDraftId(null);
            if (draft && draft === editing.id) {
              await remove({ data: { id: draft } });
              toast.message("Draft discarded — nothing was saved.");
            }
            void load();
          }}
          onSaved={() => {
            setEditing(null);
            setDraftId(null);
            void load();
          }}
        />
      )}
      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-6xl overflow-y-auto p-0 sm:w-full">
          <DialogHeader className="px-4 pt-4"><DialogTitle className="pr-8 text-left">{viewing?.name}</DialogTitle></DialogHeader>
          {viewing && <WorkoutDisplay workout={smartyToWorkoutRow(viewing)} previewMode onComplete={() => {}}><MemberSectionsPreview /></WorkoutDisplay>}
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

const STANDARD_SECTIONS_TEMPLATE = `<div class="workout-content">
<h3>🧘 Soft Tissue Preparation</h3>
<ul><li></li></ul>
<h3>🔥 Activation</h3>
<ul><li></li></ul>
<h3>💪 Main Workout</h3>
<ul><li></li></ul>
<h3>⚡ Finisher</h3>
<ul><li></li></ul>
<h3>🧊 Cool Down</h3>
<ul><li></li></ul>
</div>`;

const DURATION_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 60];
const SETS_AND_REPS = "REPS & SETS";

function fixedFormat(category: string): string | null {
  const legal = CATEGORY_FORMATS[category as Category] ?? [];
  return legal.length === 1 ? legal[0]! : null;
}

function isBodyweightList(equipment: string[]) {
  return equipment.length === 0 || equipment.every((e) => e.toLowerCase() === "bodyweight");
}

function EditDialog({ workout, onClose, onSaved }: { workout: SmartyWorkout; onClose: () => void; onSaved: () => void }) {
  const update = useServerFn(adminUpdateSmartyWorkout);
  const image = useServerFn(adminSmartyWorkoutImage);
  const [w, setW] = useState<SmartyWorkout>(workout);
  const [saving, setSaving] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [generateUnique, setGenerateUnique] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const required = fixedFormat(w.category);
  const formatOptions = CATEGORY_FORMATS[w.category as Category] ?? [];
  const equipmentChoice = isBodyweightList(w.equipment) ? "BODYWEIGHT" : "EQUIPMENT";

  async function save() {
    if (!w.name.trim()) return toast.error("Workout name is required");
    if (!(w.main_workout ?? "").replace(/<[^>]*>/g, "").trim()) return toast.error("Workout content is required");
    setSaving(true);
    const r = await update({
      data: {
        id: w.id,
        patch: {
          name: w.name.trim(),
          category: w.category as never,
          format: required ?? w.format,
          focus: FOCUS_CATEGORIES.includes(w.category as Category) ? w.focus : null,
          difficulty_stars: w.difficulty_stars,
          duration_min: w.duration_min,
          equipment: w.equipment,
          image_url: w.image_url,
          description_html: w.description_html,
          main_workout: w.main_workout,
          instructions_html: w.instructions_html,
          tips_html: w.tips_html,
          is_visible: w.is_visible,
        },
      },
    });
    if ("error" in r) {
      setSaving(false);
      return toast.error(r.error);
    }
    if (generateUnique) {
      const img = await image({ data: { id: w.id } });
      if ("error" in img) toast.error(`Saved, but the picture failed: ${img.error}`);
    }
    setSaving(false);
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
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-5xl overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
          <DialogDescription>Update workout details</DialogDescription>
        </DialogHeader>
        {preview ? (
          <div className="-mx-6">
            <Button variant="outline" size="sm" className="mx-6 mb-2" onClick={() => setPreview(false)}>Back to editor</Button>
            <WorkoutDisplay workout={smartyToWorkoutRow(w)} previewMode onComplete={() => {}}><MemberSectionsPreview /></WorkoutDisplay>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {/* 1. Category */}
            <div className="space-y-2">
              <Label>1. Category *</Label>
              <Select
                value={w.category}
                onValueChange={(value) => {
                  const req = fixedFormat(value);
                  setW((prev) => ({
                    ...prev,
                    category: value,
                    focus: FOCUS_CATEGORIES.includes(value as Category) ? prev.focus : null,
                    format: req ?? ((CATEGORY_FORMATS[value as Category] ?? []).includes(prev.format as never) ? prev.format : null),
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {SMARTY_WORKOUT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Focus (Strength / Muscle Building only) */}
            {FOCUS_CATEGORIES.includes(w.category as Category) && (
              <div className="space-y-2">
                <Label>2. {categoryLabel(w.category)} Focus *</Label>
                <Select value={w.focus ?? ""} onValueChange={(v) => setW({ ...w, focus: v })}>
                  <SelectTrigger><SelectValue placeholder="Select focus" /></SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {STRENGTH_FOCUS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Only Strength and Muscle Building use this field.</p>
              </div>
            )}

            {/* 3. Name */}
            <div className="space-y-2">
              <Label htmlFor="sw-name">3. Workout Name *</Label>
              <Input id="sw-name" value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} placeholder="Enter workout name" />
            </div>

            {/* 4. Difficulty */}
            <div className="space-y-2">
              <Label>4. Difficulty Level *</Label>
              <div className="flex items-center gap-4">
                <Select value={String(w.difficulty_stars)} onValueChange={(v) => setW({ ...w, difficulty_stars: Number(v) })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {LEVELS.map((l) => <SelectItem key={l.v} value={String(l.v)}>{`${"⭐".repeat(l.v)} (${l.v})`}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{LEVELS.find((l) => l.v === w.difficulty_stars)?.label}</span>
              </div>
            </div>

            {/* 5. Equipment */}
            <div className="space-y-2">
              <Label>5. Equipment *</Label>
              <Select
                value={equipmentChoice}
                onValueChange={(v) => setW({ ...w, equipment: v === "BODYWEIGHT" ? ["bodyweight"] : isBodyweightList(w.equipment) ? ["dumbbells"] : w.equipment })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="BODYWEIGHT">BODYWEIGHT</SelectItem><SelectItem value="EQUIPMENT">EQUIPMENT</SelectItem></SelectContent>
              </Select>
              {equipmentChoice === "EQUIPMENT" && (
                <Input
                  value={w.equipment.join(", ")}
                  onChange={(e) => setW({ ...w, equipment: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                  placeholder="e.g. dumbbells, kettlebell"
                />
              )}
            </div>

            {/* 6. Format */}
            <div className="space-y-2">
              <Label>6. Format *</Label>
              {required ? (
                <>
                  <Input value={required} disabled className="cursor-not-allowed bg-muted" />
                  <p className="text-xs font-medium text-amber-600">⚠️ {w.category} category requires "{required}" format (auto-set)</p>
                </>
              ) : (
                <Select value={w.format ?? ""} onValueChange={(v) => setW({ ...w, format: v })}>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>{formatOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            {/* 7. Duration */}
            <div className="space-y-2">
              <Label>7. Duration *</Label>
              <Select value={String(w.duration_min)} onValueChange={(v) => setW({ ...w, duration_min: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {[...new Set([...DURATION_OPTIONS, w.duration_min])].sort((a, b) => a - b).map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 8. Workout Content */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>8. Workout Content *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = (w.main_workout ?? "").replace(/<[^>]*>/g, "").trim();
                    if (current && !window.confirm("Replace current content with the standard 5-section structure? This cannot be undone.")) return;
                    setW((prev) => ({ ...prev, main_workout: STANDARD_SECTIONS_TEMPLATE }));
                    toast.success("Structure inserted — fill in exercises in each section, then save.");
                  }}
                >
                  Insert standard structure
                </Button>
              </div>
              <A4Container>
                <RichTextEditor
                  value={w.main_workout ?? ""}
                  onChange={(value) => setW((prev) => ({ ...prev, main_workout: value }))}
                  placeholder="Enter the complete workout content here - format with bold, bullets, headings, tables, etc..."
                  minHeight="300px"
                  showExerciseSearch
                />
              </A4Container>
              <p className="text-xs text-muted-foreground">Use the exercise search above the toolbar to add exercises with View buttons</p>
            </div>

            {/* 9. Description */}
            <div className="space-y-2">
              <Label>9. Description</Label>
              <A4Container>
                <RichTextEditor value={w.description_html ?? ""} onChange={(value) => setW((prev) => ({ ...prev, description_html: value }))} placeholder="Brief description of the workout..." minHeight="120px" />
              </A4Container>
            </div>

            {/* 10. Instructions */}
            <div className="space-y-2">
              <Label>10. Instructions</Label>
              <p className="text-sm italic text-muted-foreground">Note: exercises added from the library show their GIF and instructions to members automatically.</p>
              <A4Container>
                <RichTextEditor value={w.instructions_html ?? ""} onChange={(value) => setW((prev) => ({ ...prev, instructions_html: value }))} placeholder="Step-by-step instructions..." minHeight="150px" />
              </A4Container>
            </div>

            {/* 11. Tips */}
            <div className="space-y-2">
              <Label>11. Tips</Label>
              <A4Container>
                <RichTextEditor value={w.tips_html ?? ""} onChange={(value) => setW((prev) => ({ ...prev, tips_html: value }))} placeholder="Helpful tips for this workout..." minHeight="120px" />
              </A4Container>
            </div>

            {/* Image */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="aspect-[3/2] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-56">
                  {w.image_url && <img src={w.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sw-gen">Generate Unique Image</Label>
                      <p className="text-sm text-muted-foreground">AI will create a unique workout cover image based on title, category, and format when you save</p>
                    </div>
                    <Switch id="sw-gen" checked={generateUnique} onCheckedChange={setGenerateUnique} />
                  </div>
                  {!generateUnique && (
                    <div className="space-y-2">
                      <Label htmlFor="sw-img">Or Enter Image URL Manually</Label>
                      <Input id="sw-img" value={w.image_url ?? ""} onChange={(e) => setW({ ...w, image_url: e.target.value || null })} placeholder="https://..." />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={imgBusy} onClick={() => void regen()}>
                          {imgBusy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}Generate now
                        </Button>
                        <Button size="sm" variant="outline" disabled={imgBusy} onClick={() => fileRef.current?.click()}>
                          <Upload className="mr-1 h-4 w-4" />Upload picture
                        </Button>
                      </div>
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
                  )}
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <div>
                <Label htmlFor="sw-vis">Visible on Smarty Workouts</Label>
                <p className="text-sm text-muted-foreground">Hidden workouts stay in your admin panel only.</p>
              </div>
              <Switch id="sw-vis" checked={w.is_visible} onCheckedChange={(v) => setW({ ...w, is_visible: v })} />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setPreview(true)}><Eye className="mr-1 h-4 w-4" />Preview</Button>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save Workout
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

/** What members see under the workout on their own copy. Shown for review only. */
function MemberSectionsPreview() {
  const box = "mt-6 rounded-2xl border-2 border-blue-400 bg-card p-5";
  return (
    <div aria-disabled className="pointer-events-none select-none">
      <p className="mt-6 rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        Preview — members use the sections below on their own copy of this workout.
      </p>
      <section className={box}>
        <h3 className="text-lg font-bold">Workout status</h3>
        <p className="mt-1 text-sm text-muted-foreground">Mark it done or not done, or schedule a day and time.</p>
      </section>
      <section className={box}>
        <h3 className="text-lg font-bold">Log performance</h3>
        <p className="mt-1 text-sm text-muted-foreground">Sets, reps, weight, time and effort for every exercise.</p>
      </section>
      <Button size="lg" className="mt-6 h-14 w-full rounded-2xl text-base font-bold" disabled>
        I finished this workout
      </Button>
    </div>
  );
}
