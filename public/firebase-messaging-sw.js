/* Firebase web push only — no caching, no offline app shell. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();

self.addEventListener("notificationclick", (event) => {
  const link = event.notification?.data?.FCM_MSG?.data?.link || event.notification?.data?.link || "https://smartygym.com/";
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          await c.focus();
          if ("navigate" in c) await c.navigate(link);
          return;
        }
      }
      await self.clients.openWindow(link);
    })(),
  );
});
