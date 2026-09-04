# Comprehensive, self-updating SEO for search engines and AI answer engines

Hard rule for the whole job: **zero visual change**. No new links in the header, footer, menus or any page body. No layout, styling, wording or component changes on screen. Everything happens in the invisible part of the pages (the information crawlers read), in background files, and in the weekly automatic job.

## What exists today

- Every public page already has a title, description, social tags, a canonical address and structured data.
- `robots.txt` already names the AI crawlers (ChatGPT/GPTBot, OAI-SearchBot, Claude, Perplexity, Google-Extended, Bing) and points to the sitemap.
- `/sitemap.xml` lists 69 addresses (all public pages + 40 blog articles); `/llms.txt` gives AI engines a plain-text site summary.
- A weekly "Automatic SEO update" job already rebuilds a site-wide keyword index from pages, training topics, the exercise library and every generated workout, then emails a report.
- Gaps: blog articles have no dedicated SEO fields (search title, meta description, focus keyphrase, keyword set, image alt text, FAQ data) — the page reuses the raw title and excerpt; shared community workouts are marked "do not index"; legal pages have no structured data; nothing tells Bing/ChatGPT about new content between crawls; the weekly job only touches keywords, not page-level optimization.

## What will be built

### 1. One SEO brain for every public page
A single background definition file holds, per page, the search title, meta description, focus keyphrase, supporting keyphrases and the structured-data type. Every public route reads from it through one shared builder, so all pages emit a consistent, complete set: title, description, keywords, canonical, Open Graph, Twitter card, `max-image-preview:large`, `max-snippet`, language/`x-default` tags, breadcrumbs, and page-appropriate structured data (Organization + WebSite with site search, FAQ data on the FAQ page, HowTo on How it works, product/offer data on Pricing, item lists on Blog, Exercise Library and Training, professional profile on the coach pages, and legal-page schema on Privacy, Terms and Disclaimer).

Pages covered: Home, How it works, Workout of the Day, Exercise Library, Blog (index + every article), Training index + all 9 training topic pages, Glossary, Tools (hub + 1RM calculator, workout timer, rounds tracker), Pricing, FAQ, About, Founder note, Haris Falas, Contact, Community, Privacy, Terms, Disclaimer.

Member-only areas (Smarty Coach, Logbook, Progress, Training Profile, Account, Notifications) stay private and correctly marked "index: no, follow links" — their search demand is served by the public pages above. Their titles/descriptions are still cleaned up for browser tabs and shares.

### 2. Blog articles: real, per-article optimization
- New background fields on articles: search title, meta description, focus keyphrase, keyword set, image alt text, FAQ pairs, reading time, and a "last optimized" marker with a content fingerprint.
- An optimizer (Lovable AI) fills them from the article's own content: a title tuned for search that keeps the human title intact on screen, a 150-character description, one focus keyphrase plus supporting phrases, descriptive alt text for the cover image, and 2–4 genuine FAQ pairs pulled from the text.
- All 40 existing articles are optimized in bounded batches; every newly generated article is optimized in the same run that creates it.
- The article page then serves the optimized title/description/keywords, article + FAQ + breadcrumb structured data, author and publish/update dates, and the cover image with proper alt text (alt text is invisible on screen).

### 3. Workouts made discoverable (only the ones members chose to share)
Shared community workouts become indexable pages with their own generated title, description, keyphrases and exercise/structured data, and they enter the sitemap. Private workouts and personal Workout-of-the-Day sessions stay non-indexable. Page appearance is untouched.

### 4. Sitemaps, feeds and crawler files
- Sitemap index split into pages / blog / workouts, with accurate last-modified dates from the content itself and cover images attached to article entries (helps Google Images).
- `/llms.txt` expanded and a new `/llms-full.txt` added: the full plain-text corpus of public pages and articles, which is what ChatGPT, Claude, Perplexity and Gemini prefer to read.
- `robots.txt` reviewed so every AI and search crawler in the list is explicitly allowed on public content and kept out of member areas, with all sitemaps declared.

### 5. Tell the engines immediately (IndexNow)
Bing, ChatGPT-search-via-Bing, Yandex and others accept instant notifications. A key file is added and every new or re-optimized address is submitted automatically — new articles the moment they publish, everything else in the weekly pass. Google is notified through the freshened sitemap dates.

### 6. The weekly job becomes a full optimization pass
The existing "Automatic SEO update" job is extended (same switch, same admin section, same email report) to, each week:
1. rebuild the keyword index (as now),
2. optimize any new or edited blog article,
3. generate metadata for newly shared workouts,
4. re-check page definitions against actual page content and flag drift,
5. submit everything changed to IndexNow,
6. email the administrator a report of what changed.

Safeguards: a fixed work budget per run, a single-run lock, per-item "already done" markers so nothing is redone or double-charged, and an automatic pause with an admin alert if the AI credit or rate limits are hit.

## Verification before I report back
- Build and type checks clean.
- Every public address fetched and checked for a unique title, description, canonical, social tags and valid structured data (JSON parsed and validated).
- Sitemaps, robots, `llms.txt`, `llms-full.txt` and the IndexNow key file fetched and confirmed.
- The weekly job run manually end to end: articles optimized, report email sent, second run correctly reports "nothing new".
- Before/after screenshots of the homepage, blog, an article, WOD, exercise library and pricing compared to prove **nothing visible changed**.

## Technical notes
- New: `src/lib/seo/page-seo.ts` (per-page definitions), `src/lib/seo/head.ts` (shared head/schema builder), `src/lib/seo/schema.ts`, `src/lib/seo/article-optimizer.server.ts`, `src/lib/seo/workout-seo.server.ts`, `src/lib/seo/indexnow.server.ts`, `src/routes/llms-full[.]txt.ts`, `sitemap-pages/blog/workouts` routes under the existing sitemap index.
- Migration: SEO columns on `blog_articles` plus a `seo_jobs` progress/lease table, with grants and RLS (admin read, service role write).
- Article/workout optimization runs through the Lovable AI gateway on `openai/gpt-5.6-terra`, with terminal-error handling and the pause-and-probe rules for credit/rate limits.
- The weekly work is added to the existing hourly scheduler entry point (`/api/public/hooks/daily-run`) and the `seo-refresh` job definition — no new cron schedule.
