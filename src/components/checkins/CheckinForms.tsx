import { useState } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { MorningInput, NightInput } from "@/lib/checkins/score";

// Question wording, emojis and labels are the old SmartyGym check-ins, unchanged.
const sleepQualityEmojis = [
  { value: 1, emoji: "😫", label: "Very poor" },
  { value: 2, emoji: "😟", label: "Poor" },
  { value: 3, emoji: "😐", label: "Average" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😴", label: "Excellent" },
];
const moodEmojis = [
  { value: 1, emoji: "😰", label: "Very stressed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😁", label: "Very positive" },
];
const readinessLabel = (n: number) =>
  n <= 2 ? "Exhausted" : n <= 4 ? "Very tired" : n <= 6 ? "OK" : n <= 8 ? "Good" : "On fire!";
const sorenessLabel = (n: number) =>
  n <= 2 ? "No soreness" : n <= 4 ? "Mild" : n <= 6 ? "Noticeable" : n <= 8 ? "Very sore" : "Painful";
const stepBuckets = [
  { value: 1, label: "0-2k" },
  { value: 2, label: "2-5k" },
  { value: 3, label: "5-8k" },
  { value: 4, label: "8-10k" },
  { value: 5, label: "10k+" },
];
const hydrationQuick = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
const proteinLevels = [
  { value: 0, emoji: "🍽️", label: "Way below" },
  { value: 1, emoji: "🥚", label: "Some" },
  { value: 2, emoji: "🍗", label: "Close" },
  { value: 3, emoji: "🥩", label: "Hit target" },
  { value: 4, emoji: "💪", label: "Exceeded" },
];
const strainLabel = (n: number) =>
  n <= 2 ? "Very easy" : n <= 4 ? "Light" : n <= 7 ? "Moderate" : n <= 9 ? "Hard" : "Brutal";

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg p-1.5 transition-all sm:p-2",
        active ? "bg-primary text-primary-foreground ring-2 ring-primary" : "bg-muted hover:bg-muted/80",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

type FormMode = { initial?: Partial<MorningInput & NightInput> | null; readOnly?: boolean };
const num = (v: unknown, d: number) => (v === null || v === undefined ? d : Number(v));

export function MorningCheckinForm({ onSubmit, initial, readOnly }: { onSubmit: (d: MorningInput) => Promise<void> } & FormMode) {
  const [sleepHours, setSleepHours] = useState(num(initial?.sleep_hours, 7));
  const [sleepQuality, setSleepQuality] = useState(num(initial?.sleep_quality, 3));
  const [readiness, setReadiness] = useState(num(initial?.readiness_score, 5));
  const [soreness, setSoreness] = useState(num(initial?.soreness_rating, 3));
  const [mood, setMood] = useState(num(initial?.mood_rating, 3));
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-lg font-extrabold">
          <Sun className="h-5 w-5 text-primary" /> Morning Check-in
        </p>
        <p className="text-sm text-muted-foreground">{readOnly ? "The window is closed. Your answers are locked." : initial ? "You can change your answers until the window closes. Only your last save counts." : "Window open until 10:00. Takes 30 seconds."}</p>
      </div>
      <fieldset disabled={readOnly} className={cn("space-y-5", readOnly && "pointer-events-none opacity-80")}>
      <Field label="How many hours did you sleep last night?">
        <div className="flex items-center gap-3">
          <Slider value={[sleepHours]} onValueChange={([v]) => setSleepHours(v ?? 7)} min={3} max={10} step={0.5} className="flex-1" />
          <span className="w-12 text-center font-semibold">{sleepHours}h</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>3h</span><span>10h</span></div>
      </Field>
      <Field label="How was your sleep quality?">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {sleepQualityEmojis.map((o) => (
            <Choice key={o.value} active={sleepQuality === o.value} onClick={() => setSleepQuality(o.value)}>
              <span className="text-lg sm:text-2xl">{o.emoji}</span>
              <span className="mt-0.5 hidden w-full truncate text-center text-[10px] sm:block sm:text-xs">{o.label}</span>
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="How ready do you feel for today?">
        <div className="flex items-center gap-3">
          <Slider value={[readiness]} onValueChange={([v]) => setReadiness(v ?? 5)} min={0} max={10} step={1} className="flex-1" />
          <span className="w-24 text-center text-xs font-medium sm:w-28 sm:text-sm">
            <span className="font-bold text-primary">{readiness}</span> – {readinessLabel(readiness)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>10</span></div>
      </Field>
      <Field label="How does your body feel this morning?">
        <div className="flex items-center gap-3">
          <Slider value={[soreness]} onValueChange={([v]) => setSoreness(v ?? 3)} min={0} max={10} step={1} className="flex-1" />
          <span className="w-24 text-center text-xs font-medium sm:w-28 sm:text-sm">
            <span className="font-bold text-primary">{soreness}</span> – {sorenessLabel(soreness)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>No soreness</span><span>Very sore</span></div>
      </Field>
      <Field label="How is your mood right now?">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {moodEmojis.map((o) => (
            <Choice key={o.value} active={mood === o.value} onClick={() => setMood(o.value)}>
              <span className="text-lg sm:text-2xl">{o.emoji}</span>
              <span className="mt-0.5 hidden w-full truncate text-center text-[10px] sm:block sm:text-xs">{o.label}</span>
            </Choice>
          ))}
        </div>
      </Field>
      </fieldset>
      {readOnly ? null : <Button
        className="w-full"
        size="lg"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit({ sleep_hours: sleepHours, sleep_quality: sleepQuality, readiness_score: readiness, soreness_rating: soreness, mood_rating: mood });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : initial ? "Save Changes" : "Complete Morning Check-in"}
      </Button>}
    </div>
  );
}

export function NightCheckinForm({ onSubmit, initial, readOnly }: { onSubmit: (d: NightInput) => Promise<void> } & FormMode) {
  const [steps, setSteps] = useState(num(initial?.steps_bucket, 3));
  const [water, setWater] = useState(num(initial?.hydration_liters, 2.0));
  const [protein, setProtein] = useState(num(initial?.protein_level, 2));
  const [strain, setStrain] = useState(num(initial?.day_strain, 5));
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-lg font-extrabold">
          <Moon className="h-5 w-5 text-primary" /> Night Check-in
        </p>
        <p className="text-sm text-muted-foreground">{readOnly ? "The window is closed. Your answers are locked." : initial ? "You can change your answers until the window closes. Only your last save counts." : "Window open until 22:00. Takes 30 seconds."}</p>
      </div>
      <fieldset disabled={readOnly} className={cn("space-y-5", readOnly && "pointer-events-none opacity-80")}>
      <Field label="How much did you move today?">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {stepBuckets.map((o) => (
            <Choice key={o.value} active={steps === o.value} onClick={() => setSteps(o.value)}>
              <span className="text-xs font-semibold sm:text-sm">{o.label}</span>
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="How much water did you drink today?">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {hydrationQuick.map((l) => (
            <Choice key={l} active={water === l} onClick={() => setWater(l)}>
              <span className="text-xs sm:text-sm">{l}L{l >= 3 ? "+" : ""}</span>
            </Choice>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Slider value={[water]} onValueChange={([v]) => setWater(Math.round((v ?? 2) * 10) / 10)} min={0} max={6} step={0.1} className="flex-1" />
          <span className="w-10 text-center text-sm font-semibold">{water}L</span>
        </div>
      </Field>
      <Field label="Did you hit your protein today?">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {proteinLevels.map((o) => (
            <Choice key={o.value} active={protein === o.value} onClick={() => setProtein(o.value)}>
              <span className="text-lg sm:text-2xl">{o.emoji}</span>
              <span className="mt-0.5 hidden w-full truncate text-center text-[10px] sm:block sm:text-xs">{o.label}</span>
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="How demanding was your day (physically and mentally)?">
        <div className="flex items-center gap-3">
          <Slider value={[strain]} onValueChange={([v]) => setStrain(v ?? 5)} min={0} max={10} step={1} className="flex-1" />
          <span className="w-24 text-center text-xs font-medium sm:w-28 sm:text-sm">
            <span className="font-bold text-primary">{strain}</span> – {strainLabel(strain)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>10</span></div>
      </Field>
      </fieldset>
      {readOnly ? null : <Button
        className="w-full"
        size="lg"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit({ steps_bucket: steps, hydration_liters: water, protein_level: protein, day_strain: strain });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : initial ? "Save Changes" : "Complete Night Check-in"}
      </Button>}
    </div>
  );
}
