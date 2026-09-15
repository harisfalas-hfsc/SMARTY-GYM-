# Phone app icons and names — and the truth about store submission

## About "submit a new version to both stores"

I cannot do that. I have no access to your Google Play or Apple developer accounts, no signing keys, and no way to upload a binary. I should not have phrased it as a suggestion for me — it is a step only you (or whoever produced your current store builds) can do. I will stop implying otherwise.

What I can do: prepare the app package inside this project so that whoever builds it gets the correct icons, names, and startup behaviour.

## The icon problem I found

Your phone apps are still using the placeholder icons and background that come by default with the app packaging tool — a white square with a generic mark, not the SMARTYGYM logo. That is why the home-screen icon looks like old branding.

## What I will fix

1. Android home-screen icon: replace every size of the launcher icon (all six densities, plain, round, and the layered foreground) with the SMARTYGYM logo, and change the icon backdrop from white to black so it matches the brand.
2. iPhone/iPad home-screen icon: replace the app icon image with the 1024px SMARTYGYM logo.
3. App name on the home screen: already "SMARTYGYM" on both platforms — I will confirm it stays exactly that after re-syncing.
4. Web/home-screen install name: change "Smarty Gym" / "SmartyGym" to "SMARTYGYM" so the browser-installed shortcut matches the phone apps.

## Technical notes

- Source image: `src/assets/smartygym-icon.png` (fall back to `public/icon-512.png`), resized to 1024, 192, 144, 96, 72, 48 as needed.
- Android: `android/app/src/main/res/mipmap-*/ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`; `values/ic_launcher_background.xml` → `#000000`.
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024, no alpha, per App Store rules).
- `public/manifest.webmanifest`: `name` and `short_name` → `SMARTYGYM`.
- Verify with `bun run cap:sync`, typecheck, the full test suite, and `bun run build:native`; confirm the written icon files are the new logo (dimensions + checksums differ from the defaults).

## After I finish

You (or your build provider) must rebuild the Android and iOS packages from this project and upload new versions to Google Play and the App Store. Until a new build is live in the stores, installed apps keep the old icon.
