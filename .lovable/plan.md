# Make SMARTYGYM fast and remove the white start-up screen

No offline mode, no new features, no layout or design changes. Only speed.

## Problem 1 — Slow pictures and slow pages

What I measured on the live site:
- One Smarty Workout cover picture is **1.7 MB** and takes **1.6 seconds** to arrive. A category page like Strength shows ~148 of them. That is roughly 250 MB of pictures for one page — the main reason everything feels slow, especially on phones.
- Every picture is sent through the website itself (the website fetches it from storage, then passes it on) instead of coming straight from fast picture storage. This adds delay to every single picture.
- The category page first downloads **all 515 workouts** and then throws away the ones from other categories, and only then starts showing cards.
- Opening a workout waits for several separate requests one after another (account check, membership check, the workout, the exercise details), which is where the ~1.5 second delay comes from.
- The home page itself takes ~1.2 seconds before anything shows.

How I will fix it:
1. **Shrink every cover picture** once: make a small card version (about 60–120 KB, modern WebP format) and a larger version for the workout page. The originals stay stored untouched as a backup. New pictures you generate or upload are shrunk automatically in the same way.
2. **Serve pictures straight from fast storage/CDN** with long browser caching, so a picture seen once opens instantly next time.
3. **Only load what is on screen**: the category page asks only for its own category, the first cards load immediately and the rest load as you scroll.
4. **Faster workout opening**: combine the separate checks into one request, and start loading a workout as soon as your finger touches the card (before the tap finishes).
5. Apply the same picture shrinking to blog covers and the big page pictures.

## Problem 2 — White screen and spinner when the phone app opens

What is happening:
- The phone apps are a shell that loads the live website (smartygym.com). The native start-up screens are already black, so the white flash does not come from your developer's part — he is right.
- The white screen appears in the gap after the app's splash disappears and while the website is still downloading (the ~1.2 s home page plus the heavy pictures). The website's own loading spinner then shows before the first screen is ready.

How I will fix it:
1. Keep the app's black splash with your logo on screen until the first page is actually drawn, then fade it out — so there is no white gap and no spinner.
2. Make the very first page background black from the first byte (not after the page loads), in both light and dark mode, only inside the phone apps.
3. Remove the loading spinner at app start and show the page directly.
4. The speed fixes from Problem 1 make the first page itself arrive much faster.

Your developer only needs to rebuild and resubmit the apps once if I change the native splash timing; I will tell you exactly if that is needed.

## How nothing else breaks

- Pictures: the stored originals are kept; only smaller copies are added. Any workout without a small copy falls back to its original picture, so no card is ever blank.
- No changes to workouts, content, categories, counts, filters, player, logbook, progress, admin buttons or layouts.
- After the changes I will run all tests, the typecheck and a full build, then check on phone and desktop sizes: the Smarty Workouts page, a category page, opening a workout and the player, and I will measure picture sizes and page times again and report the before/after numbers.

## Technical details

- Covers: batch job converts `smarty-workout-images` files to WebP at 640px (cards) and 1280px (detail), stored as `<name>-640.webp` / `-1280.webp`; `image_url` keeps the original, card component uses `srcset` with fallback. `storeSmartyWorkoutImage` also writes the variants on generate/upload.
- `/api/public/workout-cover/$file` currently downloads via admin client per request; switch cards to the public CDN/transform URL (or edge-cache the route) with `immutable` caching.
- `listSmartyWorkouts` gains a `category` filter; category page moves to loader + query cache; images `loading="lazy"`, `decoding="async"`, explicit sizes; first 4 eager.
- Workout detail: single server function for access + workout; router `defaultPreload: "intent"`; review `defaultPendingMs` spinner.
- Native: `SplashScreen` stays until `revealFirstFrame`; root inline style sets `#000` for `native-shell` before CSS; remove spinner at native start.
