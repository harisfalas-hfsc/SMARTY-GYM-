import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from "lucide-react";

/** Simple visual editor: edit the ritual exactly as it looks (bold, lists, emojis). */
export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = DOMPurify.sanitize(value ?? "");
    }
    // Only sync on first mount / when switching ritual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cmd = (c: string) => {
    ref.current?.focus();
    document.execCommand(c);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const tools = [
    { c: "bold", Icon: Bold, label: "Bold" },
    { c: "italic", Icon: Italic, label: "Italic" },
    { c: "insertUnorderedList", Icon: List, label: "Bullet list" },
    { c: "insertOrderedList", Icon: ListOrdered, label: "Numbered list" },
    { c: "undo", Icon: Undo2, label: "Undo" },
    { c: "redo", Icon: Redo2, label: "Redo" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border-2 border-input bg-background">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/50 p-1">
        {tools.map(({ c, Icon, label }) => (
          <button
            key={c}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => cmd(c)}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground hover:bg-accent"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[180px] p-3 text-sm leading-relaxed text-foreground outline-none [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline"
      />
    </div>
  );
}
