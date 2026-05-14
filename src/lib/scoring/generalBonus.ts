import type { GeneralBonusPrediction, GeneralBonusResult } from "@/types/tournament";
import { GENERAL_BONUS_POINTS } from "./rules";

export interface GeneralBonusScoreBreakdown {
  championPoints: number;
  runnerUpPoints: number;
  topScorerPoints: number;
  topScorerGoalCountPoints: number;
  playerOfTournamentPoints: number;
  highestScoringGroupPoints: number;
  lowestScoringGroupPoints: number;
  mostGoalsTeamPoints: number;
  fewestGoalsTeamPoints: number;
  total: number;
}

export function scoreGeneralBonus(
  prediction: GeneralBonusPrediction,
  result: GeneralBonusResult,
): GeneralBonusScoreBreakdown {
  const championPoints =
    prediction.championTeamId === result.championTeamId ? GENERAL_BONUS_POINTS.champion : 0;
  const runnerUpPoints =
    prediction.runnerUpTeamId === result.runnerUpTeamId ? GENERAL_BONUS_POINTS.runnerUp : 0;
  const topScorerPoints = sameText(prediction.topScorerName, result.topScorerName)
    ? GENERAL_BONUS_POINTS.topScorer
    : 0;
  const topScorerGoalCountPoints =
    prediction.topScorerGoalCount === result.topScorerGoalCount
      ? GENERAL_BONUS_POINTS.topScorerGoalCount
      : 0;
  const playerOfTournamentPoints = sameText(
    prediction.playerOfTournament,
    result.playerOfTournament,
  )
    ? GENERAL_BONUS_POINTS.playerOfTournament
    : 0;
  const highestScoringGroupPoints =
    prediction.highestScoringGroupId === result.highestScoringGroupId
      ? GENERAL_BONUS_POINTS.highestScoringGroup
      : 0;
  const lowestScoringGroupPoints =
    prediction.lowestScoringGroupId === result.lowestScoringGroupId
      ? GENERAL_BONUS_POINTS.lowestScoringGroup
      : 0;
  const mostGoalsTeamPoints =
    prediction.mostGoalsTeamId === result.mostGoalsTeamId ? GENERAL_BONUS_POINTS.mostGoalsTeam : 0;
  const fewestGoalsTeamPoints =
    prediction.fewestGoalsTeamId === result.fewestGoalsTeamId
      ? GENERAL_BONUS_POINTS.fewestGoalsTeam
      : 0;

  return {
    championPoints,
    runnerUpPoints,
    topScorerPoints,
    topScorerGoalCountPoints,
    playerOfTournamentPoints,
    highestScoringGroupPoints,
    lowestScoringGroupPoints,
    mostGoalsTeamPoints,
    fewestGoalsTeamPoints,
    total:
      championPoints +
      runnerUpPoints +
      topScorerPoints +
      topScorerGoalCountPoints +
      playerOfTournamentPoints +
      highestScoringGroupPoints +
      lowestScoringGroupPoints +
      mostGoalsTeamPoints +
      fewestGoalsTeamPoints,
  };
}

function sameText(left: string | undefined, right: string): boolean {
  return normalizeText(left) === normalizeText(right);
}

function normalizeText(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

