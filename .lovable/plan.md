# Match the submitted phone apps to the working mobile view

## Confirmed differences
- The submitted app project uses the package identity `com.smartygym.app`; the current native folders use `com.smartyworkout.app`, so they cannot replace the existing store apps as an update.
- The old working mobile header starts at `top: 0` and does not add top safe-area padding. The current header adds `env(safe-area-inset-top)` unless wrapper detection overrides it, which can create the empty strip.
- The old project paints a dark startup screen immediately. The current live wrapper depends on delayed phone detection and manual splash dismissal, leaving a path where the phone's white WebView appears first.

## Changes
1. Restore the submitted app identity across the shared phone configuration, Android package, and iOS bundle so future builds update the existing apps instead of creating different apps.
2. Match the old proven top-edge behavior: keep the header at the physical top with no added top safe-area spacing, while leaving the header’s design, height, content, and the rest of the site unchanged.
3. Remove heuristic Android/iOS browser detection from layout decisions. Use only the actual native bridge or an explicit wrapper marker, preventing inconsistent first renders.
4. Make the first paint black from the earliest document response and coordinate splash removal with the first completed app frame, so the white WebView never appears while the live page loads.
5. Keep the app online-only and remove any remaining startup dependency on cached/offline shells or stale service workers.

## Verification
- Compare the old and current behavior at identical Android and iPhone sizes.
- Test cold start, slow connection, reload, signed-out home, signed-in home, and Community.
- Confirm the header begins at `y = 0`, no white frame appears, and Chrome mobile/PWA retain their current appearance.
- Run the full typecheck, all tests, production build, native synchronization, and inspect the generated Android/iOS settings for the correct package identity and live URL.

## Important limitation
The code and native projects can be corrected here, but the already-installed store binaries cannot change remotely. After verification, the corrected Android and iOS builds must replace the existing store versions under the restored package identity.
