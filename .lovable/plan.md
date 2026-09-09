# Desktop workout player frame refinement

## Goal
Make the desktop workout-player dialog border/frame clearly visible and on-brand, so it no longer blends into the dark page behind it. Mobile view stays unchanged.

## Selected direction
**Neon Frame Elevation** — a strong light-blue branded border, soft outer glow, and subtle corner-bracket accents on desktop only.

## What will change
- `src/components/workout/WorkoutPlayerDialog.tsx`
  - The `DialogContent` wrapper will gain a visible branded frame starting at the `sm:` breakpoint.
  - Add a 2px primary-brand border (`border-primary` / `border-sky-500/40` equivalent), a soft primary glow shadow, and rounded-2xl/rounded-3xl corners on desktop.
  - Add four small corner-bracket accent marks (top-left, top-right, bottom-left, bottom-right) using absolute positioned `div`s with primary-brand borders, visible only on desktop.
  - Keep the existing mobile full-screen behaviour (`h-[100dvh]`, `border-0`, no rounded corners, no glow).
  - No changes to dialog content, carousel, controls, buttons, typography, or functionality.

## What will not change
- Mobile layout, styling, or behaviour.
- Any other component, page, header, footer, or navigation.
- The workout logic, timers, logging, or server functions.

## Verification
- Open a workout on desktop and start the player.
- Confirm the player dialog shows a clear branded frame with visible corners and glow.
- Confirm mobile player still opens full-screen without the frame treatment.
- Run `bunx tsgo --noEmit` and the relevant player-layout test if it exists.