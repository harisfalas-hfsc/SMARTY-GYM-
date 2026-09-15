import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";

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

function revealNativeApp() {
  window.dispatchEvent(new Event("smartygym:native-ready"));
  void prepareNativeWindow();
}

startTransition(async () => {
  if (document.documentElement.classList.contains("native-shell")) {
    const root = document.getElementById("root");
    if (!root) return;

    const router = getRouter();
    await router.load();
    createRoot(root).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
    window.requestAnimationFrame(() => window.requestAnimationFrame(revealNativeApp));
    return;
  }

  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});