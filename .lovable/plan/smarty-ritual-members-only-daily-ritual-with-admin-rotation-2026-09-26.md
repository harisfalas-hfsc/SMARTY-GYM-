# Smarty Ritual — members-only daily ritual with admin rotation

## Important: getting your existing rituals across
The old project's code is readable, but the ritual texts themselves (about 180, per the old code) are stored only in the old project's database. I can't read that database from here: its public read returns 0 rituals, and the old admin panel has no download button.

To copy them over exactly, open the old SMARTY GYM (OLD) project and ask it: "Export every row of daily_smarty_rituals (day_number, morning_content, midday_content, evening_content) as a JSON file." Then upload that file here. I load every ritual in its original order, with the text unchanged. Until then, the page and the admin section work, but the list stays empty.

## What you will get

1. **Smarty Ritual page** (`/smarty-ritual`), built to match the old page as closely as possible:
   - Today's date and ritual number, plus three cards: Morning (sunrise), Midday (sun) and Evening (moon), with the same wording and formatting as before.
   - Share button, like the old one.
   - Only premium members can open it. Everyone else sees the old lock card with "Premium members only" and a membership button. When the Payments switch is set to free, every signed-in member can open it, like the rest of the app.
   - Parts that don't exist in this app (reader mode, PDF export, the old breadcrumbs) are left out.
2. **Discovery menu:** Workout of the Day, Shared Workouts, **Smarty Ritual**, then Logbook. This applies to both the desktop and the mobile menu. Nothing else in the menu moves.
3. **Daily rotation:** ritual 1, then 2, 3 and onward, one per day (Cyprus time). After the last ritual it starts again at 1, with no randomness. Adding or removing rituals changes the cycle length automatically.
4. **Admin panel, new "Rituals" section** next to Workouts:
   - A numbered list (1, 2, 3 …) with a short preview of each ritual.
   - Beside each ritual: **Next date** (for example "Today" or "Tue 14 Oct") and **Following date** (one full cycle later, for example 180 days after that).
   - Today's ritual is highlighted.
   - Click a ritual to edit its Morning, Midday and Evening text and save. Changes show on the member page straight away.

## Technical details
- New table `smarty_rituals` (`position` int unique, `morning_content`, `midday_content`, `evening_content`, timestamps). It has GRANTs, and RLS allows only admins to write. Members read through a server function, not directly.
- The ritual for any date is `((daysSince(anchor, date)) mod count) + 1`. The anchor date is stored in `app_settings` (`ritual_anchor_date` = the launch day, so ritual 1 shows first). This math is shared by the page and the admin list, so no nightly job is needed.
- `getTodaysRitual` uses `requireSupabaseAuth` and checks the existing premium/free-access capability on the server. Non-premium members get locked data, never the ritual text.
- The admin functions (`adminListRituals`, `adminUpdateRitual`) check `has_role` admin first.
- Imported HTML is displayed with the existing sanitised HTML renderer. The page is private (noindex), kept out of the sitemap, and added to the route inventory. The import runs as a data insert from your uploaded file.
- After the build: run the typecheck and tests, and do a Playwright check of the page as premium, non-premium and admin, including editing a ritual and confirming the change shows.
