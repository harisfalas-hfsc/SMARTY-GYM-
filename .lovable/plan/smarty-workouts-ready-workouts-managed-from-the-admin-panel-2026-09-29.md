# Smarty Workouts: ready workouts managed from the admin panel

## What you will get

1. **New page: Smarty Workouts** (`/smarty-workouts`)
   - In the discovery menu, directly below Create Your Workout (desktop and mobile, visitors and members).
   - Same style, design and layout as the other pages (desktop banner, mobile header).
   - Eight category sections in this order: Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability, Pilates.
   - Each section shows workout cards (picture, name, duration, difficulty, equipment). Until you publish workouts, each section shows a short "Coming soon" note.
   - Opening a card shows the same workout page and player members already use. Access follows the current Premium rules and your Free mode switch: visitors and non-premium users can browse the cards, and Premium is needed to open a workout.
   - Only workouts you mark as visible appear on the page.

2. **Admin → Workouts: new "Smarty Workouts" section with a "Create New Workout" button**
   - **Create:** opens the same wizard members use (category, format, environment/equipment, duration, difficulty, focus). It runs the same workout engine, so the same rules apply and every exercise comes only from the exercise library.
   - **Review and edit before publishing** (brought over from the old project's workout editor):
     - Edit the name, description, category, format, duration, difficulty, equipment and every workout section.
     - Exercise search inside the editor: type a name and choose from your exercise library. The exercise's GIF, instructions and tips are attached automatically. You can also type free text (notes, rest, rounds).
     - Picture: "Generate picture" creates an AI cover image that matches the workout's title, category and format. You can regenerate it or upload your own.
   - **Manage list:** every Smarty Workout in a list with filters by category and visibility, with actions to View, Edit, Hide/Show (visible toggle) and Delete (with confirmation).
   - New workouts start **hidden**, so nothing goes live until you switch them on.

3. The existing member workout archive in Admin → Workouts stays as it is.

## Technical details

- Database: new `smarty_workouts` table (id, name, category, format, difficulty, duration_min, equipment[], location, focus, description, html content with `{{exercise:ID:Name}}` tokens, image_url, is_visible, sort_order, created_by, timestamps). GRANTs plus RLS: public SELECT only where `is_visible = true`; admins (`has_role`) have full access. Public storage bucket `smarty-workout-images` for covers.
- Server functions in `src/lib/smarty-workouts.functions.ts`: public list/get (publishable client, visible only); admin create/update/toggle/delete/generate-image (requireSupabaseAuth plus admin role check). Generation reuses `generateWorkoutContent` with the admin's wizard choices, without linking the workout to any member's logbook.
- Image: Lovable AI image model with a prompt built from title, category, format and equipment; saved to the bucket, URL stored on the row.
- Editor: port the old `WorkoutEditDialog` section editing and `ExerciseSearchPanel` (library search inserts exercise tokens); rendering reuses `ExerciseHTMLContent` / `WorkoutDisplay`, so GIFs and instructions appear as they do elsewhere.
- Wizard: extract the option steps from `create-your-workout.tsx` into a shared component used by both the member page and the admin dialog, with no visible change to the member page.
- Routes: `src/routes/smarty-workouts.tsx` (public, with its own head metadata) and `src/routes/smarty-workouts.$id.tsx` (detail/player, Premium gate). Add both to the sitemap and the navigation entry.
- Verification: typecheck, tests, build. In the browser as admin: create a workout, edit an exercise, generate a picture, make it visible, and confirm it appears in the right category on the page.
