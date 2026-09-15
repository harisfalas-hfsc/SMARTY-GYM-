# Remove the native top gap

## Changes
- Force the app header's top inset to zero only inside the iOS and Android native wrappers.
- Apply the same rule to the locally bundled native launch page so startup and the rendered app match.
- Leave Chrome mobile and the installed web app unchanged.
- Rebuild and simulate both iOS and Android to confirm the header begins at the top with no white flash.

## Technical details
- Override `--app-safe-area-top` for `.native-shell` instead of reading the operating-system safe-area inset a second time.
- Preserve the native black startup background and existing launch transition.
