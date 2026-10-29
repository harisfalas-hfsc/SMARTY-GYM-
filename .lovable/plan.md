# Bigger, more convincing Smarty Diet announcement

Only the Smarty Diet side panel changes. Timing (20 seconds), position, closing and reopening stay the same.

## What changes
- **Same width (280px), about double the height.**
- **Bigger logo**, centered at the top (about twice its current size).
- **"Smarty Diet" highlighted**: large bold title in the brand blue.
- **Tagline directly below:** "Create your diet plan, eat better, live longer."
- **"How it works": 4 short numbered steps with icons**, one line each. I'll check the Smarty Diet project and use its real flow. Expected steps:
  1. Answer a short questionnaire (goals, body, activity)
  2. Choose your food preferences
  3. Get your personal diet plan
  4. Follow it and track your progress
- **A clear button at the bottom:** "Create my diet plan" that opens smartydiet.com in a new tab.
- The small "Smarty Family" label stays at the top.

## Technical details
- Edit `src/components/growth/SisterAppsPopup.tsx` only. Use theme colors and lucide icons, and keep it scrollable if the screen is short (mobile 658px).
- Read the Smarty Diet project's onboarding to get the step wording right. That's the only thing I take from it.
- Check the result with screenshots on mobile and desktop, and run the tests and build.
