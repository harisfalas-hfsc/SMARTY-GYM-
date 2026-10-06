# Fitness-search SEO boost (background only, no visual changes)

Nothing on screen changes. Only invisible search data (page titles in the browser tab/Google, descriptions, sitemaps) is updated.

## 1. Search-first titles and descriptions
Rewrite titles (max 60 characters) and descriptions (140-158 characters) for every public page so they lead with what people actually search for, then the brand. Examples:
- Home: "Online Gym & Personalized Workout Plans | SmartyGym"
- Smarty Workouts: "Free-Weight, Bodyweight & Gym Workouts by Category | SmartyGym"
- Each category page (Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Pilates, Mobility & Stability, Recovery): "<Category> Workouts at Home or Gym | SmartyGym"
- Workout of the Day: "Workout of the Day — Daily Home & Gym WOD | SmartyGym"
- Exercise Library: "Exercise Library — 1,300+ Animated Exercise Demos"
- Create Your Own Workout, Shared Workouts, Training guides, Blog, Tools, Glossary, Training Load science, Smarty Method, Haris Falas: same pattern.
- Individual workout pages: "<Workout name> — <duration> min <category> Workout" with a description built from category, equipment, difficulty and duration (card facts only, no exercises revealed).
- Titles and descriptions must be unique across all ~608 pages; the existing duplicate check enforces it.
- Facts only: no invented claims, no keyword stuffing.

## 2. Fitness-focused sitemap
- Add a dedicated `/workouts-sitemap.xml` listing the Smarty Workout category pages and all public workout pages with real last-changed dates.
- Turn `/sitemap.xml` into a sitemap index pointing to: core pages, workouts sitemap, blog sitemap, image sitemap. Same addresses as today, just better organised.
- Raise priority for fitness intent pages (categories, WOD, Exercise Library, training guides) and remove any priority/lastmod values that are guessed.
- Add the new sitemap lines to robots.txt and submit them to Google Search Console, then read back their status.

## 3. Verify
- SEO tests (unique titles/descriptions, length limits, no private addresses), typecheck, build.
- Fetch every sitemap locally and validate the XML and address counts (must still be ~608, zero private).
- Screenshot check that pages look identical.
- Note: changes reach smartygym.com only after you publish; ranking moves over weeks, not instantly.

## Technical details
- Titles/descriptions live in `src/lib/seo/page-seo.ts` and each route's `head()`; category and workout titles come from `smarty-workout-public.server.ts` (`smartyWorkoutSearchData`).
- New server route `src/routes/workouts-sitemap[.]xml.ts`; `sitemap[.]xml.ts` becomes `<sitemapindex>` with a `core-sitemap.xml` for static entries from `route-inventory.ts`.
- GSC submission via the linked Search Console connection after publish.
