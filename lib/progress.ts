import type { LearningLevel } from "./dutch-time.ts";

// What a child has achieved, kept only in this browser's localStorage.
export type SavedProgress = {
  stars: number;
  streak: number;
  unlockedLevel: LearningLevel;
  levelWins: Partial<Record<LearningLevel, number>>;
  seenRondHalfLesson: boolean;
  /**
   * Minute patterns the child finds hard (e.g. 25 = "vijf voor half") with a
   * weight of 1–3. A miss raises it, a first-try hit lowers it, 0 removes it.
   */
  trickyMinutes: Partial<Record<number, number>>;
};

export const DEFAULT_PROGRESS: SavedProgress = {
  stars: 0,
  streak: 0,
  // The supplied worksheet starts at kwartieren; keep earlier skills open for review.
  unlockedLevel: 3,
  levelWins: {},
  seenRondHalfLesson: false,
  trickyMinutes: {},
};

export const WINS_TO_UNLOCK = 3;
const MAX_TRICKY_WEIGHT = 3;
/** How often a tricky pattern is chosen over a random one, when the level has any. */
const TRICKY_CHANCE = 0.4;

export type AnswerResult = {
  level: LearningLevel;
  minute: number;
  correct: boolean;
  /** Right without an earlier wrong try on this clock or question. */
  firstTry: boolean;
  /** Earns a star and a level win (false for retried clocks). */
  rewarded: boolean;
};

export function applyAnswer(progress: SavedProgress, result: AnswerResult): SavedProgress {
  const tricky = { ...progress.trickyMinutes };
  const weight = tricky[result.minute] ?? 0;

  if (!result.correct) {
    tricky[result.minute] = Math.min(MAX_TRICKY_WEIGHT, weight + 1);
    return { ...progress, streak: 0, trickyMinutes: tricky };
  }

  if (result.firstTry && weight > 0) {
    if (weight > 1) tricky[result.minute] = weight - 1;
    else delete tricky[result.minute];
  }
  if (!result.rewarded) return { ...progress, trickyMinutes: tricky };

  const wins = (progress.levelWins[result.level] ?? 0) + 1;
  const unlockedLevel = wins >= WINS_TO_UNLOCK && result.level < 5
    ? Math.max(progress.unlockedLevel, result.level + 1) as LearningLevel
    : progress.unlockedLevel;
  return {
    ...progress,
    stars: progress.stars + 1,
    streak: progress.streak + 1,
    unlockedLevel,
    levelWins: { ...progress.levelWins, [result.level]: wins },
    trickyMinutes: tricky,
  };
}

/** Picks a minute for a new clock, favoring this level's tricky patterns. */
export function pickMinute(
  minutes: number[],
  trickyMinutes: SavedProgress["trickyMinutes"],
  random: () => number = Math.random,
) {
  const tricky = minutes.filter((minute) => (trickyMinutes[minute] ?? 0) > 0);
  if (tricky.length && random() < TRICKY_CHANCE) {
    const total = tricky.reduce((sum, minute) => sum + (trickyMinutes[minute] ?? 0), 0);
    let roll = random() * total;
    for (const minute of tricky) {
      roll -= trickyMinutes[minute] ?? 0;
      if (roll < 0) return minute;
    }
    return tricky[tricky.length - 1];
  }
  return minutes[Math.floor(random() * minutes.length)];
}
