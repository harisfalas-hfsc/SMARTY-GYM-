import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, FileDown, FileText, ImagePlus, Loader2, Pencil, Plus, Sparkles, Trash2, Upload, PenLine, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AppConfirmDialog } from "@/components/ui/app-dialog";
import { BlogRichEditor } from "./blog/BlogRichEditor";
import { exportBlogPdf, exportBlogWord } from "@/lib/blog-export";
import {
  adminDeleteBlogArticles, adminDraftBlogArticle, adminGenerateBlogCover, adminListBlogArticles,
  adminSaveBlogArticle, adminSetBlogVisibility, adminUploadBlogCover, type AdminBlogArticle,
} from "@/lib/blog-admin.functions";

type Draft = { id?: string; slug?: string; title: string; excerpt: string; content: string; category: string; image_url: string | null; image_alt: string | null; is_published: boolean; read_time?: string | null; published_at?: string | null };
const EMPTY: Draft = { title: "", excerpt: "", content: "", category: "Fitness", image_url: null, image_alt: null, is_published: false };

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
const asExport = (a: Draft | AdminBlogArticle) => ({ title: a.title, excerpt: a.excerpt ?? null, content: a.content, category: a.category, read_time: a.read_time ?? null, published_at: a.published_at ?? null, is_published: a.is_published, image_url: a.image_url, slug: a.slug ?? "draft" });

export function AdminBlogTab() {
  const list = useServerFn(adminListBlogArticles);
  const save = useServerFn(adminSaveBlogArticle);
  const setVisibility = useServerFn(adminSetBlogVisibility);
  const remove = useServerFn(adminDeleteBlogArticles);
  const draftAi = useServerFn(adminDraftBlogArticle);
  const coverAi = useServerFn(adminGenerateBlogCover);
  const upload = useServerFn(adminUploadBlogCover);

  const [rows, setRows] = useState<AdminBlogArticle[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "hidden">("all");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [editorKey, setEditorKey] = useState("0");
  const [creating, setCreating] = useState<null | "choose" | "ai">(null);
  const [brief, setBrief] = useState({ title: "", about: "", keywords: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => list().then((r) => setRows(r.articles)).catch((e) => toast.error(String(e?.message ?? e)));
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const visible = useMemo(() => (rows ?? []).filter((a) =>
    (status === "all" || (status === "published" ? a.is_published : !a.is_published)) &&
    (!search.trim() || `${a.title} ${a.excerpt ?? ""} ${a.slug}`.toLowerCase().includes(search.trim().toLowerCase()))), [rows, search, status]);
  const targets = () => (rows ?? []).filter((a) => selected.has(a.id));

  const open = (d: Draft) => { setEditing(d); setEditorKey(String(Date.now())); };

  const exportFiles = async (format: "word" | "pdf", items: (Draft | AdminBlogArticle)[], name: string) => {
    if (busy) return;
    setBusy(format);
    try {
      if (format === "word") await exportBlogWord(items.map(asExport), name);
      else await exportBlogPdf(items.map(asExport), name);
      toast.success(`${format === "word" ? "Word" : "PDF"} downloaded`);
    } catch (e) {
      toast.error(`Could not export: ${e instanceof Error ? e.message : "please try again"}`);
    } finally { setBusy(null); }
  };

  const bulkVisibility = async (ids: string[], show: boolean) => {
    setBusy(`vis-${ids.join()}`);
    try {
      await setVisibility({ data: { ids, visible: show } });
      toast.success(show ? "Visible on the blog" : "Hidden from the blog");
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Could not update"); } finally { setBusy(null); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy("delete");
    try {
      await remove({ data: { ids: confirmDelete } });
      toast.success(`${confirmDelete.length} article${confirmDelete.length === 1 ? "" : "s"} deleted`);
      setSelected(new Set());
      setConfirmDelete(null);
      if (editing?.id && confirmDelete.includes(editing.id)) setEditing(null);
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Could not delete"); } finally { setBusy(null); }
  };

  const writeWithAi = async () => {
    setBusy("ai");
    try {
      const d = await draftAi({ data: { title: brief.title || undefined, about: brief.about, keywords: brief.keywords || undefined } });
      setCreating(null);
      open({ ...EMPTY, ...d });
      toast.success("Draft ready — review and edit it before publishing");
    } catch (e: any) { toast.error(e?.message ?? "The AI could not write the draft"); } finally { setBusy(null); }
  };

  const makeCover = async () => {
    if (!editing || editing.title.trim().length < 3) return toast.error("Add a title first");
    setBusy("cover");
    try {
      const { url } = await coverAi({ data: { title: editing.title, excerpt: editing.excerpt } });
      setEditing((p) => (p ? { ...p, image_url: url, image_alt: p.title } : p));
      toast.success("Cover picture created");
    } catch (e: any) { toast.error(e?.message ?? "Could not create the picture"); } finally { setBusy(null); }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return toast.error("Use a PNG, JPG or WEBP picture");
    if (file.size > 8 * 1024 * 1024) return toast.error("Picture must be under 8 MB");
    setBusy("cover");
    try {
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(file); });
      const { url } = await upload({ data: { base64, contentType: file.type as "image/png" } });
      setEditing((p) => (p ? { ...p, image_url: url, image_alt: p.title } : p));
      toast.success("Picture uploaded");
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); } finally { setBusy(null); if (fileRef.current) fileRef.current.value = ""; }
  };

  const submit = async () => {
    if (!editing) return;
    if (editing.title.trim().length < 3) return toast.error("Add a title");
    if (editing.content.replace(/<[^>]*>/g, "").trim().length < 20) return toast.error("Write the article text");
    if (editing.is_published && !editing.image_url) return toast.error("Add a cover picture before publishing");
    setBusy("save");
    try {
      await save({ data: { id: editing.id, title: editing.title, excerpt: editing.excerpt, content: editing.content, category: editing.category, image_url: editing.image_url, image_alt: editing.image_alt, is_published: editing.is_published } });
      toast.success(editing.is_published ? "Article saved and visible on the blog" : "Article saved as hidden");
      setEditing(null);
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Could not save"); } finally { setBusy(null); }
  };

  if (!rows) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const published = rows.filter((a) => a.is_published).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{rows.length} articles · {published} visible · {rows.length - published} hidden</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setCreating("choose")}><Plus className="mr-2 h-4 w-4" />Create new article</Button>
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void exportFiles("word", selected.size ? targets() : rows, "smartygym-blog")}><FileText className="mr-2 h-4 w-4" />{selected.size ? "Export selected" : "Export all"} · Word</Button>
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void exportFiles("pdf", selected.size ? targets() : rows, "smartygym-blog")}><FileDown className="mr-2 h-4 w-4" />{selected.size ? "Export selected" : "Export all"} · PDF</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or keyword" className="h-9 w-full sm:w-64" />
        {(["all", "published", "hidden"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)} className="capitalize">{s === "published" ? "Visible" : s}</Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelected(new Set(visible.map((a) => a.id)))}>Select all ({visible.length})</Button>
        <Button variant="ghost" size="sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
        {selected.size > 0 && <>
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void bulkVisibility([...selected], true)}><Eye className="mr-2 h-4 w-4" />Show</Button>
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void bulkVisibility([...selected], false)}><EyeOff className="mr-2 h-4 w-4" />Hide</Button>
          <Button variant="outline" size="sm" disabled={!!busy} className="text-destructive" onClick={() => setConfirmDelete([...selected])}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </>}
      </div>

      {visible.length === 0 && <p className="text-sm text-muted-foreground">No articles match.</p>}
      {visible.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-2xl border-2 border-coach-line bg-card p-3">
          <Checkbox className="mt-1" aria-label={`Select ${a.title}`} checked={selected.has(a.id)} onCheckedChange={(c) => setSelected((cur) => { const n = new Set(cur); if (c === true) n.add(a.id); else n.delete(a.id); return n; })} />
          <button type="button" onClick={() => open({ ...a, excerpt: a.excerpt ?? "" })} className="flex min-w-0 flex-1 items-start gap-3 text-left">
            {a.image_url ? <img src={a.image_url} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{a.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{a.category} · {a.read_time ?? "—"} · {fmt(a.published_at ?? a.created_at)}</span>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.is_published ? "bg-readiness-ready/15 text-readiness-ready" : "bg-muted text-muted-foreground"}`}>{a.is_published ? "Visible" : "Hidden"}</span>
            </span>
          </button>
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => open({ ...a, excerpt: a.excerpt ?? "" })}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={a.is_published ? "Hide" : "Show"} disabled={!!busy} onClick={() => void bulkVisibility([a.id], !a.is_published)}>{a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" aria-label="Delete" className="text-destructive" onClick={() => setConfirmDelete([a.id])}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}

      <Dialog open={creating !== null} onOpenChange={(o) => (busy === "ai" ? null : setCreating(o ? creating : null))}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg rounded-2xl">
          <DialogTitle>Create new article</DialogTitle>
          {creating === "choose" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setCreating("ai")} className="rounded-2xl border-2 border-coach-line bg-card p-4 text-left hover:border-primary">
                <Sparkles className="mb-2 h-6 w-6 text-primary" />
                <span className="block font-semibold">Write with AI</span>
                <span className="mt-1 block text-xs text-muted-foreground">Describe the subject and keywords. You review and edit the draft before anything is published.</span>
              </button>
              <button type="button" onClick={() => { setCreating(null); open(EMPTY); }} className="rounded-2xl border-2 border-coach-line bg-card p-4 text-left hover:border-primary">
                <PenLine className="mb-2 h-6 w-6 text-primary" />
                <span className="block font-semibold">Write it myself</span>
                <span className="mt-1 block text-xs text-muted-foreground">Start from a blank article with headings, lists and links.</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <DialogDescription>The AI writes a draft in your voice with internal links. Nothing is published until you press Save.</DialogDescription>
              <Input placeholder="Title or angle (optional)" value={brief.title} onChange={(e) => setBrief({ ...brief, title: e.target.value })} />
              <Textarea placeholder="What is the article about?" rows={4} value={brief.about} onChange={(e) => setBrief({ ...brief, about: e.target.value })} />
              <Input placeholder="Keywords (comma separated, optional)" value={brief.keywords} onChange={(e) => setBrief({ ...brief, keywords: e.target.value })} />
              <Button className="w-full" disabled={busy === "ai" || brief.about.trim().length < 3} onClick={() => void writeWithAi()}>
                {busy === "ai" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Writing the draft… (up to a minute)</> : <><Sparkles className="mr-2 h-4 w-4" />Write the draft</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => (!o && busy !== "save" ? setEditing(null) : null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto rounded-2xl">
          <DialogTitle>{editing?.id ? "Edit article" : "New article"}</DialogTitle>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1"><span className="text-sm font-semibold">Title</span><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="space-y-1"><span className="text-sm font-semibold">Short summary</span><Textarea rows={2} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
              <div className="space-y-1">
                <span className="text-sm font-semibold">Cover picture</span>
                <div className="flex flex-wrap items-center gap-3">
                  {editing.image_url ? <img src={editing.image_url} alt="" className="h-24 w-36 rounded-lg object-cover" /> : <span className="grid h-24 w-36 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">No picture</span>}
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" disabled={busy === "cover"} onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload my picture</Button>
                    <Button size="sm" variant="outline" disabled={busy === "cover"} onClick={() => void makeCover()}>{busy === "cover" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Create with AI</Button>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
                  </div>
                </div>
              </div>
              <div className="space-y-1"><span className="text-sm font-semibold">Article</span>
                <BlogRichEditor resetKey={editorKey} value={editing.content} onChange={(html) => setEditing((p) => (p ? { ...p, content: html } : p))} />
              </div>
              <label className="flex items-center justify-between rounded-xl border border-coach-line p-3">
                <span className="text-sm"><strong>Visible on the blog</strong><span className="block text-xs text-muted-foreground">Off keeps it hidden as a draft.</span></span>
                <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="outline" disabled={!!busy} onClick={() => void exportFiles("word", [editing], editing.slug ?? "article")}><FileText className="mr-2 h-4 w-4" />Word</Button>
                <Button variant="outline" disabled={!!busy} onClick={() => void exportFiles("pdf", [editing], editing.slug ?? "article")}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                {editing.slug && editing.id && <Button variant="outline" asChild><a href={`/blog/${editing.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View</a></Button>}
                {editing.id && <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete([editing.id!])}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>}
              </div>
              <Button className="w-full" disabled={busy === "save"} onClick={() => void submit()}>{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AppConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} tone="danger" busy={busy === "delete"}
        title={`Delete ${confirmDelete?.length ?? 0} article${confirmDelete?.length === 1 ? "" : "s"}?`}
        description="This removes them from the blog permanently. To keep an article but take it offline, hide it instead."
        confirmLabel="Delete" onConfirm={doDelete} />
    </div>
  );
}
