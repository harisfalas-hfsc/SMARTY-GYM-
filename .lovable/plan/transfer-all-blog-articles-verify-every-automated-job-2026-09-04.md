# Transfer all blog articles + verify every automated job

## What I confirmed first

- The live smartygym.com blog has **80 articles**, all publicly readable, each with a cover image stored in a public image folder of the old project.
- This project's blog table is **empty (0 articles)** and it has **no blog image folder** yet.
- All **7 automated jobs are switched on** in this project (motivation 07:00, workout-of-the-day 07:00, reminders, SEO update 00:00, health check 00:00, problem alerts, weekly blog article Sunday 00:00) and the hourly scheduler is live in this project's database, pointing at this project's own published address.
- The nightly health report, problem alerts and the SEO report currently default to **harisfalas@gmail.com**, not smartygym@outlook.com.

## 1. Move the Fitness articles into this project

- Only articles in the **Fitness** category are transferred. Every other category on the old blog is left out.
- Build a one-off importer (admin-run, same pattern as the exercise-library import) that, for each Fitness article on the live site: reads the title, slug, summary, category, author, read time, publish date and the full article body.
- Download each article's cover image and re-upload it into this project's own new blog image folder, then point the article at this project's permanent cover address, so covers keep working forever and never expire.
- Rewrite any image used **inside** an article body the same way, so no article body points back at the old project.
- Article bodies are cleaned on the way in (links kept, nothing executable).

## 2. Guarantee no article is missing an image

- After the import, run a verification pass over **every** imported article: it must have a cover image, that image must download successfully, and no image address may still point to the old project.
- Any article failing this is retried; if a cover truly cannot be recovered, a fresh cover is generated for it so it goes in with a picture.
- I report the final numbers: Fitness articles found, imported, covers verified, inline images rewritten — every imported article with an image, no exceptions.
- Also confirm the article list page, each article page, the sitemap and the social preview all show the images.

## 2b. Blog page filters and read/unread

- Verify **Newest first / Oldest first** sorting actually reorders the articles by publish date, and that the choice survives a page reload (it lives in the page address).
- Verify **All / Unread only / Read only** filters return the right articles, with correct counts.
- Verify the "Mark as read" / "Mark as unread" button toggles the article, shows the Read badge, is remembered on the device after reload, and stays in step with the filter (marking an article read while "Unread only" is selected removes it from the list immediately).
- Verify Reset clears both filters, and that all of this works on mobile width too.


## 3. Weekly blog article job

- Run the weekly job once, on demand, end to end: it must write a brand-new article, create its cover, publish it, notify members and email the admin report.
- Confirm the "no duplicate title in 90 days" and "one article per week" rules see the imported Fitness articles (so it never rewrites an existing topic).
- Confirm the rule that nothing publishes without a cover image still holds.
- Confirm its scheduled slot (Sunday, the hour set in the admin panel) is what the scheduler will actually fire.

## 4. Correct email address for admin reports

- Nightly system health check → **smartygym@outlook.com**
- Instant problem alerts → **smartygym@outlook.com**
- SEO update report and weekly-article report → **smartygym@outlook.com**
- These become the built-in defaults, and the admin panel field still lets you override them.

## 5. Check every other automated job actually runs

For each job: run it once on demand, read what it did, and fix whatever fails.

- **Nightly health check** — all checks execute, report emailed to the correct address, pass/fail detail correct.
- **Automatic SEO update** — rebuilds the keyword index from all public pages, training topics, the exercise library and generated workouts; skips cleanly when nothing changed; emails its report.
- **Scheduled workout reminders** — 30-minutes-before, at-the-time and next-day-missed reminders fire once each and are never duplicated; checked against workouts scheduled in the Logbook.
- **Workout of the Day auto-delivery** — delivers to members who have it switched on, at their own local hour, only when their training profile is complete, and the delivered session respects the training calendar and load rules.
- **Daily motivation message** — one message per member per day, at their own hour, streak variant included.
- **Instant problem alerts** — a recorded problem produces one email immediately, repeats counted not re-sent.
- **Scheduling / progress / training load** — verify the Logbook scheduling, the progress figures and the training-load and periodisation calculations behave on real data, since the reminders and workout-of-the-day jobs depend on them.

## 6. Final verification

- Typecheck and build clean.
- The admin Cron section shows a successful run entry for every job I ran.
- A short written summary of every job: what it does, when it fires, where it emails, and the result of its test run.

## Technical notes

- Import runs server-side through an admin-only action; images land in a new private `blog-images` bucket served through the existing permanent `/api/public/blog-cover/<file>` route.
- Cover addresses are stored as `https://smartygym.com/api/public/blog-cover/<file>`; the article page already strips the domain when rendering, so images also display correctly in preview before publishing.
- Import is idempotent: matching on slug, re-running never creates duplicates.
- Report recipients: change the defaults in the health-check, error-report, SEO and blog-generator modules; per-job overrides in `cron_jobs.content.recipient` still win.
- Jobs are triggered for testing through the existing on-demand admin run path, not by changing the hourly scheduler.
