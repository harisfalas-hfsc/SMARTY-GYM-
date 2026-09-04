import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { adminGetFreeAccessMode, adminSetFreeAccessMode } from "@/lib/admin.functions";
import { setFreeAccessModeCache } from "@/hooks/useFreeAccessMode";

export function AdminPaymentsTab() {
  const getMode = useServerFn(adminGetFreeAccessMode);
  const setMode = useServerFn(adminSetFreeAccessMode);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await getMode({ data: {} } as never);
      if ("error" in r) toast.error(r.error);
      else setEnabled(r.enabled);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(next: boolean) {
    setBusy(true);
    const r = await setMode({ data: { enabled: next } });
    setBusy(false);
    if ("error" in r) {
      toast.error(r.error);
      return;
    }
    setEnabled(r.enabled);
    setFreeAccessModeCache(r.enabled);
    toast.success(
      r.enabled
        ? "Free Access Mode ON — All content is free for signed-in members. Every price, purchase button and premium page is hidden everywhere."
        : "Free Access Mode OFF — Normal paid mode restored. Existing subscriptions were never touched.",
    );
  }

  if (enabled === null) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section
        className={`space-y-4 rounded-2xl border bg-card p-4 ${
          enabled ? "border-amber-500" : "border-blue-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">Global Free Access Mode</p>
            <p className="text-xs text-muted-foreground">
              Master switch. When ON, every signed-in member gets full premium access and the whole
              app becomes free-only: no prices, no purchase buttons, no premium pages, no "buy on
              the website" notices. Nothing in the payment provider changes and existing
              subscriptions keep billing — flip it back any time.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border-2 border-blue-400 p-3">
          <div>
            <p className="text-sm font-semibold">Make the entire app free</p>
            <p className="text-xs text-muted-foreground">
              Use this for App Store / Play Store review when a reviewer must not see any purchase
              path at all.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-extrabold uppercase tracking-widest ${
                enabled ? "text-amber-500" : "text-muted-foreground"
              }`}
            >
              {enabled ? "ON" : "OFF"}
            </span>
            <Switch
              aria-label="Free Access Mode"
              checked={enabled}
              disabled={busy}
              onCheckedChange={(v) => void toggle(v)}
              className="h-9 w-16 border-2 border-primary/60 data-[state=unchecked]:bg-muted [&>span]:h-7 [&>span]:w-7 [&>span]:bg-primary [&>span]:data-[state=checked]:translate-x-7"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={enabled ? "outline" : "default"}
              disabled={busy || !enabled}
              onClick={() => void toggle(false)}
            >
              Switch OFF (paid)
            </Button>
            <Button
              variant={enabled ? "default" : "outline"}
              disabled={busy || enabled}
              onClick={() => void toggle(true)}
            >
              Switch ON (free)
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          Current state:
          <Badge variant={enabled ? "destructive" : "secondary"}>
            {enabled ? "EVERYTHING FREE" : "NORMAL PAID MODE"}
          </Badge>
        </div>

      </section>

      {enabled && (
        <p className="rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm">
          Free Access Mode is ON. It overrides everything else — purchases are forced OFF on iOS,
          Android and web, and the Pricing page is hidden.
        </p>
      )}
    </div>
  );
}
