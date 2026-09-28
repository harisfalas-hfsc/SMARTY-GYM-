import type {
  ConfidenceState,
  LoadState,
  ReadinessState,
} from "@/lib/performance/types";

/** Everything the rules engine is allowed to look at. No network, no AI. */
export type CoachContext = {
  /**
   * The difficulty the USER selected (1-3 stars). Never treated as evidence.
   * null on context-only paths such as the Workout of the Day, where no
   * difficulty is being chosen and no star recommendation may be produced.
   */
  selectedStars: number | null;
  category: string | null;
  format: string | null;
  confidence: ConfidenceState;
  readiness: ReadinessState;
  readinessReason: string;
  strengthLoad: LoadState;
  conditioningLoad: LoadState;
  overallLoad: LoadState;
  sessionsLast7: number;
  consecutiveDays: number;
  loggedSessions: number;
  /** Exercises that met their prescription in 3 comparable sessions. */
  progressionReady: string[];
  /** Sessions where logged reps fell short of the prescription. */
  recentShortfalls: number;
  /** Today's / yesterday's Smarty Check-in answers, when the member gave them. */
  checkin?: CheckinSignal | null;
};

export type CheckinSignal = {
  sleepHours: number | null;
  sleepQuality: number | null;
  readiness: number | null;
  soreness: number | null;
  mood: number | null;
  /** Yesterday evening's reported day strain (0-10) and daily score. */
  yesterdayStrain: number | null;
  yesterdayScore: number | null;
};

export type CoachRecommendation = {
  id: string;
  /** One sentence, always in 1 / 2 / 3 stars when it mentions difficulty. */
  message: string;
  reason: string;
  /**
   * A star suggestion is only ever produced from demonstrated performance.
   * null means "no star recommendation" — the user's selection stands.
   */
  suggestedStars: number | null;
  priority: number;
};
