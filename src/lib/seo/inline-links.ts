/**
 * Turns plain-text mentions of exercises and workouts inside article HTML into
 * internal links. Invisible by design: anchors inherit the article's existing
 * link styling. Each name is linked at most once, longest names first, and
 * existing markup (tags, links, headings) is never touched.
 */

export interface LinkTarget {
  name: string;
  url: string;
}

const MAX_LINKS_PER_ARTICLE = 15;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function linkifyMentions(html: string, targets: LinkTarget[]): string {
  if (!html || targets.length === 0) return html;

  const sorted = [...targets]
    .filter((t) => t.name.trim().length >= 4 && /^[a-z0-9 /&'()-]+$/i.test(t.name))
    .sort((a, b) => b.name.length - a.name.length);

  // Split into tags and text nodes so only visible text is rewritten.
  const parts = html.split(/(<[^>]+>)/g);
  let insideAnchor = 0;
  let linksAdded = 0;
  const used = new Set<string>();

  const out = parts.map((part) => {
    if (part.startsWith("<")) {
      if (/^<a[\s>]/i.test(part)) insideAnchor++;
      else if (/^<\/a\s*>/i.test(part)) insideAnchor = Math.max(0, insideAnchor - 1);
      return part;
    }
    if (insideAnchor > 0 || linksAdded >= MAX_LINKS_PER_ARTICLE || !part.trim()) return part;

    let text = part;
    for (const target of sorted) {
      if (linksAdded >= MAX_LINKS_PER_ARTICLE) break;
      const key = target.name.toLowerCase();
      if (used.has(key)) continue;
      const re = new RegExp(`\\b(${escapeRegExp(target.name)})\\b`, "i");
      const match = re.exec(text);
      if (!match) continue;
      used.add(key);
      linksAdded++;
      text =
        text.slice(0, match.index) +
        `<a href="${target.url}">${match[1]}</a>` +
        text.slice(match.index + match[0].length);
    }
    return text;
  });

  return out.join("");
}
