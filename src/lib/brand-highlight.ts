/**
 * Highlights brand names ("Smarty Gym", "Charis Falas", "Haris Falas") in the
 * primary color everywhere rendered text appears — including content that
 * loads after hydration.
 *
 * DOM post-processing approach: walks text nodes and wraps matches in
 * span.brand-highlight. Runs after hydration; never blocks or traps paint.
 * Opt-out any element with [data-brand-skip] (e.g. the SMARTY/GYM logo).
 */

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

function shouldSkip(node: Node): boolean {
  let el: Element | null =
    node.nodeType === 3 ? node.parentElement : (node as Element);
  while (el) {
    if (el.hasAttribute("data-brand-skip")) return true;
    if (el.classList?.contains("brand-highlight")) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
}

export function applyBrandHighlights(root: ParentNode = document.body): void {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const text = node.nodeValue ?? "";
    if (text && BRAND_RE.test(text) && !shouldSkip(node)) targets.push(node as Text);
    BRAND_RE.lastIndex = 0;
    node = walker.nextNode();
  }

  for (const textNode of targets) {
    const text = textNode.nodeValue ?? "";
    const frag = document.createDocumentFragment();
    let last = 0;
    BRAND_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BRAND_RE.exec(text))) {
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const span = document.createElement("span");
      span.className = "brand-highlight";
      span.textContent = match[0];
      frag.appendChild(span);
      last = match.index + match[0].length;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

/** MutationObserver that keeps highlights applied to dynamically added content. */
export function watchBrandHighlights(
  root: ParentNode = document.body,
): () => void {
  if (typeof MutationObserver === "undefined") return () => {};
  let scheduled = false;
  let applying = false;
  let observer: MutationObserver | null = null;

  const run = () => {
    scheduled = false;
    applying = true;
    try {
      applyBrandHighlights(root);
    } finally {
      applying = false;
    }
  };

  observer = new MutationObserver(() => {
    if (applying || scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });

  return () => observer?.disconnect();
}
