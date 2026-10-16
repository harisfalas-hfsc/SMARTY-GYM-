# Remaining SEO / AI-crawler items from the audit

## Status of the audit (what is already done)

My side (on-site, background only):
- AI crawler declarations in robots.txt (GPTBot, ClaudeBot, PerplexityBot, Applebot-Extended, GrokBot, etc.) with llms.txt / llms-full.txt references — DONE
- `<link rel="alternate" type="text/plain" href="/llms.txt">` discovery tags in the root head — DONE
- FAQPage JSON-LD on /the-smarty-method, /training-load-science, and blog articles — DONE
- Article JSON-LD on blog posts — DONE
- Sitemap, image sitemap, Organization / founder credentials / SoftwareApplication schema — already in place

Your side (unchanged, as agreed):
- Comparison blog articles and guest posts / podcast mentions / digital PR
- External authority profiles (Crunchbase, professional registries) linking to smartygym.com

## What remains on my side

1. **Structured comparison data (audit item A3)** — add a machine-readable comparison (Smarty Coach sports-science rules vs generic AI workout generation) as hidden structured data (JSON-LD ItemList/Table-style FAQ entries) on /the-smarty-method. No visible layout change; content lives in the page head/schema only.
2. **Intent-keyword title/description tuning (audit item B2, on-site part only)** — review titles and meta descriptions of public pages so they target "online workout coach", "workout generator", "sports science workout programs" rather than physical-gym phrasing. Metadata only; no visual change.
3. **Verification** — run the test suite, confirm the build is clean, and check rendered head output in a test browser to confirm nothing visible changed.

## Technical notes

- Changes touch only `src/lib/seo/faq.ts`, route `head()` metadata, and `src/routes/the-smarty-method.tsx` schema blocks.
- No new visible pages, no layout or style changes, no customer data touched.
- Everything goes live on smartygym.com with the next publish.
