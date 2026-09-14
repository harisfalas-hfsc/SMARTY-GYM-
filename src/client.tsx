import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";

function revealNativeApp() {
  window.dispatchEvent(new Event("smartygym:native-ready"));
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
    window.requestAnimationFrame(revealNativeApp);
    return;
  }

  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});