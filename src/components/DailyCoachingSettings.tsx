import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BellRing, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDailyHub,
  saveDailySettings,
  type DailySettings,
} from "@/lib/daily.functions";
import { loadRemote } from "@/lib/remote-data";
import { useAuth } from "@/hooks/useAuth";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ZONES = [
  "Europe/Athens",
  "Europe/Nicosia",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Lisbon",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Australia/Sydney",
];

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function DailyCoachingSettings(_props: { premium?: boolean }) {
  const { user } = useAuth();
  const load = useServerFn(getDailyHub);
  const save = useServerFn(saveDailySettings);
  const [settings, setSettings] = useState<DailySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void loadRemote("wod:hub", () => load({}), user.id)
      .then((hub) => setSettings(hub.settings))
      .catch(() => undefined);
  }, [load, user?.id]);




  function patch(next: Partial<DailySettings>) {
    setSettings((prev) => (prev ? { ...prev, ...next } : prev));
  }

  async function commit() {
    if (!settings || saving) return;
    setSaving(true);
    try {
      await save({ data: settings });
      toast.success("Daily coaching saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <section className="mt-4 grid h-32 place-items-center rounded-2xl border-2 border-blue-400 bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-2xl border-2 border-blue-400 bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold">Daily coaching</p>
          <p className="text-sm text-muted-foreground">Messages, delivery time and WOD mode.</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Morning motivation</p>
            <p className="text-xs text-muted-foreground">
              One short message from Smarty Coach each morning.
            </p>
          </div>
          <Switch
            checked={settings.notify_motivation}
            onCheckedChange={(v) => patch({ notify_motivation: v })}
          />
        </div>

        {settings.notify_motivation ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Send it at</p>
            <Select
              value={String(settings.motivation_hour)}
              onValueChange={(v) => patch({ motivation_hour: Number(v) })}
            >
              <SelectTrigger className="h-10 w-28 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {hourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Time zone</p>
          <Select value={settings.timezone} onValueChange={(v) => patch({ timezone: v })}>
            <SelectTrigger className="h-10 w-44 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(ZONES.includes(settings.timezone) ? ZONES : [settings.timezone, ...ZONES]).map(
                (z) => (
                  <SelectItem key={z} value={z}>
                    {z.replace("_", " ")}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p id="new-workout-email-label" className="text-sm font-semibold">New Smarty Workout emails</p>
            <p className="text-xs text-muted-foreground">When a new workout is added to Smarty Workouts.</p>
          </div>
          <Switch
            className="shrink-0"
            aria-labelledby="new-workout-email-label"
            checked={settings.email_new_workouts}
            onCheckedChange={(v) => patch({ email_new_workouts: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p id="shared-workout-email-label" className="text-sm font-semibold">Shared Workout emails</p>
            <p className="text-xs text-muted-foreground">When another member shares a workout.</p>
          </div>
          <Switch
            className="shrink-0"
            aria-labelledby="shared-workout-email-label"
            checked={settings.email_shared_workouts}
            onCheckedChange={(v) => patch({ email_shared_workouts: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p id="weekly-insights-email-label" className="text-sm font-semibold">Weekly Insights emails</p>
            <p className="text-xs text-muted-foreground">Your progress report every Monday morning.</p>
          </div>
          <Switch
            className="shrink-0"
            aria-labelledby="weekly-insights-email-label"
            checked={settings.email_weekly_insights}
            onCheckedChange={(v) => patch({ email_weekly_insights: v })}
          />
        </div>

      </div>

      <Button className="mt-5 h-12 w-full rounded-2xl" disabled={saving} onClick={() => void commit()}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save daily coaching
      </Button>
    </section>
  );
}
