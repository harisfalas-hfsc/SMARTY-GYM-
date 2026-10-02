# Create Your Own Workout: rename and a second "build it yourself" option

## Answer
1. **Rename** — easy and safe. The page title, menus, bottom bar and the web address change to "Create Your Own Workout" at `/create-your-own-workout`. The old addresses (`/create-your-workout` and `/coach`) send people to the new one, so old links and bookmarks still work.
2. **Build it yourself from the Exercise Library** — doable and safe, but it's a medium-sized job, not a small one. The workout is saved as a normal workout in the member's Logbook, so it works like all their other workouts: favorite, share, like, log sets and results, and it counts in Progress. Premium only, checked by the server and not just hidden on screen.

## What members will see
- On Create Your Own Workout there are two choices: **Smarty Coach** (the questionnaire, same as now) or **Build It Yourself**.
- Build It Yourself has four sections: Activation, Main Workout, Finisher and Cool Down. Members can add as many library exercises as they want to each section, reorder them, remove them and set reps or time. Soft Tissue stays as it is now.
- They name the workout, press Create, and it shows up in their Logbook with no picture, the same as their other workouts.
- Every exercise in the Exercise Library gets an **Add to workout** button. Members pick the section, and the exercise goes into their draft. A small "Go to my workout" link opens Build It Yourself with the draft. The draft is kept until they create the workout.
- Visitors and expired members see the usual members-only screen.

## Important rule question (default chosen)
Your Smarty rules (warm-up only mobility/stability/stretching, flow rules and so on) are **not** applied to workouts members build themselves. It's their own choice, the same way it's their own library. These workouts are marked as member-built and never become Smarty Workouts. The 530 Smarty Workouts and the coach rules stay exactly as they are.

## Technical details
- Rename the route file to `create-your-own-workout.tsx` under `_authenticated`. `/create-your-workout` and `/coach` redirect to it. Update links in BottomNav, the menus and the homepage, plus the sitemap, head() and the AGENTS.md route rule.
- New server function `createManualWorkout` with requireSupabaseAuth and requireActiveMembership. It checks that every exercise ID exists in the active library, builds the `{{exercise:ID:Name}}` markup in the same section HTML format the player already reads, and inserts into `workouts` with category "CUSTOM" or a manual flag. It doesn't touch the generation engine.
- The draft is kept in localStorage, keyed per user. The "Add to workout" button sits next to the existing like/dislike buttons in the library and the exercise dialog.
- Tests for the server function: membership refusal, unknown exercise refusal, and that the result opens in the player. Then type check and build, and a live check with the admin session.
