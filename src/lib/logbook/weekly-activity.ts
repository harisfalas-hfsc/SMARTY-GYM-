import { dayKey } from "./rows";

/** Local calendar dates, not UTC slices: weeks follow the viewer's device. */
export function localWeek(now: Date) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    return { date, key: dayKey(date), today: dayKey(date) === dayKey(now) };
  });
}

export function completedDays(timestamps: readonly (string | null)[], now: Date) {
  const week = new Set(localWeek(now).map(day => day.key));
  return new Set(timestamps.flatMap(timestamp => {
    if (!timestamp) return [];
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime()) || date > now) return [];
    const key = dayKey(date);
    return week.has(key) ? [key] : [];
  }));
}

export function localGreeting(now: Date) {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}