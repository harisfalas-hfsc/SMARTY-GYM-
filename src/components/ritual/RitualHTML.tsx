import DOMPurify from "dompurify";
import { useMemo } from "react";

export function RitualHTML({ html }: { html: string }) {
  const safe = useMemo(
    () => (typeof window === "undefined" ? "" : DOMPurify.sanitize(html ?? "")),
    [html],
  );
  return (
    <div
      className="prose prose-sm max-w-none text-foreground dark:prose-invert [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
