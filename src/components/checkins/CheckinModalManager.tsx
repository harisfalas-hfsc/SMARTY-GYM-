import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getCheckinState, markCheckinModalShown } from "@/lib/checkins.functions";
import { MorningCheckinForm, NightCheckinForm } from "./CheckinForms";
import { CHECKINS_CHANGED, useCheckinSubmit, type CheckinState } from "./CheckinsPanel";

/**
 * Opens the old SmartyGym prompt once per window (07:00–10:00 and 19:00–22:00):
 * "Do it now" opens the form, "Later" leaves it in Logbook → Progress.
 */
export function CheckinModalManager() {
  const { user } = useAuth();
  const fetchState = useServerFn(getCheckinState);
  const markShown = useServerFn(markCheckinModalShown);
  const [prompt, setPrompt] = useState<"morning" | "night" | null>(null);
  const [form, setForm] = useState<"morning" | "night" | null>(null);
  const [streak, setStreak] = useState(0);
  const [today, setToday] = useState("");

  const check = useCallback(async () => {
    if (!user?.id) return;
    try {
      const s = (await fetchState({ data: { days: 7 } })) as CheckinState;
      setStreak(s.stats.currentStreak);
      setToday(s.date);
      const t = s.today;
      const key = (k: string) => `checkin_${k}_dismissed_${s.date}`;
      if (document.documentElement.dataset.smartyCoach === "open") return;
      if (s.window.isMorning && !t?.morning_completed && !t?.morning_modal_shown && !localStorage.getItem(key("morning")))
        setPrompt("morning");
      else if (s.window.isNight && !t?.night_completed && !t?.night_modal_shown && !localStorage.getItem(key("night")))
        setPrompt("night");
    } catch {
      /* never block the app over a reminder */
    }
  }, [user?.id, fetchState]);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), 5 * 60 * 1000);
    const afterCoach = () => void check();
    window.addEventListener("smarty:coach-closed", afterCoach);
    return () => {
      clearInterval(id);
      window.removeEventListener("smarty:coach-closed", afterCoach);
    };
  }, [check]);

  const close = (then: "form" | "later") => {
    const kind = prompt;
    setPrompt(null);
    if (!kind) return;
    localStorage.setItem(`checkin_${kind}_dismissed_${today}`, "1");
    void markShown({ data: { kind } }).catch(() => undefined);
    if (then === "form") setForm(kind);
  };
  const { morning, night } = useCheckinSubmit(() => setForm(null));

  if (!user?.id) return null;
  const isMorning = prompt === "morning";
  return (
    <>
      <Dialog open={prompt !== null} onOpenChange={(o) => !o && close("later")}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {isMorning ? <Sun className="h-6 w-6 text-primary" /> : <Moon className="h-6 w-6 text-primary" />}
              {isMorning ? "Morning" : "Night"} Smarty Check-in
            </DialogTitle>
            <DialogDescription className="pt-2">
              {isMorning
                ? "Takes 30 seconds. Start your day with intention."
                : "Review your day in 30 seconds and keep your score on track."}
            </DialogDescription>
          </DialogHeader>
          {streak > 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{streak} day streak! Don't break it.</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 pt-4">
            <Button size="lg" className="w-full" onClick={() => close("form")}>
              Do it now
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => close("later")}>
              Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{form === "morning" ? "Morning" : "Night"} Check-in</DialogTitle>
            <DialogDescription>Smarty Check-in</DialogDescription>
          </DialogHeader>
          {form === "morning" ? <MorningCheckinForm onSubmit={morning} /> : null}
          {form === "night" ? <NightCheckinForm onSubmit={night} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { CHECKINS_CHANGED };
