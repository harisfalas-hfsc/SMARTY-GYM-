# Compete with Darebee, ACE Fitness, Fitness Blender and Garage Gym Reviews — background only

Hard rule: nothing you already see changes. No new menu items, buttons, footer links, wording, colours or layout on any existing page. All work happens in what search engines read (hidden page information, sitemaps, crawler files), in new search pages that are not added to your menus, and in the weekly SEO job.

Honest limit: this gives Google and AI engines everything they need, but it cannot guarantee top positions for huge terms like "online gym". Those also need outside links, press and reviews, which stay with you.

## What the competitors win with, and what we copy

1. **Exercise pages (ACE Fitness model)** — one strong page per exercise: how to do it, muscles worked, equipment, common mistakes, easier/harder versions.
2. **Workout-type pages (Darebee / Fitness Blender model)** — pages for the exact searches people type: "push pull legs workout", "dumbbell full body workout", "no equipment home workout", "beginner strength workout", "HIIT workout at home", "core workout", and so on.
3. **Free tools (Garage Gym Reviews model)** — calculator and timer pages that explain themselves and are marked as tools for Google.
4. **Topic clusters** — every page links to related pages so Google sees one deep authority site on training.

## What will be built

### 1. Exercise pages become full guides (hidden information only)
For every exercise in the library: stronger search title and description ("How to do X: muscles worked, form and mistakes"), full step-by-step guide data, muscles, equipment, difficulty, related exercises and the related Smarty Workouts category — all in the hidden page information and in the text crawlers read. The exercise window you see stays exactly as it is.

### 2. Workout-type search pages (new addresses, not in your menus)
About 25 new pages, each matching one real search (chosen with Semrush data: push pull legs, upper/lower split, dumbbell, kettlebell, bodyweight, home, beginner, fat burning, HIIT, Tabata, AMRAP, EMOM, core, glutes, arms, chest, back, legs, mobility, stretching, Pilates at home, and more). Each page uses your existing page design and lists your real published Smarty Workouts of that type (picture and card details only — never Premium prescriptions), with a short guide built from your existing method wording. They appear in the sitemap and in related links on blog articles only, not in your header, footer or menus.

### 3. Category pages and blog articles target real searches
Retune hidden titles and descriptions of the 9 Smarty Workouts categories and the blog toward the competitor keywords with real volume. Blog articles automatically gain related-exercise and related-workout links in the hidden link list crawlers follow (no visible change to the article).

### 4. Tool pages
1RM calculator, workout timer and rounds tracker get tool markup, stronger titles and question-and-answer data, so they can compete with Garage Gym Reviews-style calculators.

### 5. Sitemaps, AI files and instant notification
New pages added to the sitemaps with correct dates, added to the AI summary files (llms.txt / llms-full.txt), and sent to Bing/ChatGPT search through IndexNow as soon as they go live.

### 6. Weekly SEO job
The Sunday job also checks the new pages, adds newly published workouts to the matching workout-type pages, and reports in the weekly email which competitor keywords you started to appear for.

## Verification before I report back
- Full test suite, typecheck and build.
- Every new and changed address fetched: unique title, description, canonical, valid hidden data, in the sitemap.
- Locked workouts checked: no Premium prescription leaks on any new page.
- Before/after screenshots of home, a category page, an exercise, a blog article and the tools to prove nothing visible changed.
- Goes live on smartygym.com after you publish; ranking changes take weeks.

## Technical details
- Keyword selection: Semrush keyword_compare / serp_analysis on the competitor terms (US + UK databases).
- Exercise head/JSON-LD: extend `src/routes/exercise-library.$slug.tsx` (HowTo, ExercisePlan-related, BreadcrumbList, related links in sr-only nav) and `exercise-public.server.ts` for related exercises.
- New route `src/routes/workouts.$intent.tsx` driven by a typed `src/lib/seo/workout-intents.ts` definition; data from `smarty-workout-public.server.ts` (public card fields only), not linked from Navigation/SiteFooter.
- Intent pages added to `route-inventory.ts`, sitemap routes, `llms-static.ts`, IndexNow submission and `seo-health.server.ts` checks; tests for intent definitions (unique titles, no prescription fields).
- Tool pages: SoftwareApplication/WebApplication JSON-LD in `tools.*.tsx` head().
- Category/blog metadata via `page-seo.ts` and `keyword-clusters.ts`.
