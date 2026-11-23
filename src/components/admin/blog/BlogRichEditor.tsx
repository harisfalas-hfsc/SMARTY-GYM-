import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Pilcrow, Link2, Unlink, Quote, Undo2, Redo2 } from "lucide-react";

/** Visual article editor: headings, emphasis, lists, quotes and hyperlinks — the same HTML the blog renders. */
export function BlogRichEditor({ value, onChange, resetKey }: { value: string; onChange: (html: string) => void; resetKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  const emit = () => ref.current && onChange(ref.current.innerHTML);
  const run = (c: string, v?: string) => { ref.current?.focus(); document.execCommand(c, false, v); emit(); };
  const saved = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const link = () => {
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    setUrl("");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const href = url.trim();
    setLinkOpen(false);
    if (!href) return;
    ref.current?.focus();
    const sel = window.getSelection();
    if (saved.current && sel) { sel.removeAllRanges(); sel.addRange(saved.current); }
    if (sel && !sel.isCollapsed) document.execCommand("createLink", false, href);
    else document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${href}</a>`);
    emit();
  };
  const tools = [
    { k: "h2", Icon: Heading2, label: "Section heading", f: () => run("formatBlock", "H2") },
    { k: "h3", Icon: Heading3, label: "Sub-heading", f: () => run("formatBlock", "H3") },
    { k: "p", Icon: Pilcrow, label: "Paragraph", f: () => run("formatBlock", "P") },
    { k: "b", Icon: Bold, label: "Bold", f: () => run("bold") },
    { k: "i", Icon: Italic, label: "Italic", f: () => run("italic") },
    { k: "ul", Icon: List, label: "Bullet list", f: () => run("insertUnorderedList") },
    { k: "ol", Icon: ListOrdered, label: "Numbered list", f: () => run("insertOrderedList") },
    { k: "q", Icon: Quote, label: "Quote", f: () => run("formatBlock", "BLOCKQUOTE") },
    { k: "a", Icon: Link2, label: "Add link", f: link },
    { k: "x", Icon: Unlink, label: "Remove link", f: () => run("unlink") },
    { k: "u", Icon: Undo2, label: "Undo", f: () => run("undo") },
    { k: "r", Icon: Redo2, label: "Redo", f: () => run("redo") },
  ];
  return (
    <div className="overflow-hidden rounded-xl border-2 border-input bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-border bg-muted p-1">
        {tools.map(({ k, Icon, label, f }) => (
          <button key={k} type="button" aria-label={label} title={label} onMouseDown={(e) => e.preventDefault()} onClick={f}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground hover:bg-accent">
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      {linkOpen && (
        <div className="flex gap-2 border-b border-border bg-muted/60 p-2">
          <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") setLinkOpen(false); }}
            placeholder="/wod, /exercise-library or https://…" className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm" />
          <button type="button" onClick={applyLink} className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">Add link</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-8 rounded-md px-2 text-xs">Cancel</button>
        </div>
      )}
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={emit} onBlur={emit}
        className="min-h-[320px] p-4 text-sm leading-relaxed text-foreground outline-hidden [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5" />
    </div>
  );
}
