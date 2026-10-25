import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createAssetEmbedder, packageHtmlFiles, type HtmlExportFile } from "@/lib/standalone-html";
import { deliverExerciseFile } from "@/lib/exercise-card-export";

export function HtmlDownloadButton({ count, disabled, load, filename, label = "Download HTML" }: {
  count: number; disabled?: boolean; filename: string; label?: string;
  load: (report: (message: string) => void, embed: (src: string) => Promise<string>, cancelled: () => boolean) => Promise<HtmlExportFile[]>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<{ blob: Blob; filename: string } | null>(null);
  const generation = useRef(0);
  async function prepare() {
    const run = ++generation.current;
    setOpen(true); setBusy(true); setReady(null); setError(null); setStatus("Preparing HTML…");
    try {
      const files = await load(message => { if (run === generation.current) setStatus(message); }, createAssetEmbedder(), () => run !== generation.current);
      if (run !== generation.current) return;
      // Keep browser packaging bounded. No silent truncation or partial successful downloads.
      if (files.reduce((size, file) => size + file.html.length, 0) > 180_000_000) throw new Error("This selection is too large for one download. Select fewer items and download in batches.");
      setStatus("Packaging HTML…");
      const file = await packageHtmlFiles(files, filename);
      if (run === generation.current) { setReady(file); setStatus(`${files.length} ${files.length === 1 ? "HTML file" : "HTML files"} ready`); }
    } catch (e) { if (run === generation.current) setError(e instanceof Error ? e.message : "Could not prepare this download."); }
    finally { if (run === generation.current) setBusy(false); }
  }
  return <>
    <Button variant="outline" size="sm" disabled={disabled || count === 0 || busy} onClick={() => void prepare()}><Download className="mr-1 h-4 w-4" />{label} ({count})</Button>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { generation.current++; setBusy(false); setReady(null); } }}>
      <DialogContent className="max-w-md"><DialogTitle>HTML download</DialogTitle><DialogDescription>{status}</DialogDescription>
        {busy && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {ready && <Button onClick={() => { void deliverExerciseFile(ready.blob, ready.filename).then(() => { setOpen(false); setReady(null); generation.current++; }).catch(() => setError("The file could not be saved. Please try again.")); }}><Download className="mr-2 h-4 w-4" />Download {ready.filename.endsWith(".zip") ? "ZIP" : "HTML"}</Button>}
      </DialogContent>
    </Dialog>
  </>;
}