# Bring the full SmartyGym search setup across, without breaking what already ranks

I compared this project against the old one file by file. The good news: the whole search and AI-crawler setup already came across with the clone. The only differences are the brand name, the domain and the email — all already updated to SmartyGym. Nothing is missing structurally:

- Sitemap at `/sitemap.xml` — all pages, all training guides, all published blog articles, built live.
- `robots.txt` — same rules as before, with `Sitemap: https://smartygym.com/sitemap.xml`.
- `/llms.txt` for AI crawlers (ChatGPT, Claude, Perplexity, Gemini) — same content, rebranded.
- All the structured data (organization, website, app, FAQ, breadcrumbs, exercise data) — present.
- Titles, descriptions, canonical links, social share tags on every page — present.
- Google Analytics — the same measurement ID as the old site is already in place.

So this plan is about closing the real gaps and proving everything works before you publish.

## 1. Page-by-page verification against the old site

Go through every public page in both projects side by side and confirm the new one has an equal-or-better title, description, canonical link, social image and structured data. Fix any page where something was lost or still says the old name. Also confirm no page accidentally tells search engines not to index it.

## 2. Make sure no old address becomes a dead end

Every address Google already knows must still answer here, otherwise that page's ranking is lost. I will list every page the old site published (including all its blog articles) and check each one against this project. Anything that no longer exists gets a permanent redirect to the closest matching page, so the ranking transfers instead of disappearing.

This matters most for the blog: the old site had 99 articles, and only the Fitness ones are being brought here. Every non-Fitness article address gets a redirect to the blog index (or to its closest match) rather than a 404.

## 3. Search Console and analytics

- Add a Google Search Console verification tag to this project so the property stays verified after the switch (if your verification is by DNS record, nothing is needed and I will confirm that instead).
- Confirm the analytics tag fires on the live pages, not just in the code.
- After publishing: resubmit the sitemap and request re-indexing of the homepage.

## 4. Prove it works

- Load `/sitemap.xml`, `/robots.txt` and `/llms.txt` on the running site and read them.
- Spot-check the rendered page source of the homepage, a training guide, a blog article and the exercise library for title, description, canonical and share tags.
- Run the SEO review and fix whatever it flags.
- Typecheck and build clean.

## Technical notes

- Files involved: `src/routes/__root.tsx` (sitewide tags, structured data, analytics), `src/routes/sitemap[.]xml.ts`, `src/routes/llms[.]txt.ts`, `src/lib/seo/*`, `public/robots.txt`, and the `head()` block of each route.
- Redirects for retired addresses: handled in the router as permanent (301) redirects, plus a catch-all for old blog slugs that resolves to the article when present and to `/blog` when not.
- The sitemap already drops `/pricing` automatically when payments are switched off; that behaviour stays.
- No change to canonical domain: `https://smartygym.com` everywhere.
