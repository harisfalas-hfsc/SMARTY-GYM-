// Readiness = how ready the member is to train RIGHT NOW.
//
// It is a live, moment-in-time value, never an average. It starts from fully
// ready (10/10) and is lowered only by real evidence:
//   1. Residual fatigue from each completed workout, largest straight after the
//      session and fading as hours pass (half-life RECOVERY_HALF_LIFE_H).
//   2. Today's morning Check-in: soreness, short/poor sleep and a low
//      self-rated readiness.
//   3. Many consecutive training days.
// No recent training and no Check-in means the member is rested: Ready.
// It is a training-management indicator, not a medical assessment.

import type { ReadinessState } from "./types";

export type ReadinessSession = {
  name: string;
  completedAt: string;
  durationMin: number | null;
  /** Logged effort 1–10 when the member gave one. */
  rpe: number | null;
  difficultyStars: number | null;
  category: string | null;
};

export type ReadinessCheckin = {
  sleepHours: number | null;
  /** 1–5 */
  sleepQuality: number | null;
  /** Self-rated 0–10 */
  readiness: number | null;
  /** 0 (none) – 10 (very sore) */
  soreness: number | null;
} | null;

export type LiveReadiness = {
  score: number;
  state: ReadinessState;
  reason: string;
  factors: string[];
  computedAt: string;
};

/** Hours for half of a session's fatigue to clear. */
export const RECOVERY_HALF_LIFE_H = 12;
/** Fatigue older than this is treated as fully cleared. */
export const RECOVERY_WINDOW_H = 72;

const LIGHT: Record<string, number> = { RECOVERY: 2, "MOBILITY & STABILITY": 3 };

function sessionEffort(s: ReadinessSession) {
  const stars = s.difficultyStars ?? 2;
  let effort = s.rpe !== null && s.rpe > 0 ? s.rpe : stars >= 3 ? 7.5 : stars === 2 ? 6.5 : 5;
  const cap = s.category ? LIGHT[s.category.toUpperCase()] : undefined;
  if (cap !== undefined) effort = Math.min(effort, cap);
  return Math.max(0, Math.min(10, effort));
}

/** Fatigue a session leaves immediately after it ends (0–~13). */
export function sessionFatigue(s: ReadinessSession) {
  const minutes = Math.max(10, Math.min(120, s.durationMin ?? 45));
  return sessionEffort(s) * Math.min(minutes / 45, 1.5);
}

function hoursAgoText(h: number) {
  if (h < 1) return "less than an hour ago";
  if (h < 24) return `${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function sleepScore(hours: number | null, quality: number | null) {
  if (hours === null && quality === null) return null;
  const h = hours === null ? null : hours < 5 ? 2 : hours < 6 ? 4 : hours < 7 ? 7 : hours <= 9 ? 10 : 7;
  const q = quality === null ? null : ({ 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 } as Record<number, number>)[quality] ?? 6;
  if (h === null) return q;
  if (q === null) return h;
  return (h + q) / 2;
}

export function stateForScore(score: number): ReadinessState {
  if (score >= 8) return "Ready";
  if (score >= 6) return "Moderate";
  if (score >= 4) return "Caution";
  return "Recovery Recommended";
}

export function liveReadiness(input: {
  now: Date;
  sessions: ReadinessSession[];
  checkin: ReadinessCheckin;
  consecutiveDays: number;
}): LiveReadiness {
  const nowMs = input.now.getTime();
  let fatigue = 0;
  let main: { s: ReadinessSession; f: number; h: number } | null = null;
  for (const s of input.sessions) {
    const h = (nowMs - new Date(s.completedAt).getTime()) / 3_600_000;
    if (!Number.isFinite(h) || h < 0 || h > RECOVERY_WINDOW_H) continue;
    const f = sessionFatigue(s) * Math.pow(0.5, h / RECOVERY_HALF_LIFE_H);
    fatigue += f;
    if (!main || f > main.f) main = { s, f, h };
  }

  const factors: string[] = [];
  if (main && main.f >= 0.5) {
    factors.push(`${main.s.name} finished ${hoursAgoText(main.h)} — your body is still recovering.`);
  }

  let checkinPenalty = 0;
  const c = input.checkin;
  if (c) {
    if (c.soreness !== null && c.soreness > 3) {
      checkinPenalty += (c.soreness - 3) * 0.5;
      factors.push(`Soreness ${c.soreness}/10 in today's Check-in.`);
    }
    const sleep = sleepScore(c.sleepHours, c.sleepQuality);
    if (sleep !== null && sleep < 7) {
      checkinPenalty += (7 - sleep) * 0.4;
      factors.push("Short or poor sleep last night.");
    }
    if (c.readiness !== null && c.readiness < 7) {
      checkinPenalty += (7 - c.readiness) * 0.5;
      factors.push(`You rated yourself ${c.readiness}/10 this morning.`);
    }
    checkinPenalty = Math.min(5, checkinPenalty);
  }

  let streakPenalty = 0;
  if (input.consecutiveDays >= 6) {
    streakPenalty = 2;
    factors.push(`${input.consecutiveDays} training days in a row.`);
  }

  const score = Math.max(0, Math.min(10, Math.round(10 - fatigue - checkinPenalty - streakPenalty)));
  const state = stateForScore(score);
  let reason: string;
  if (factors.length) reason = factors.join(" ");
  else if (input.sessions.length) reason = "Your last workout's fatigue has cleared — you're fully recovered and ready to train.";
  else reason = "No recent training load — you're rested and ready to train.";
  return { score, state, reason, factors, computedAt: input.now.toISOString() };
}
