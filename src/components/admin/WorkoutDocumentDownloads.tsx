import { useRef, useState } from "react";
import { Download, FileDown, FileText, Loader2 } from "lucide-react";
import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createAssetEmbedder } from "@/lib/standalone-html";
import { deliverExerciseFile } from "@/lib/exercise-card-export";

export function WorkoutDocumentDownloads({ count, disabled, filename, load, selected = false }: {
  count: number; disabled?: boolean; filename: string; selected?: boolean;
  load: (report: (message: string) => void, cancelled: () => boolean) => Promise<WorkoutRow[]>;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(""), [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<{ blob: Blob; name: string } | null>(null);
  const generation = useRef(0);
  async function prepare(format: "pdf" | "docx") {
    const run = ++generation.current;
    const cancelled = () => run !== generation.current;
    setOpen(true); setBusy(true); setError(null); setReady(null); setStatus("Loading workouts…");
    try {
      const workouts = await load(message => { if (!cancelled()) setStatus(message); }, cancelled);
      if (!workouts.length) throw new Error("No workouts selected.");
      const { prepareWorkoutDocument, workoutPdfDocument, workoutWordDocument } = await import("@/lib/workout-document-export");
      const embed = createAssetEmbedder(), hosts = [];
      let size = 0;
      for (const [index, workout] of workouts.entries()) {
        if (cancelled()) return;
        setStatus(`Preparing workout ${index + 1} of ${workouts.length}…`);
        const host = await prepareWorkoutDocument(workout, embed);
        size += host.innerHTML.length;
        if (size > 100_000_000) throw new Error("This selection is too large. Select fewer workouts and download in batches.");
        hosts.push(host);
      }
      if (cancelled()) return;
      setStatus(`Creating ${format === "docx" ? "Word" : "PDF"}…`);
      const blob = await (format === "docx" ? workoutWordDocument(hosts) : workoutPdfDocument(hosts));
      if (!cancelled()) { setReady({ blob, name: `${filename}.${format}` }); setStatus(`${workouts.length} workouts ready`); }
    } catch (e) { if (!cancelled()) setError(e instanceof Error ? e.message : "The download could not be prepared."); }
    finally { if (!cancelled()) setBusy(false); }
  }
  const label = count === 1 ? "" : selected ? "Selected · " : "All filtered · ";
  return <>
    <Button variant="outline" size="sm" disabled={disabled || !count || busy} onClick={() => void prepare("docx")}><FileText className="mr-1 h-4 w-4" />{label}Word ({count})</Button>
    <Button variant="outline" size="sm" disabled={disabled || !count || busy} onClick={() => void prepare("pdf")}><FileDown className="mr-1 h-4 w-4" />{label}PDF ({count})</Button>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { generation.current++; setBusy(false); setReady(null); } }}>
      <DialogContent className="max-w-md"><DialogTitle>Workout download</DialogTitle><DialogDescription>{status}</DialogDescription>
        {busy && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {ready && <Button onClick={() => { void deliverExerciseFile(ready.blob, ready.name).then(() => { setOpen(false); setReady(null); generation.current++; }).catch(() => setError("The file could not be saved. Please try again.")); }}><Download className="mr-2 h-4 w-4" />Download {ready.name.endsWith(".pdf") ? "PDF" : "Word"}</Button>}
      </DialogContent>
    </Dialog>
  </>;
}