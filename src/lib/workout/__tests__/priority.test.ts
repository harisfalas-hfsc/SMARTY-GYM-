import { describe, expect, it } from "vitest";
import { priorityIds, resolvePriority } from "../priority";
import type { PoolExercise } from "../pool.server";

const ex = (id: string, name: string) => ({ id, name }) as PoolExercise;
const lib = [
  ex("1", "push-up"),
  ex("2", "archer push up"),
  ex("3", "dumbbell goblet squat"),
  ex("4", "kettlebell swing"),
  ex("5", "suspended row"),
  ex("6", "cable seated row"),
  ex("7", "lever pec deck fly v. 2"),
];

describe("coach priority exercises", () => {
  it("maps coach names to the library's own spelling", () => {
    expect(resolvePriority("Push-Up", lib)[0].name).toBe("push-up");
    expect(resolvePriority("Goblet Squat", lib)[0].name).toBe("dumbbell goblet squat");
    expect(resolvePriority("TRX Row", lib)[0].name).toBe("suspended row");
    expect(resolvePriority("Seated Cable Row", lib)[0].name).toBe("cable seated row");
  });
  it("never invents an exercise that is not in the library", () => {
    expect(resolvePriority("Bird Dog", lib)).toEqual([]);
    for (const id of priorityIds(lib)) expect(lib.some((e) => e.id === id)).toBe(true);
  });
});
