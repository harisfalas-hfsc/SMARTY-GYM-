import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
        ? "Free mode is ON — every signed-in member has premium access without paying."
        : "Free mode is OFF — premium access requires an active paid membership.",
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
            <p className="font-bold">Free mode</p>
            <p className="text-xs text-muted-foreground">
              This switch controls whether premium access is free. It does not switch the payment
              system itself on or off.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border-2 border-blue-400 p-3">
          <div>
            <p className="text-sm font-semibold">Make the entire app free</p>
            <p className="text-xs text-muted-foreground">
              ON means every signed-in member gets premium access without paying. OFF means only
              administrators and members with an active paid membership get premium access.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-extrabold uppercase tracking-widest ${
                enabled ? "text-amber-500" : "text-muted-foreground"
              }`}
            >
              {enabled ? "FREE MODE ON" : "FREE MODE OFF"}
            </span>
            <Switch
              aria-label="Free Access Mode"
              checked={enabled}
              disabled={busy}
              onCheckedChange={(v) => void toggle(v)}
              className="h-9 w-16 border-2 border-primary/60 data-[state=unchecked]:bg-muted [&>span]:h-7 [&>span]:w-7 [&>span]:bg-primary [&>span]:data-[state=checked]:translate-x-7"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className="h-auto min-h-10 whitespace-normal py-2"
              variant={enabled ? "outline" : "default"}
              disabled={busy || !enabled}
              onClick={() => void toggle(false)}
            >
              Require paid membership
            </Button>
            <Button
              className="h-auto min-h-10 whitespace-normal py-2"
              variant={enabled ? "default" : "outline"}
              disabled={busy || enabled}
              onClick={() => void toggle(true)}
            >
              Make app free
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center">
          <span className="shrink-0">Current state:</span>
          <Badge
            className="max-w-full whitespace-normal text-left leading-snug"
            variant={enabled ? "destructive" : "secondary"}
          >
            {enabled ? "FREE — NO MEMBERSHIP REQUIRED" : "PAID — ACTIVE MEMBERSHIP REQUIRED"}
          </Badge>
        </div>

      </section>

      {enabled && (
        <p className="rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm">
          Free mode is ON. Prices and purchase options are hidden, and every signed-in member has
          premium access.
        </p>
      )}
    </div>
  );
}
