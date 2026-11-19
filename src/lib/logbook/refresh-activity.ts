import type { QueryClient } from "@tanstack/react-query";

/** Refresh mounted activity views and mark cached calendar views stale after a save. */
export async function refreshActivity(queryClient: QueryClient, userId: string) {
  await Promise.all([
    "home-week-activity",
    "logbook-month-activity",
    "logbook-activity",
  ].map((key) => queryClient.invalidateQueries({ queryKey: [key, userId] })));
}