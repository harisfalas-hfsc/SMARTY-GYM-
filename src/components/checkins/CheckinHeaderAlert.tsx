import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { iconTone } from "@/lib/icon-tone";
import { getCheckinAccess, getCheckinState } from "@/lib/checkins.functions";
import { CHECKINS_CHANGED } from "./CheckinsPanel";

/** Blinking header icon: Premium members only, open window, not yet checked in. */
export function CheckinHeaderAlert() {
  const { user } = useAuth();
  const fetchAccess = useServerFn(getCheckinAccess);
  const fetchState = useServerFn(getCheckinState);
  const [kind, setKind] = useState<"morning" | "night" | null>(null);

  const check = useCallback(async () => {
    if (!user?.id) return setKind(null);
    try {
      const a = await fetchAccess();
      if (!a.premium) return setKind(null);
      const s = await fetchState({ data: { days: 7 } });
      const t = s.today as { morning_completed?: boolean; night_completed?: boolean } | null;
      if (s.window.isMorning && !t?.morning_completed) setKind("morning");
      else if (s.window.isNight && !t?.night_completed) setKind("night");
      else setKind(null);
    } catch {
      setKind(null);
    }
  }, [user?.id, fetchAccess, fetchState]);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), 60 * 1000);
    const on = () => void check();
    window.addEventListener(CHECKINS_CHANGED, on);
    window.addEventListener("focus", on);
    return () => {
      clearInterval(id);
      window.removeEventListener(CHECKINS_CHANGED, on);
      window.removeEventListener("focus", on);
    };
  }, [check]);

  if (!kind) return null;
  const label = `${kind === "morning" ? "Morning" : "Night"} Smarty Check-in is open`;
  return (
    <Link
      to="/smarty-checkins"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-primary ${iconTone("Smarty Check-ins")}`}
    >
      <ClipboardCheck className="h-4 w-4" />
    </Link>
  );
}
