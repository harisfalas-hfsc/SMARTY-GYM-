const LEGACY_DATABASES = ["smartygym-query-cache", "smartygym-offline"];

/** Remove retired offline app shells left behind by earlier smartygym.com versions. */
export async function purgeLegacyAppShells(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (registration) => {
          const scriptUrl =
            registration.active?.scriptURL ??
            registration.installing?.scriptURL ??
            registration.waiting?.scriptURL ??
            "";
          if (scriptUrl.includes("firebase-messaging-sw") || scriptUrl.includes("OneSignal")) return;
          await registration.unregister();
        }),
      );
    }
  } catch {
    // Startup must continue even if a WebView restricts service-worker access.
  }

  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Startup must continue even if cache storage is unavailable.
  }

  if (!("indexedDB" in window)) return;
  await Promise.allSettled(
    LEGACY_DATABASES.map(
      (name) =>
        new Promise<void>((resolve) => {
          try {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          } catch {
            resolve();
          }
        }),
    ),
  );
}