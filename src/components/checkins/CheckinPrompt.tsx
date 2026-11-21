import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCheckinRevision } from "@/hooks/useCheckinRevision";
import { getCheckinState } from "@/lib/checkins.functions";
import { pendingCheckin } from "@/lib/checkins/score";
import { iconInk } from "@/lib/icon-tone";
import { useCheckinSubmit } from "./CheckinsPanel";
import { MorningCheckinForm, NightCheckinForm } from "./CheckinForms";

/** Optional, caller-owned check-in entry; never blocks training or saves on opening. */
export function CheckinPrompt() {
  const { user } = useAuth();
  const revision = useCheckinRevision();
  const load = useServerFn(getCheckinState);
  const { data } = useQuery({
    queryKey: ["context-checkin", user?.id, revision],
    queryFn: () => load({ data: { days: 7 } }),
    enabled: Boolean(user?.id),
    retry: false,
    refetchInterval: 60_000,
  });
  const kind = data ? pendingCheckin(data.minutes, data.today) : null;
  const key = `${user?.id}:${data?.date}:${kind}`;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [form, setForm] = useState(false);
  useEffect(() => { setForm(false); }, [key]);
  const { morning, night } = useCheckinSubmit(() => setForm(false));
  if (!user || !kind || dismissed === key) return null;

  return (
    <section aria-label="Check-in reminder" className="app-card my-3 space-y-3 p-4">
      <div className="flex items-start gap-3">
        <ClipboardCheck className={`mt-0.5 h-5 w-5 shrink-0 ${iconInk("Smarty Check-ins")}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{kind === "morning" ? "How do you feel before training?" : "How was your day?"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{kind === "morning" ? "Complete your morning check-in so Smarty Coach can account for your sleep, soreness and energy." : "Complete your evening check-in to record movement, hydration and day strain."}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Dismiss check-in reminder" title="Dismiss check-in reminder" onClick={() => setDismissed(key)} className="shrink-0"><X className="h-4 w-4" /></Button>
      </div>
      {form ? (kind === "morning" ? <MorningCheckinForm onSubmit={morning} /> : <NightCheckinForm onSubmit={night} />) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setForm(true)}><ClipboardCheck className="h-4 w-4" /> Do check-in</Button>
          <Button variant="outline" onClick={() => setDismissed(key)}>Later</Button>
        </div>
      )}
    </section>
  );
}