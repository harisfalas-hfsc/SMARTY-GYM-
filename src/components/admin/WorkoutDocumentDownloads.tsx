import { useRef, useState } from "react";
import { Download, FileDown, FileText, Loader2 } from "lucide-react";
import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createAssetEmbedder } from "@/lib/standalone-html";
import { deliverExerciseFile } from "@/lib/exercise-card-export";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { withExportDeadline, withExportProgress } from "@/lib/export-timing";

export function WorkoutDocumentDownloads({ count, disabled, filename, load, selected = false, menu = false }: {
  count: number; disabled?: boolean; filename: string; selected?: boolean;
  menu?: boolean;
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
      const { prepareWorkoutDocument, workoutPdfDocument, workoutWordDocument } = await withExportDeadline(import("@/lib/workout-document-export"), "Download tools took too long to load. Please retry.");
      const report = (message: string) => { if (!cancelled()) setStatus(message); };
      const workouts = await withExportProgress(progress => load(progress, cancelled), report, "Workouts stopped loading. Please retry or select a smaller batch.");
      if (!workouts.length) throw new Error("No workouts selected.");
      const fetchAsset = createAssetEmbedder();
      const embed = (src: string) => withExportDeadline(fetchAsset(src), "A workout picture took too long to download. Please retry.", 20_000);
      const hosts = [];
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
      const blob = await (format === "docx" ? withExportDeadline(workoutWordDocument(hosts), "Word preparation took too long. Please select a smaller batch.") : workoutPdfDocument(hosts, report, cancelled));
      if (!cancelled()) { setReady({ blob, name: `${filename}.${format}` }); setStatus(`${workouts.length} workouts ready`); }
    } catch (e) { if (!cancelled()) setError(e instanceof Error ? e.message : "The download could not be prepared."); }
    finally { if (!cancelled()) setBusy(false); }
  }
  const label = count === 1 ? "" : selected ? "Selected · " : "All filtered · ";
  return <>
    {menu ? <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={disabled || !count || busy}><Download className="mr-1 h-4 w-4" />Download</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void prepare("pdf")}><FileDown className="mr-2 h-4 w-4" />Download PDF</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void prepare("docx")}><FileText className="mr-2 h-4 w-4" />Download Word</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu> : <>
      <Button variant="outline" size="sm" disabled={disabled || !count || busy} onClick={() => void prepare("docx")}><FileText className="mr-1 h-4 w-4" />{label}Word ({count})</Button>
      <Button variant="outline" size="sm" disabled={disabled || !count || busy} onClick={() => void prepare("pdf")}><FileDown className="mr-1 h-4 w-4" />{label}PDF ({count})</Button>
    </>}
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { generation.current++; setBusy(false); setReady(null); } }}>
      <DialogContent className="max-w-md"><DialogTitle>Workout download</DialogTitle><DialogDescription aria-live="polite">{status}</DialogDescription>
        {busy && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && <Button variant="outline" onClick={() => { generation.current++; setBusy(false); setOpen(false); }}>Cancel</Button>}
        {ready && <Button onClick={() => { void deliverExerciseFile(ready.blob, ready.name).then(() => { setOpen(false); setReady(null); generation.current++; }).catch(() => setError("The file could not be saved. Please try again.")); }}><Download className="mr-2 h-4 w-4" />Download {ready.name.endsWith(".pdf") ? "PDF" : "Word"}</Button>}
      </DialogContent>
    </Dialog>
  </>;
}