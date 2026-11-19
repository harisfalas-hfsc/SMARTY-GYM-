import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { refreshActivity } from "../refresh-activity";

describe("activity refresh after a check-in save", () => {
  it("immediately reads the saved check-in in the mounted homepage briefing", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const key = ["home-week-activity", "member", "2026-11-16"];
    let saved = false;
    client.setQueryData(key, []);
    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: async () => saved ? [{ kind: "checkin_morning", at: "2026-11-19T07:15:00Z" }] : [],
    });
    const unsubscribe = observer.subscribe(() => undefined);
    saved = true;
    await refreshActivity(client, "member");
    expect(client.getQueryData(key)).toEqual([{ kind: "checkin_morning", at: "2026-11-19T07:15:00Z" }]);
    unsubscribe();
    client.clear();
  });

  it("marks both calendar caches stale without changing another member's activity", async () => {
    const client = new QueryClient();
    const month = ["logbook-month-activity", "member", "2026-11-01"];
    const day = ["logbook-activity", "member", "2026-11-19", "2026-11-20"];
    const other = ["home-week-activity", "other-member", "2026-11-16"];
    for (const key of [month, day, other]) client.setQueryData(key, []);
    await refreshActivity(client, "member");
    expect(client.getQueryState(month)?.isInvalidated).toBe(true);
    expect(client.getQueryState(day)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });
});