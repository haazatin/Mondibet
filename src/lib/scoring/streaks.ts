import { STREAK_BONUS_POINTS } from "./rules";

export interface StreakScoreBreakdown {
  streaksOfThree: number;
  streaksOfFive: number;
  total: number;
}

export function scoreStreakBonuses(correctOutcomes: boolean[]): StreakScoreBreakdown {
  let streaksOfThree = 0;
  let streaksOfFive = 0;
  let currentRun = 0;

  for (const correct of correctOutcomes) {
    if (correct) {
      currentRun += 1;
      continue;
    }

    const scored = scoreCompletedRun(currentRun);
    streaksOfThree += scored.streaksOfThree;
    streaksOfFive += scored.streaksOfFive;
    currentRun = 0;
  }

  const scored = scoreCompletedRun(currentRun);
  streaksOfThree += scored.streaksOfThree;
  streaksOfFive += scored.streaksOfFive;

  return {
    streaksOfThree,
    streaksOfFive,
    total: streaksOfThree * STREAK_BONUS_POINTS.three + streaksOfFive * STREAK_BONUS_POINTS.five,
  };
}

function scoreCompletedRun(length: number): Omit<StreakScoreBreakdown, "total"> {
  const streaksOfFive = Math.floor(length / 5);
  const remainder = length % 5;
  const streaksOfThree = remainder >= 3 ? 1 : 0;

  return { streaksOfThree, streaksOfFive };
}

