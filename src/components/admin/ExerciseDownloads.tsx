import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getExerciseMediaUrl } from "@/lib/exercise-media";
import { blobDataUrl, deliverExerciseFile, exerciseFacts, exerciseFilename, exerciseHtml, exercisePdf, type ExportExercise } from "@/lib/exercise-card-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function loadExercises() {
  const rows: ExportExercise[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("exercises")
      .select("id,name,body_part,equipment,target_muscle,secondary_muscles,difficulty,description,instructions,gif_path")
      .eq("is_active", true).order("name").range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

type Prepared = { id: string; html: Blob; pdf: Blob; png: Blob; media: Blob | null; extension: string };

/** Mounted only after the existing admin access check. Reads public exercise facts; never mutates rows. */
export function ExerciseDownloads() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-exercise-downloads"], queryFn: loadExercises, staleTime: 600_000 });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExportExercise | null>(null);
  const [media, setMedia] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const preview = useRef<HTMLElement>(null);
  const q = query.toLowerCase().trim();
  const matches = data.filter(ex => [ex.name, ex.equipment, ex.target_muscle, ex.body_part, ...(ex.secondary_muscles ?? [])].join(" ").toLowerCase().includes(q));

  useEffect(() => {
    let active = true;
    setMedia(null); setPrepared(null); setNotice(null);
    if (!selected) return;
    setBusy(true);
    const ex = selected;
    void (async () => {
      let demonstration: Blob | null = null;
      if (ex.gif_path) {
        try {
          const url = await getExerciseMediaUrl(ex.gif_path);
          if (!url) throw new Error("Missing demonstration");
          const response = await fetch(url);
          if (!response.ok) throw new Error("Missing demonstration");
          demonstration = await response.blob();
          if (!demonstration.type.startsWith("image/")) throw new Error("Not an image");
        } catch { demonstration = null; }
      }
      const source = demonstration ? await blobDataUrl(demonstration) : null;
      if (!active) return;
      setMedia(source);
      if (!source) setNotice("This library record has no available demonstration. Its description and instructions can still be downloaded.");
      // Allow the preview to commit before capturing its complete, unscrolled contents.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const root = preview.current;
      if (!root || !active) return;
      await document.fonts.ready;
      await Promise.all(Array.from(root.querySelectorAll("img")).map(img => img.decode()));
      const image = root.querySelector("img");
      let staticImage: string | null = null;
      if (image) {
        const frame = document.createElement("canvas"); frame.width = image.naturalWidth; frame.height = image.naturalHeight;
        const context = frame.getContext("2d");
        if (!context) throw new Error("The picture could not be prepared.");
        context.drawImage(image, 0, 0); staticImage = frame.toDataURL("image/png");
      }
      const styles = getComputedStyle(root);
      const colors = { background: styles.backgroundColor, foreground: styles.color, primary: getComputedStyle(root.querySelector("h3") ?? root).color };
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(root, { scale: 2, logging: false, backgroundColor: colors.background });
      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create picture.")), "image/png"));
      const pdf = await exercisePdf(ex, staticImage, colors.primary);
      if (active) setPrepared({ id: ex.id, html: new Blob([exerciseHtml(ex, source, colors)], { type: "text/html;charset=utf-8" }), pdf, png, media: demonstration, extension: ex.gif_path?.split(".").pop()?.toLowerCase() ?? "gif" });
    })().catch(e => { if (active) setNotice(e instanceof Error ? e.message : "Could not prepare downloads."); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [selected]);

  function download(kind: "html" | "pdf" | "png" | "media") {
    if (!selected || !prepared || prepared.id !== selected.id) return;
    const blob = prepared[kind];
    if (!blob) return;
    void deliverExerciseFile(blob, `${exerciseFilename(selected)}.${kind === "media" ? prepared.extension : kind}`).catch(() => setNotice("The download could not be saved. Please try again."));
  }

  return <Card className="md:col-span-2">
    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4 text-primary" />Download exercise cards</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search exercises to download" placeholder="Search by exercise, equipment or muscle" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" /></label>
      {isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading exercises…</p> : error ? <p role="alert" className="text-sm text-destructive">The exercise library could not be loaded.</p> : <>
        <p className="text-sm text-muted-foreground">{matches.length} exercises</p>
        <div className="max-h-52 overflow-y-auto divide-y divide-border rounded-lg border">
          {matches.slice(0, 60).map(ex => <Button key={ex.id} variant={selected?.id === ex.id ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal rounded-none px-3 py-2 text-left" onClick={() => setSelected(ex)}><span><span className="block capitalize">{ex.name}</span><span className="block text-xs font-normal capitalize text-muted-foreground">{[ex.equipment, ex.target_muscle].filter(Boolean).join(" · ")}</span></span></Button>)}
          {!matches.length && <p className="p-3 text-sm text-muted-foreground">No matching exercises.</p>}
        </div>
      </>}
      {selected && <>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!prepared?.media || busy} onClick={() => download("media")}><Download className="mr-2 h-4 w-4" />Download GIF</Button>
          <Button variant="outline" disabled={!prepared || busy} onClick={() => download("html")}><Download className="mr-2 h-4 w-4" />Animated card (HTML)</Button>
          <Button variant="outline" disabled={!prepared || busy} onClick={() => download("png")}><Download className="mr-2 h-4 w-4" />Static card (PNG)</Button>
          <Button variant="outline" disabled={!prepared || busy} onClick={() => download("pdf")}><Download className="mr-2 h-4 w-4" />PDF card</Button>
        </div>
        {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing downloads…</p>}
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <article ref={preview} aria-label="Exercise download preview" className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border-2 border-primary bg-card text-card-foreground">
          {media && <img src={media} alt={`${selected.name} demonstration`} className="block max-h-64 w-full border-b-2 border-primary object-contain" />}
          <div className="space-y-4 p-4 sm:p-5">
            <h3 className="text-xl font-bold capitalize leading-tight text-primary">{selected.name}</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">{exerciseFacts(selected).map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-primary">{label}</dt><dd className="capitalize">{value}</dd></div>)}</dl>
            {selected.description && <p className="border-t border-primary/60 pt-4 text-sm leading-relaxed">{selected.description}</p>}
            {selected.instructions?.length ? <section className="border-t border-primary/60 pt-4"><h4 className="mb-2 text-xs font-semibold uppercase text-primary">How to perform</h4><ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">{selected.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol></section> : null}
            <footer className="border-t border-primary/60 pt-3 text-center text-xs text-muted-foreground">SMARTYGYM<br />Your Gym Re-imagined. Anywhere, Anytime.<br />smartygym.com</footer>
          </div>
        </article>
      </>}
    </CardContent>
  </Card>;
}