import type { ReactNode } from "react";

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

function escape(text: string) {
  return text.replace(ESCAPE, "\\$&");
}

/**
 * Renders a piece of Coach copy with the Coach name and the member's own name
 * in the brand colour. Anything else keeps the surrounding text colour, so the
 * wording, size and weight are untouched — only the colour changes.
 */
export function BrandText({ text, name }: { text: string; name?: string | null }) {
  const terms = ["Smarty Coach", name].filter((term): term is string => Boolean(term && term.trim()));
  if (!terms.length) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escape).join("|")})`, "g");
  const isTerm = new Set(terms);
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        isTerm.has(part) ? (
          <span key={index} className="text-primary">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export type { ReactNode };
