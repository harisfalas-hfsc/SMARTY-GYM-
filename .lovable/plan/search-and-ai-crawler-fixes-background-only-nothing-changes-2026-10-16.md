# Search and AI-crawler fixes (background only, nothing changes on screen)

Hard rule: nothing visible changes. No new links, menus, text, tables or layout on any page. All work is in the hidden page information crawlers read, in background files, and in the existing Sunday SEO job. Off-site work (guest articles, podcasts, profiles on other sites, real backlinks) stays with you.

## What stays exactly as it is
Current sitemaps and their Google status, canonical links, existing titles that already work, the Sunday SEO job's article/workout optimisation, IndexNow, and every page's look.

## 1. Point AI crawlers to the site summaries
- robots.txt: add named sections allowing GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Bingbot (Copilot), xAI/Grok and Meta crawlers on public pages, with the same private-area blocks as today. Add comment lines pointing to /llms.txt, /llms-full.txt and /ai.txt. Existing rules and sitemap lines kept.
- Hidden page header: add invisible links on every page telling machines where /llms.txt and /llms-full.txt are.
- /llms.txt: add a short "what SmartyGym is / is not" section (online platform, not a physical or 24-hour gym) and direct links to the method, training-load science, founder and category pages.

## 2. Hidden question-and-answer data for AI answers
- Add invisible FAQ data (built only from wording already on each page, nothing new on screen) to The Smarty Method, Training Load Science and each Smarty Workouts category page.
- Blog articles: the optimizer already stores FAQ pairs per article; publish them as hidden FAQ data on each article page next to the existing Article data. The Sunday job keeps filling them for new articles.

## 3. Hidden comparison data instead of visible tables
AI engines quote structured facts. Add an invisible "how SmartyGym works" fact list (rule-based workouts from a closed exercise library, sets/reps/rest, levels, founder credentials) to the method page data and /llms-full.txt. No table appears on screen.

## 4. Stop attracting the wrong searches
Add hidden wording ("online", "at home or in the gym", "no physical location") to the home page description and site data so Google stops matching "24h gym near me". Titles shown on screen are untouched.

## 5. Target the searches that can convert
Retune hidden titles/descriptions (only where weak, all unique) toward "online workout coach", "home & gym workout plans", "sports science workout programs", and comparison terms like "AMRAP vs EMOM vs Tabata". Keep the high-performing AMRAP article's title as is.

## 6. Stronger founder and brand identity for AI
Expand the hidden Organization and Haris Falas person data with consistent name spelling, credentials already on the site, and links to your real existing profiles (only the ones already listed on the site — I will not invent any).

## 7. Sunday SEO job additions
- Include the new FAQ data and llms files in the weekly health check, flagging any page missing them.
- Report non-converting search terms (like "near me") from Search Console in the weekly email so you can see if the wrong-search problem shrinks.
- Submit changed pages to IndexNow (Bing/Copilot/ChatGPT search) after this release.

## 8. Not touched
Spam backlinks: Google ignores them; disavowing is optional and done by you in Search Console. Real authority links are off-site work.

## Verify
- SEO tests, new tests for robots and FAQ data, typecheck, build.
- Fetch every changed page and file: valid hidden data, unique titles, robots rules correct, private areas still blocked.
- Before/after screenshots of home, method, training-load science, a category page and a blog article prove nothing changed visually.
- Changes reach smartygym.com only after you publish; ranking moves over weeks.

## Technical details
- Edit `public/robots.txt`, `src/routes/__root.tsx` (head `links` alternates only), `src/lib/seo/llms-static.ts`, `src/routes/llms-full[.]txt.ts`, `src/lib/seo/page-seo.ts`, `src/lib/seo/entity-graph.ts`.
- FAQ JSON-LD via `scripts` in `head()` of `the-smarty-method.tsx`, `training-load-science.tsx`, `smarty-workouts.category.$category.tsx`, `blog.$slug.tsx` (from stored optimizer FAQ pairs; omit when empty).
- `seo-health.server.ts`: new checks; `seo-refresh.server.ts`: add mismatch-query lines to report only.
