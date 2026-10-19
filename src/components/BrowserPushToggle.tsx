import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { registerPushToken, unregisterPushToken } from "@/lib/push.functions";
import { disablePush, enablePush, storedPushToken } from "@/lib/web-push";

const MESSAGES: Record<string, string> = {
  "not-configured": "Browser notifications are not available yet. Please try again later.",
  unsupported: "This browser does not support notifications.",
  "open-in-new-tab": "Open SmartyGym in its own browser tab to turn on notifications.",
  denied: "Notifications are blocked. Allow them for smartygym.com in your browser's site settings.",
};

/** Opt-in for desktop browser notifications that accompany every paired inbox + email message. */
export function BrowserPushToggle() {
  const register = useServerFn(registerPushToken);
  const unregister = useServerFn(unregisterPushToken);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const has = Boolean(storedPushToken()) && typeof Notification !== "undefined" && Notification.permission === "granted";
    setOn(has);
    // Refresh the token silently so the saved one stays current.
    if (has) void enablePush().then((r) => { if (r.status === "registered") void register({ data: { token: r.token, userAgent: navigator.userAgent } }); }).catch(() => {});
  }, [register]);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      if (next) {
        const r = await enablePush();
        if (r.status !== "registered") { toast.error(MESSAGES[r.status]); return; }
        const res = await register({ data: { token: r.token, userAgent: navigator.userAgent } });
        if (!res.ok) { toast.error("Could not turn on notifications."); return; }
        setOn(true);
        toast.success("Browser notifications are on.");
      } else {
        const token = await disablePush();
        if (token) await unregister({ data: { token } });
        setOn(false);
      }
    } catch {
      toast.error("Could not change browser notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p id="browser-push-label" className="text-sm font-semibold">Browser notifications</p>
        <p className="text-xs text-muted-foreground">A pop-up on this computer with every message you get by email and in your inbox.</p>
      </div>
      <Switch className="shrink-0" aria-labelledby="browser-push-label" checked={on} disabled={busy} onCheckedChange={(v) => void toggle(v)} />
    </div>
  );
}
