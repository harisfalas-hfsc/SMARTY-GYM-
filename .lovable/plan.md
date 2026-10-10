# Smarty Coach — instant daily coaching briefing

## Goal
Turn Smarty Coach into the first, focused personal briefing a member sees on opening SMARTYGYM. It will immediately connect the member’s current readiness, previous training, today’s target and the evidence behind the recommendation—without AI credits and without the general navigation sections.

## What will change

### 1. Coach meets the member at the door
- Open Smarty Coach immediately after the member’s account is identified, before other automatic announcements.
- Remove the current seven-second delay and keep manual reopening from the header button.
- Give Coach priority over check-in and other automatic windows; those may appear only after Coach closes, never on top of it.
- Keep the snapshot strictly keyed to the signed-in account so switching accounts can never show another member’s name or recommendation.
- Cache the latest completed snapshot per member for instant repeat openings, then refresh it quietly from current data. Never replace it with an older placeholder or flash a different Coach layout.
- On a member’s first uncached visit, show one branded Coach opening state while the personal result is prepared; never show invented or another member’s data.

### 2. Replace the current menu-style announcement with one coaching briefing
Remove **Train your way** and **Learn and explore** from the Coach window. The first view will contain only:

1. **Personal greeting** — time-aware and named, for example “Good morning, Haris.”
2. **Readiness** — the actual available readiness result. Show the numeric Smarty Check-in readiness score when one exists; otherwise clearly say that readiness is based on training history or that data is limited.
3. **Your last session** — workout, date and only facts actually logged.
4. **Today’s focus** — the recommended training purpose, body focus, intensity and exact Smarty Workout or planned session when one genuinely fits.
5. **Why** — a short explanation showing the strongest reasons that produced the recommendation.
6. **One action** — open the recommended workout, planned session, check-in, recovery choice or relevant Logbook view.

The information stays compact in one scrollable announcement rather than requiring the member to open a second internal screen.

### 3. Strengthen the deterministic coaching decision
Preserve the existing zero-AI rule engine and its safety priority. Make the displayed briefing explicitly reflect this order:

1. **Recovery and safety:** today’s check-in, up to three previous completed check-ins, soreness, sleep, readiness, recent strain, Training Load, consecutive/hard training days and PAR-Q/recorded limitations.
2. **Past session and progression:** previous workout category/body focus, difficulty, logged RPE, performance, comparable attempt, personal record and post-workout feedback when recorded.
3. **Today’s target:** a compatible scheduled workout first; otherwise deterministic strength/conditioning/recovery rotation, profile goal, level, equipment, typical duration and recent repetition avoidance.
4. **Workout choice:** select only a visible, equipment-compatible Smarty Workout that satisfies the chosen purpose and intensity. If none fits, use the existing validated custom/rest fallback.

Missing information remains unknown—never treated as zero, good readiness, a missed workout or a reason to invent progress. Recovery and safety always override progression or schedule.

### 4. Make the result clear and internally consistent
- Add a stable visible readiness label and, where available, the member’s real check-in score.
- Make “today’s focus” come directly from the same final decision that chooses the action and workout, preventing a headline that contradicts the recommendation.
- Explain the selected workout by category, body focus, difficulty, duration, equipment compatibility and the highest-priority reason it won.
- Keep Insights connected as supporting weekly evidence, but do not add a separate large Insights card inside Coach.
- Keep expired-member history protected and show only the existing renewal guidance; visitors receive a concise non-personal introduction without protected data.

## Technical details
- Extend the shared `CoachSnapshot` with a presentation-ready greeting, readiness display, last-session summary, today-focus summary and ranked evidence list.
- Continue loading private data only through the authenticated Coach server function and deciding through the pure deterministic engine.
- Add strictly user-scoped client caching with freshness/version checks and clear it on sign-out/account change.
- Coordinate automatic dialogs through one priority signal so Coach opens first and check-ins wait until it closes.
- Remove the unused option-row/navigation presentation from the Coach dialog; do not remove those destinations from the website menus.

## Verification
- Deterministic tests for: strong readiness, poor current check-in, poor multi-day trend, high/very-high load, strength-to-opposite-body rotation, conditioning-to-strength, recovery after hard training, scheduled-session conflict, restart after inactivity, progression/personal record, missing check-in, missing history and no matching workout.
- Account-switch test proving names, snapshots and cached recommendations never cross between members.
- Timing test proving Coach is the first automatic window and check-ins wait until it closes.
- Consistency tests proving greeting, readiness, today’s focus, explanation, selected workout and action all come from the same final verdict.
- Inspect active member, new member, expired member and visitor states on phone and desktop, including long workout names and the first uncached opening.
- Run the complete affected test suite and confirm the preview build is clean.

## Scope boundary
This improves the Smarty Coach briefing and the deterministic evidence it presents. It does not add chat, generative AI, new workout doctrine, automatic workout creation, new navigation links or unrelated design changes.
