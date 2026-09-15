import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import { purgeLegacyAppShells } from "./lib/service-worker-cleanup";

// smartygym.com previously hosted a different app. Clear its retired offline
// shell before hydration so an installed WebView cannot display its stale page.
void purgeLegacyAppShells();

async function prepareNativeWindow() {
  if (!document.documentElement.classList.contains("native-shell")) return;

  try {
    const [{ StatusBar }, { SplashScreen }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.hide();
    await SplashScreen.hide({ fadeOutDuration: 120 });
  } catch {
    // The same client bundle also runs in ordinary mobile browsers.
  }
}

function revealFirstFrame() {
  document.documentElement.classList.remove("native-first-frame");
}

startTransition(async () => {
  const localNativeRoot = document.getElementById("root");
  if (localNativeRoot) {
    const router = getRouter();
    await router.load();
    createRoot(localNativeRoot).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        revealFirstFrame();
        void prepareNativeWindow();
      }),
    );
    return;
  }

  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() => {
      revealFirstFrame();
      void prepareNativeWindow();
    }),
  );
});