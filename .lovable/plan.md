# Fitness-search SEO upgrade (background only, no visual changes)

This upgrades your current SEO setup. Nothing is rebuilt or replaced, and nothing on screen changes. Only the hidden search details are improved: page titles shown in Google, page descriptions, and sitemap details.

## What stays exactly as it is
- Current sitemaps (`/sitemap.xml`, `/image-sitemap.xml`), their addresses, and their Google Search Console status.
- robots.txt, canonical links, structured data, AI-crawler files, and IndexNow.
- The Sunday SEO job and everything it does: blog article optimisation, shared-workout titles and descriptions, health checks, and the admin report. Wording it already wrote or chose by hand stays in place.

## 1. Clearer titles and descriptions
- Rewrite fixed-page titles (max 60 characters) and descriptions (140-158 characters) so they start with what people search for, then the brand. Examples: "Online Gym & Personalized Workout Plans | SmartyGym" and "Workout of the Day: Daily Home & Gym WOD".
- Category pages get "<Category> Workouts at Home or Gym" style titles.
- Individual Smarty Workout pages take a small upgrade to the template that builds them: name, length in minutes, and category in the title. The description uses only card facts and never shows exercises.
- Only change a title where it's clearly weak. Strong existing ones stay. Every title and description must stay unique (the existing duplicate check enforces this).

## 2. Fitness-focused sitemap upgrade (same file, same address)
- Inside the existing `/sitemap.xml`, add the missing workout category pages, if any, and give fitness pages (categories, WOD, Exercise Library, training guides) a higher priority.
- Use real "last changed" dates for workout pages where they're available.
- No new sitemap files, no restructuring, and no change to robots.txt.

## 3. Verify
- SEO tests, typecheck, and build.
- The weekly SEO job's own test runs pass unchanged.
- Validate the sitemap: same or higher page count (608 today), zero private addresses.
- Screenshots show every page unchanged.
- These changes reach smartygym.com only after you publish. Ranking improves over weeks, not right away.

## Technical details
- Edits are limited to values in `src/lib/seo/page-seo.ts`, existing route `head()` values, `smartyWorkoutSearchData` in `smarty-workout-public.server.ts`, and priorities in `route-inventory.ts` / `sitemap[.]xml.ts`.
- Don't touch `seo-refresh.server.ts`, `workout-seo.server.ts`, the article optimizer, `workout_seo`/`blog_articles` SEO columns, or IndexNow. Optimizer-stored values keep priority over registry defaults.
