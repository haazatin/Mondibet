export type TournamentStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export type MatchOutcome = "home" | "away" | "draw";

export type TeamId = string;
export type ParticipantId = string;
export type MatchId = string;
export type GroupId = string;

export interface MatchResult {
  homeScore90: number;
  awayScore90: number;
  advancingTeamId?: TeamId;
}

export interface MatchBet {
  predictedHomeScore90: number;
  predictedAwayScore90: number;
  predictedAdvancingTeamId?: TeamId;
}

export interface MatchContext {
  stage: TournamentStage;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
}

export interface GroupPositionPrediction {
  firstTeamId?: TeamId;
  secondTeamId?: TeamId;
  thirdTeamId?: TeamId;
}

export interface GroupPositionResult {
  firstTeamId: TeamId;
  secondTeamId: TeamId;
  thirdTeamId: TeamId;
}

export interface GeneralBonusPrediction {
  championTeamId?: TeamId;
  runnerUpTeamId?: TeamId;
  topScorerName?: string;
  topScorerGoalCount?: number;
  playerOfTournament?: string;
  highestScoringGroupId?: GroupId;
  lowestScoringGroupId?: GroupId;
  mostGoalsTeamId?: TeamId;
  fewestGoalsTeamId?: TeamId;
}

export interface GeneralBonusResult {
  championTeamId: TeamId;
  runnerUpTeamId: TeamId;
  topScorerName: string;
  topScorerGoalCount: number;
  playerOfTournament: string;
  highestScoringGroupId: GroupId;
  lowestScoringGroupId: GroupId;
  mostGoalsTeamId: TeamId;
  fewestGoalsTeamId: TeamId;
}
