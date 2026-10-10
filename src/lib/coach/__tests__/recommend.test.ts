import { describe, expect, it } from "vitest";
import { decisionDestination, recommendNext, type CoachEngineInput, type CompletedSession, type LibraryWorkout } from "../recommend";

const W = (id: string, category: string, stars: number, focus: string | null = null, equipment: string[] = []): LibraryWorkout =>
  ({ id, name: `W-${id}`, category, stars, focus, minutes: 30, equipment });

const library: LibraryWorkout[] = [
  W("r1", "RECOVERY", 1), W("m1", "MOBILITY & STABILITY", 1), W("p1", "PILATES", 2),
  W("s-up", "STRENGTH", 2, "UPPER BODY"), W("s-low", "STRENGTH", 2, "LOWER BODY"), W("s-full", "STRENGTH", 2, "FULL BODY"),
  W("s-hard", "STRENGTH", 3, "UPPER BODY"), W("c1", "CARDIO", 2), W("c-easy", "CARDIO", 1),
];

const S = (day: string, category: string, stars: number, focus: string | null = null, rpe: number | null = null): CompletedSession =>
  ({ id: `done-${day}-${category}`, smartyId: null, name: `Done ${day} ${category}`, category, focus, stars, rpe, day });

const base: CoachEngineInput = {
  today: "2026-10-09",
  readiness: { state: "Ready", reason: "Recent workload leaves room for a full session." },
  overallLoad: "Moderate",
  consecutiveDays: 1,
  checkin: null,
  priorCheckins: [],
  recent: [S("2026-10-08", "STRENGTH", 2, "LOWER BODY")],
  totalCompleted: 10,
  everDone: { ids: [], names: [] },
  level: "intermediate",
  primaryGoalCategory: "STRENGTH",
  secondaryGoalCategory: null,
  limitations: [],
  equipment: [],
  typicalMinutes: 30,
  planned: null,
  library,
  fallbackExercises: [
    { id: "e1", name: "Cat Cow", kind: "mobility" }, { id: "e2", name: "Child Pose", kind: "recovery" },
    { id: "e3", name: "Dead Bug", kind: "mobility" }, { id: "e4", name: "Push Up", kind: "strength" },
    { id: "e5", name: "Squat", kind: "strength" }, { id: "e6", name: "Glute Bridge", kind: "strength" },
  ],
};
const run = (p: Partial<CoachEngineInput>) => recommendNext({ ...base, ...p });
const goodCheckin = { sleepHours: 8, sleepQuality: 5, readiness: 8, soreness: 2, mood: 4, yesterdayStrain: 3, yesterdayScore: 80 };
const poorCheckin = { ...goodCheckin, sleepHours: 4, readiness: 2, soreness: 8 };

describe("Smarty Coach engine", () => {
  it("1 Very High load → no hard session", () => {
    const d = run({ overallLoad: "Very High" });
    expect(d.purpose).toBe("recovery");
    expect(d.intensity).not.toBe("hard");
  });
  it("2 High load → lighter session", () => {
    const d = run({ overallLoad: "High" });
    expect(["light", "moderate"]).toContain(d.intensity);
    expect(d.reasonCodes).toContain("load.high");
  });
  it("3 Recovery Recommended → recovery or rest", () => {
    const d = run({ readiness: { state: "Recovery Recommended", reason: "6 consecutive training days." } });
    expect(["RECOVERY", "MOBILITY & STABILITY"]).toContain(d.category);
  });
  it("4 poor check-in lowers intensity, good check-in never overrides load", () => {
    expect(run({ checkin: poorCheckin }).intensity).toBe("light");
    expect(run({ checkin: goodCheckin, overallLoad: "Very High" }).purpose).toBe("recovery");
  });
  it("5 three hard days → recovery", () => {
    const d = run({ recent: [S("2026-10-08", "CARDIO", 3), S("2026-10-07", "STRENGTH", 3), S("2026-10-06", "METABOLIC", 2, null, 9)] });
    expect(d.reasonCodes).toContain("history.hard_streak");
    expect(d.purpose).toBe("recovery");
  });
  it("6 lower body yesterday → upper body", () => {
    expect(run({}).workout?.id).toBe("s-up");
  });
  it("7 full body yesterday → no full-body strength", () => {
    const d = run({ recent: [S("2026-10-08", "STRENGTH", 2, "FULL BODY")] });
    expect(d.workout?.focus).not.toBe("FULL BODY");
    expect(d.purpose).toBe("easy");
  });
  it("8 cardio yesterday, moderate load → strength", () => {
    expect(run({ recent: [S("2026-10-08", "CARDIO", 2)] }).category).toBe("STRENGTH");
  });
  it("9 cardio yesterday, high load → lighter work", () => {
    const d = run({ recent: [S("2026-10-08", "CARDIO", 2)], overallLoad: "High" });
    expect(d.purpose).toBe("easy");
  });
  it("10 limited load with history → deterministic, marked limited", () => {
    const d = run({ overallLoad: "Limited Data", readiness: { state: "Limited Data", reason: "x" } });
    expect(d.confidence).toBe("limited");
    expect(d.workout?.id).toBe("s-up");
  });
  it("11 no load, no history → intro 1 star, no readiness claim", () => {
    const d = run({ overallLoad: "None", readiness: { state: "Limited Data", reason: "x" }, recent: [], totalCompleted: 0 });
    expect(d.purpose).toBe("intro");
    expect(d.workout?.stars).toBe(1);
    expect(d.confidence).toBe("none");
    expect(d.explanation.join(" ")).not.toMatch(/recovered|ready|fatigued|stronger/i);
  });
  it("12 compatible planned session is chosen", () => {
    const d = run({ planned: { id: "pl", name: "Upper", category: "STRENGTH", focus: "UPPER BODY", stars: 2, date: "9 Oct" } });
    expect(d.action).toEqual({ kind: "planned", workoutId: "pl" });
  });
  it("13 planned hard session vs recovery → recovery wins", () => {
    const d = run({ overallLoad: "Very High", planned: { id: "pl", name: "Heavy", category: "STRENGTH", focus: null, stars: 3, date: "9 Oct" } });
    expect(d.action.kind).not.toBe("planned");
    expect(d.reasonCodes).toContain("calendar.planned_conflict");
  });
  it("14 existing workout before custom", () => {
    expect(run({}).usedFallback).toBe(false);
  });
  it("15 no matching workout → custom from library exercises", () => {
    const d = run({ library: [] });
    expect(d.action.kind).toBe("custom");
    expect(d.custom?.exercises.every((e) => base.fallbackExercises.some((f) => f.id === e.id))).toBe(true);
  });
  it("16 no custom possible → rest", () => {
    expect(run({ library: [], fallbackExercises: [] }).action.kind).toBe("rest");
  });
  it("17 missing focus → conditioning, no invented body part", () => {
    const d = run({ recent: [S("2026-10-08", "STRENGTH", 2, null)] });
    expect(d.reasonCodes).toContain("rotation.strength_unknown_focus");
    expect(d.explanation.join(" ")).not.toMatch(/upper|lower/i);
  });
  it("18 missing RPE/check-in stays unknown, not ready", () => {
    const d = run({ checkin: null, recent: [S("2026-10-08", "STRENGTH", 2, "LOWER BODY", null)] });
    expect(d.reasonCodes).toContain("checkin.missing");
    expect(d.reasonCodes).not.toContain("checkin.poor");
  });
  it("19 equal scores → stable tie-breaker by id", () => {
    const d = run({ library: [W("b", "STRENGTH", 2, "UPPER BODY"), W("a", "STRENGTH", 2, "UPPER BODY")] });
    expect(d.workout?.id).toBe("a");
  });
  it("20 identical inputs → identical results", () => {
    expect(JSON.stringify(run({}))).toBe(JSON.stringify(run({})));
  });
  it("21 level caps difficulty (beginner never gets 2+ stars)", () => {
    expect(run({ level: "beginner" }).workout?.stars ?? 1).toBeLessThanOrEqual(1);
  });
  it("22 destinations are valid routes and ids come from the library", () => {
    for (const p of [{}, { library: [] }, { library: [], fallbackExercises: [] }] as Partial<CoachEngineInput>[]) {
      const d = run(p);
      const dest = decisionDestination(d);
      expect(["/smarty-workouts/$workoutId", "/logbook", "/create-your-own-workout", "/smarty-ritual"]).toContain(dest.to);
      if (d.workout) expect((p.library ?? library).some((w) => w.id === d.workout!.id)).toBe(true);
    }
  });
  it("conflict: prior poor check-ins cap at moderate", () => {
    const d = run({ priorCheckins: [poorCheckin, poorCheckin] });
    expect(d.reasonCodes).toContain("checkin.poor_trend");
    expect(d.workout?.stars).toBeLessThanOrEqual(2);
  });
  it("conflict: equipment not owned is excluded", () => {
    const d = run({ library: [W("x", "STRENGTH", 2, "UPPER BODY", ["Barbell"]), W("y", "STRENGTH", 2, "UPPER BODY")] });
    expect(d.workout?.id).toBe("y");
  });
  it("uses the primary goal first and the secondary goal as a tie-breaker", () => {
    const d = run({
      recent: [],
      totalCompleted: 4,
      primaryGoalCategory: "CARDIO",
      secondaryGoalCategory: "STRENGTH",
      library: [W("strength", "STRENGTH", 2), W("cardio", "CARDIO", 2)],
    });
    expect(d.workout?.category).toBe("CARDIO");
  });
  it("never lets a goal override recovery", () => {
    const d = run({ primaryGoalCategory: "STRENGTH", checkin: poorCheckin });
    expect(d.purpose).toBe("recovery");
    expect(d.category).not.toBe("STRENGTH");
  });
  it("uses exhausted post-workout feedback as recovery evidence", () => {
    const recent = [{ ...base.recent[0], feeling: "Exhausted" }];
    const d = run({ recent });
    expect(d.reasonCodes).toContain("feedback.exhausted");
    expect(d.purpose).toBe("recovery");
  });
});
