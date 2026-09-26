/**
 * Highlights brand names ("Smarty Gym", "Charis Falas", "Haris Falas") in the
 * primary color everywhere rendered text appears — including content that
 * loads after hydration.
 *
 * Uses the CSS Custom Highlight API (CSS.highlights + ::highlight()), which
 * colors matched ranges WITHOUT mutating the DOM — so it can never conflict
 * with React hydration. Browsers without support simply show plain text.
 * Opt-out any element with [data-brand-skip] (e.g. the SMARTY/GYM logo).
 */

const HIGHLIGHT_NAME = "brand-name";

const BRAND_RE = /\b(Smarty\s*Gym|Charis\s+Falas|Haris\s+Falas)\b/gi;

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "TITLE",
]);

interface HighlightApi {
  highlights: Map<string, unknown>;
}
type HighlightCtor = new (...ranges: Range[]) => unknown;

function shouldSkip(textNode: Text): boolean {
  let el: Element | null = textNode.parentElement;
  while (el) {
    if (el.hasAttribute("data-brand-skip")) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
}

function applyBrandHighlights(): void {
  const api = CSS as unknown as HighlightApi | undefined;
  const HighlightCtor = (
    window as unknown as { Highlight?: HighlightCtor }
  ).Highlight;
  if (!api?.highlights || !HighlightCtor) return;

  const ranges: Range[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const text = textNode.nodeValue ?? "";
    if (text) {
      BRAND_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = BRAND_RE.exec(text))) {
        if (!shouldSkip(textNode)) {
          const range = document.createRange();
          range.setStart(textNode, match.index);
          range.setEnd(textNode, match.index + match[0].length);
          ranges.push(range);
        }
      }
    }
    node = walker.nextNode();
  }

  api.highlights.set(HIGHLIGHT_NAME, new HighlightCtor(...ranges));
}

/** Re-computes highlights whenever the DOM changes (dynamic content, navigations). */
function watchBrandHighlights(): void {
  if (typeof MutationObserver === "undefined") return;
  let scheduled = false;

  const run = () => {
    scheduled = false;
    applyBrandHighlights();
  };

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

/**
 * Starts highlighting once the page has painted, then keeps it in sync with
 * DOM changes. Returns a cleanup function.
 */
export function startBrandHighlights(): () => void {
  if (typeof window === "undefined") return () => {};
  let cancelled = false;
  let started = false;

  const run = () => {
    if (cancelled || started) return;
    started = true;
    applyBrandHighlights();
    watchBrandHighlights();
  };

  const start = () => {
    requestAnimationFrame(() => requestAnimationFrame(run));
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
    // Fallback in case `load` is delayed by slow resources.
    const fallback = setTimeout(start, 3000);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }

  return () => {
    cancelled = true;
  };
}
