import type { ActivityEvent, ActivityKind } from "./activity";

const LIVE_HOSTS = ["smartygym.com", "www.smartygym.com", "thesmartygym.lovable.app"];

/**
 * Sample activity is shown automatically in the editor preview only (never on the
 * published site), on top of the real activity. ?demoActivity=0 hides it for the tab.
 * Nothing is saved to the database.
 */
export function demoActivityOn(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search).get("demoActivity");
  if (p === "0") sessionStorage.setItem("sg-demo-activity", "off");
  if (p === "1") sessionStorage.removeItem("sg-demo-activity");
  if (sessionStorage.getItem("sg-demo-activity") === "off") return false;
  return !LIVE_HOSTS.includes(window.location.hostname);
}

const ALL: [ActivityKind, string][] = [
  ["checkin", "Morning Check-in"], ["created", "Upper Body Builder"], ["added", "Workout of the Day"],
  ["favorited", "Upper Body Builder"], ["completed", "Workout of the Day"], ["shared", "Upper Body Builder"],
  ["reaction", "Community"], ["comment", "Community"], ["rating", "Community"], ["checkin", "Night Check-in"],
];

/** Sample events around `now`: Monday and today full, Tuesday empty, last week mixed. */
export function demoEvents(now: Date): ActivityEvent[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const at = (offsetDays: number, hour: number, minute = 0) => {
    const d = new Date(monday); d.setDate(d.getDate() + offsetDays); d.setHours(hour, minute, 0, 0); return d;
  };
  const out: ActivityEvent[] = [];
  const day = (offset: number, picks: number[]) => picks.forEach((i, n) => {
    const [kind, label] = ALL[i]!; out.push({ at: at(offset, 7 + n, 10 + n * 3).toISOString(), kind, label: `${label} (sample)` });
  });
  day(0, ALL.map((_, i) => i));                 // Monday: everything
  const todayOffset = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - monday.getTime()) / 864e5);
  if (todayOffset > 1) ALL.forEach(([kind, label], n) => { // today: everything, all before now
    out.push({ at: new Date(now.getTime() - (ALL.length - n) * 60_000 * 5).toISOString(), kind, label: `${label} (sample)` });
  });
  day(-7, [0, 4, 9]); day(-6, [7]); day(-5, [0, 1, 4]); day(-3, [6, 8]); day(-2, [0, 2, 4, 5]); // last week
  return out.filter(e => new Date(e.at) <= now);
}
