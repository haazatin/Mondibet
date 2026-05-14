import type { MatchBet, MatchContext, MatchOutcome, MatchResult } from "@/types/tournament";
import { GROUP_STAGE_POINTS, KNOCKOUT_STAGE_POINTS } from "./rules";

export interface MatchScoreBreakdown {
  outcomePoints: number;
  exactScorePoints: number;
  goalDifferencePoints: number;
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

  const exactScorePoints = exactScore ? points.exactScore : 0;
  const outcomePoints = outcomeCorrect ? points.outcome : 0;
  const goalDifferencePoints =
    outcomeCorrect && !exactScore && isGoalDifferenceCorrect(bet, result) && resultOutcome(result) !== "draw"
      ? points.goalDifference
      : 0;

  return {
    outcomePoints,
    exactScorePoints,
    goalDifferencePoints,
    total: outcomePoints + exactScorePoints + goalDifferencePoints,
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

  if (actualOutcome !== predictedOutcome) {
    return false;
  }

  if (context.stage === "group" || actualOutcome !== "draw") {
    return true;
  }

  return Boolean(result.advancingTeamId && bet.predictedAdvancingTeamId === result.advancingTeamId);
}

function isGoalDifferenceCorrect(bet: MatchBet, result: MatchResult): boolean {
  return (
    bet.predictedHomeScore90 - bet.predictedAwayScore90 ===
    result.homeScore90 - result.awayScore90
  );
}

