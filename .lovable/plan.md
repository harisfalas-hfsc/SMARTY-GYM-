# Bring the old SmartyGym search and AI-crawler setup into this project

I opened SMARTY GYM (OLD) and compared it with this project. This project already has the basics: sitemap, robots file, AI summary files, page titles and descriptions, structured data and instant search notifications. The old project has more on top of that. This plan copies everything that still applies to this site.

## What gets copied across

1. **Google verification file.** `googlecfa6265b34478b8a.html` is copied byte for byte, so your existing Google Search Console property stays verified on this site. This project doesn't have it yet.
2. **`/ai.txt`.** The old file with structured facts for AI systems is copied word for word. Only facts that are no longer true get changed, such as nutrition plans, the shop or old prices. Every changed line is listed in my report.
3. **`/llms.txt` and `/llms-full.txt`.** The old texts are about 45 KB and 600 KB; the current ones are about 10 KB. All wording from the old files is merged in, including sections, name spellings, FAQs, the Haris Falas profile and brand facts. Anything describing features that no longer exist is taken out. Current blog articles and pages keep updating automatically.
4. **`robots.txt`.** Every crawler and permission rule from the old file is copied, including the allows for `/ai.txt`, `/llms.txt` and `/llms-full.txt`. Paths that no longer exist become redirects instead of allow lines.
5. **Image sitemap.** A separate `/image-sitemap.xml` is added, like the old site's (320 images), using this site's real images: article covers, exercise images and page images. It is listed in `robots.txt`.
6. **Page wording in search results.** The old titles, descriptions, keywords and structured data are copied into the matching pages here: home, about, coach profile/Haris Falas, FAQ, glossary, blog, articles, exercise library, tools, WOD, contact, privacy, terms and disclaimer. This includes the misspelling notes ("SmartGym", "Smart Gym") and the Organization, Person, FAQ and Breadcrumb data.
7. **Search engine pinging.** The old "ping search engines on change" behaviour is merged into this site's existing IndexNow sending, and the old IndexNow key is carried over.

## What cannot be copied as-is, and what happens instead

The old sitemap lists 729 addresses. About 600 of them point to pages this site no longer has: 548 individual workouts, training programs, calorie/BMR/macro calculators, shop, premium, corporate and the "vs Peloton/Freeletics" pages. Copying their search setup would mean building those pages again, which you haven't asked for. Instead, every one of those addresses gets a permanent redirect to the closest page here, so the ranking Google already has carries over instead of ending in a dead page. Old `.html` addresses get redirects too.

## After it's in place

- Fetch `/sitemap.xml`, `/image-sitemap.xml`, `/robots.txt`, `/ai.txt`, `/llms.txt`, `/llms-full.txt` and the Google file on the running site and check each one.
- Check the page source of several pages for title, description, canonical and structured data. Test a sample of old addresses to confirm they redirect.
- Run the tests and the build.
- Publish (with your approval). Then resubmit `sitemap.xml` and `image-sitemap.xml` to Google Search Console, and send all addresses through IndexNow. Resubmitting needs Google Search Console connected to this project; if it isn't, I'll open the connect card.

## Hard rule

Nothing visible changes. No design, layout, wording, menus or new pages. All work is in page source tags, crawler files, sitemaps and hidden redirects.

## Technical notes

- New: `public/googlecfa6265b34478b8a.html`, `public/ai.txt` (or `src/routes/ai[.]txt.ts`), `src/routes/image-sitemap[.]xml.ts`.
- Edited: `src/lib/seo/llms-base.ts`, `llms-static.ts`, `public/robots.txt`, `src/lib/seo/page-seo.ts`, `head.ts`, `legacy-redirects.ts`, `indexnow.server.ts`.
- Source files in old project: `public/*.txt`, `public/*sitemap.xml`, `src/utils/seoSchemas.ts`, `seoHelpers.ts`, `scripts/lib/seo-routes.ts`, `supabase/functions/process-indexnow-queue`, `refresh-sitemap-ping`.
- The old project used a prerender script because it was a client-only app. This site already renders its pages on the server, so that script isn't needed.
