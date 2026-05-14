import type { GroupPositionPrediction, GroupPositionResult } from "@/types/tournament";
import { GROUP_BONUS_POINTS } from "./rules";

export interface GroupBonusScoreBreakdown {
  qualifierPoints: number;
  exactPositionPoints: number;
  perfectGroupPoints: number;
  total: number;
}

const positionKeys = ["firstTeamId", "secondTeamId", "thirdTeamId"] as const;

export function scoreGroupBonus(
  prediction: GroupPositionPrediction,
  result: GroupPositionResult,
): GroupBonusScoreBreakdown {
  const predictedTeams = positionKeys
    .map((key) => prediction[key])
    .filter((teamId): teamId is string => Boolean(teamId));
  const qualifiedTeams = new Set(positionKeys.map((key) => result[key]));

  const qualifierMatches = predictedTeams.filter((teamId) => qualifiedTeams.has(teamId)).length;
  const exactPositionMatches = positionKeys.filter((key) => prediction[key] === result[key]).length;
  const perfectGroup = exactPositionMatches === positionKeys.length;

  const qualifierPoints = qualifierMatches * GROUP_BONUS_POINTS.qualifier;
  const exactPositionPoints = exactPositionMatches * GROUP_BONUS_POINTS.exactPosition;
  const perfectGroupPoints = perfectGroup ? GROUP_BONUS_POINTS.perfectGroup : 0;

  return {
    qualifierPoints,
    exactPositionPoints,
    perfectGroupPoints,
    total: qualifierPoints + exactPositionPoints + perfectGroupPoints,
  };
}

