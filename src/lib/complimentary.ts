/** Durations the admin can choose when creating a complimentary member. */
export const COMPLIMENTARY_MONTH_OPTIONS = [1, 2, 3, 6, 12] as const;
export type ComplimentaryMonths = (typeof COMPLIMENTARY_MONTH_OPTIONS)[number];

export function isComplimentaryMonths(value: unknown): value is ComplimentaryMonths {
  return COMPLIMENTARY_MONTH_OPTIONS.includes(value as ComplimentaryMonths);
}

/** Access end date: the given number of calendar months from the start. */
export function complimentaryUntil(start: Date, months: number): Date {
  const until = new Date(start);
  until.setMonth(until.getMonth() + months);
  return until;
}

export const MIN_TEMP_PASSWORD = 8;
