/** Browser-only helpers for Firebase web push. Call from event handlers / effects. */
const STORE = "smartygym-push-token";

function config() {
  const env = import.meta.env as Record<string, string | undefined>;
  const appId = env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"];
  return {
    vapidKey: env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"],
    firebase: {
      apiKey: env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"] ?? "",
      projectId: env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"] ?? "",
      appId: appId ?? "",
      messagingSenderId: appId?.split(":")[1] ?? "",
    },
  };
}

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

export function storedPushToken(): string | null {
  try { return localStorage.getItem(STORE); } catch { return null; }
}

export async function enablePush(): Promise<PushResult> {
  const { vapidKey, firebase } = config();
  if (!firebase.apiKey || !firebase.projectId || !firebase.appId || !firebase.messagingSenderId || !vapidKey) return { status: "not-configured" };
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { status: "unsupported" };
  const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
  if (!(await isSupported())) return { status: "unsupported" };
  if (window.top !== window.self) return { status: "open-in-new-tab" };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };
  const { initializeApp, getApps } = await import("firebase/app");
  const app = getApps()[0] ?? initializeApp(firebase);
  const query = new URLSearchParams(firebase).toString();
  const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration });
  if (!token) return { status: "denied" };
  try { localStorage.setItem(STORE, token); } catch { /* ignore */ }
  return { status: "registered", token };
}

export async function disablePush(): Promise<string | null> {
  const token = storedPushToken();
  try { localStorage.removeItem(STORE); } catch { /* ignore */ }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => (r.active?.scriptURL ?? "").includes("firebase-messaging-sw")).map((r) => r.unregister()));
  } catch { /* ignore */ }
  return token;
}
