import { describe, expect, it, vi } from "vitest";
import { CHECKINS_CHANGED, subscribeToCheckinChanges } from "../checkins/changes";

describe("live check-in view updates", () => {
  it("notifies every mounted view on each save and removes dismissed views", () => {
    const target = new EventTarget();
    const first = vi.fn();
    const second = vi.fn();
    const removeFirst = subscribeToCheckinChanges(target, first);
    const removeSecond = subscribeToCheckinChanges(target, second);
    target.dispatchEvent(new Event(CHECKINS_CHANGED));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    removeFirst();
    target.dispatchEvent(new Event(CHECKINS_CHANGED));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    removeSecond();
  });
});