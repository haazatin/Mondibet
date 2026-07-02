import type { MatchBet, MatchContext, MatchOutcome, MatchResult } from "@/types/tournament";
import { GROUP_STAGE_POINTS, KNOCKOUT_STAGE_POINTS } from "./rules";

export interface MatchScoreBreakdown {
  outcomePoints: number;
  exactScorePoints: number;
  goalDifferencePoints: number;
  advancingTeamPoints: number;
  streakCorrect: boolean;
  total: number;
}

export function scoreMatchBet(
  context: MatchContext,
  bet: MatchBet,
  result: MatchResult,
): MatchScoreBreakdown {
  const exactScore =
    bet.predictedHomeScore90 === result.homeScore90 &&
    bet.predictedAwayScore90 === result.awayScore90;

  const outcomeCorrect = isOutcomeCorrect(context, bet, result);
  const points =
    context.stage === "group" ? GROUP_STAGE_POINTS : KNOCKOUT_STAGE_POINTS[context.stage];
  const advancingTeamCreditCorrect = isAdvancingTeamCreditCorrect(context, bet, result);

  const exactScorePoints = exactScore ? points.exactScore : 0;
  const outcomePoints = outcomeCorrect ? points.outcome : 0;
  const goalDifferencePoints =
    outcomeCorrect &&
    !exactScore &&
    betOutcome(bet) !== "draw" &&
    isGoalDifferenceCorrect(bet, result) &&
    resultOutcome(result) !== "draw"
      ? points.goalDifference
      : 0;
  const advancingTeamPoints = advancingTeamCreditCorrect ? 2 : 0;
  const streakCorrect = outcomeCorrect || advancingTeamCreditCorrect;

  return {
    outcomePoints,
    exactScorePoints,
    goalDifferencePoints,
    advancingTeamPoints,
    streakCorrect,
    total: outcomePoints + exactScorePoints + goalDifferencePoints + advancingTeamPoints,
  };
}

export function resultOutcome(result: MatchResult): MatchOutcome {
  if (result.homeScore90 > result.awayScore90) {
    return "home";
  }

  if (result.awayScore90 > result.homeScore90) {
    return "away";
  }

  return "draw";
}

export function betOutcome(bet: MatchBet): MatchOutcome {
  if (bet.predictedHomeScore90 > bet.predictedAwayScore90) {
    return "home";
  }

  if (bet.predictedAwayScore90 > bet.predictedHomeScore90) {
    return "away";
  }

  return "draw";
}

function isOutcomeCorrect(context: MatchContext, bet: MatchBet, result: MatchResult): boolean {
  const actualOutcome = resultOutcome(result);
  const predictedOutcome = betOutcome(bet);

  if (context.stage === "group") {
    return actualOutcome === predictedOutcome;
  }

  if (predictedOutcome === "draw") {
    const actualAdvancingTeamId = getActualAdvancingTeamId(context, result, actualOutcome);

    return Boolean(
      actualAdvancingTeamId && bet.predictedAdvancingTeamId === actualAdvancingTeamId,
    );
  }

  return actualOutcome === predictedOutcome;
}

function isGoalDifferenceCorrect(bet: MatchBet, result: MatchResult): boolean {
  return (
    bet.predictedHomeScore90 - bet.predictedAwayScore90 ===
    result.homeScore90 - result.awayScore90
  );
}

function isAdvancingTeamCreditCorrect(
  context: MatchContext,
  bet: MatchBet,
  result: MatchResult,
): boolean {
  if (context.stage === "group") {
    return false;
  }

  const predictedOutcome = betOutcome(bet);
  const actualOutcome = resultOutcome(result);

  if (predictedOutcome === "draw" || actualOutcome !== "draw") {
    return false;
  }

  const predictedTeamId = predictedOutcome === "home" ? context.homeTeamId : context.awayTeamId;

  return Boolean(result.advancingTeamId && result.advancingTeamId === predictedTeamId);
}

function getActualAdvancingTeamId(
  context: MatchContext,
  result: MatchResult,
  actualOutcome: MatchOutcome,
): string | undefined {
  if (actualOutcome === "home") {
    return context.homeTeamId;
  }

  if (actualOutcome === "away") {
    return context.awayTeamId;
  }

  return result.advancingTeamId;
}
