# Sitemap submission, public workout preview, weekly SEO report

## 1. Submit sitemaps to Google Search Console
- List the verified Search Console properties and pick the one that covers smartygym.com. If more than one matches, ask you which to use.
- Submit `https://smartygym.com/sitemap.xml` and `https://smartygym.com/image-sitemap.xml`, then read back their status (last read, errors, warnings).
- Use URL Inspection on a few key pages (home, Smarty Workouts, Exercise Library, one workout) and report Google's real answer.
- Note: the new workout pages are only live after you publish. I will ask you to publish first so Google reads the current sitemap (606 addresses).

## 2. Public workout preview for visitors
- Signed-out visitors on `/smarty-workouts/<workout>` currently see only a small "Log in" notice.
- Instead they will see the same page layout members see: cover picture, name, category, format, duration, difficulty, equipment and the section headings (Activation, Main Workout, Finisher, Cool Down).
- The exercises inside each section stay locked, with one "Log in / Join SmartyGym" button that returns them to this workout after sign-in.
- Exercise content is never sent to the visitor's browser. The server keeps blocking it, so Premium stays protected.
- Signed-in members keep today's behaviour unchanged.

## 3. Weekly SEO update with everything built so far
Add these checks to the existing Sunday SEO job and its admin report email:
- Sitemap health: loads OK, address count, duplicates, private addresses (must be 0), invalid links.
- Duplicate metadata: repeated titles/descriptions across public pages, blog articles and the 530 workout pages.
- Structured data: broken or missing markup on key pages and workout/article pages.
- Google status: sitemap status and a small URL Inspection sample from Search Console (indexed / not indexed).
- Competitor gap opportunities: compare our keyword index with search themes (workout builder, home/no-equipment workouts, mobility, workout tracking, etc.) and list topics with no matching public page. This is a list of suggestions only; no pages are created automatically.
- Then run the job once by hand and send you the admin report.

## Technical details
- Search Console calls go through the existing linked Google connection, from server code. The property is re-checked on every run.
- The preview reuses the public card data from `smarty-workout-public` plus section names only. No new public data path to exercises.
- New checks live in the `seo-refresh` job (`src/lib/cron/seo-refresh.server.ts`) and its `cron-report` email template. The report is saved to `cron_runs` details for the admin Cron tab.
- Verification: tests, type check, build, sitemap validation, a signed-out preview screenshot, and a check that no exercise names reach signed-out visitors.
