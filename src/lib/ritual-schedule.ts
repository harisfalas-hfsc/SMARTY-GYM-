// Shared daily rotation math for Smarty Ritual (1, 2, 3 … last, then back to 1).

export function cyprusToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Nicosia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function dayIndex(iso: string): number {
  return Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return new Date((dayIndex(iso) + days) * 86_400_000).toISOString().slice(0, 10);
}

/** 1-based ritual position shown on `date`. */
export function positionForDate(anchor: string, date: string, count: number): number {
  if (count <= 0) return 0;
  const diff = dayIndex(date) - dayIndex(anchor);
  return (((diff % count) + count) % count) + 1;
}

/** Next date (today or later) that `position` is shown, and the one after. */
export function datesForPosition(anchor: string, today: string, position: number, count: number) {
  const current = positionForDate(anchor, today, count);
  const offset = (((position - current) % count) + count) % count;
  const next = addDays(today, offset);
  return { next, following: addDays(next, count) };
}
