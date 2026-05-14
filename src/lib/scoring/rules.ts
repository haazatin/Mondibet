import type { TournamentStage } from "@/types/tournament";

export const GROUP_STAGE_POINTS = {
  outcome: 5,
  exactScore: 5,
  goalDifference: 2,
} as const;

export const KNOCKOUT_STAGE_POINTS: Record<
  Exclude<TournamentStage, "group">,
  { outcome: number; exactScore: number; goalDifference: number }
> = {
  round_of_32: { outcome: 6, exactScore: 6, goalDifference: 2 },
  round_of_16: { outcome: 7, exactScore: 7, goalDifference: 2 },
  quarterfinal: { outcome: 8, exactScore: 8, goalDifference: 2 },
  semifinal: { outcome: 10, exactScore: 10, goalDifference: 2 },
  final: { outcome: 15, exactScore: 15, goalDifference: 2 },
} as const;

export const GENERAL_BONUS_POINTS = {
  champion: 25,
  runnerUp: 15,
  topScorer: 10,
  topScorerGoalCount: 10,
  playerOfTournament: 10,
  highestScoringGroup: 5,
  lowestScoringGroup: 5,
  mostGoalsTeam: 5,
  fewestGoalsTeam: 5,
} as const;

export const GROUP_BONUS_POINTS = {
  qualifier: 3,
  exactPosition: 2,
  perfectGroup: 10,
} as const;

export const STREAK_BONUS_POINTS = {
  three: 5,
  five: 10,
} as const;

