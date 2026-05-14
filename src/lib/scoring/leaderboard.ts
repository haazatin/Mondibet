import type { ParticipantId } from "@/types/tournament";

export interface ParticipantScoreInput {
  participantId: ParticipantId;
  groupStagePoints: number;
  knockoutPoints: number;
  bonusPoints: number;
  streakPoints: number;
  predictedChampionCorrect: boolean;
}

export interface LeaderboardRow extends ParticipantScoreInput {
  rank: number;
  totalPoints: number;
}

export function buildLeaderboard(scores: ParticipantScoreInput[]): LeaderboardRow[] {
  const rows = scores
    .map((score) => ({
      ...score,
      totalPoints:
        score.groupStagePoints + score.knockoutPoints + score.bonusPoints + score.streakPoints,
    }))
    .sort(compareLeaderboardRows);

  return rows.map((row, index, sortedRows) => ({
    ...row,
    rank: getCompetitionRank(row, index, sortedRows),
  }));
}

function compareLeaderboardRows(left: Omit<LeaderboardRow, "rank">, right: Omit<LeaderboardRow, "rank">) {
  return (
    right.totalPoints - left.totalPoints ||
    Number(right.predictedChampionCorrect) - Number(left.predictedChampionCorrect) ||
    right.knockoutPoints - left.knockoutPoints ||
    left.participantId.localeCompare(right.participantId)
  );
}

function getCompetitionRank(
  row: Omit<LeaderboardRow, "rank">,
  index: number,
  sortedRows: Omit<LeaderboardRow, "rank">[],
): number {
  const firstSameScoreIndex = sortedRows.findIndex(
    (candidate) =>
      candidate.totalPoints === row.totalPoints &&
      candidate.predictedChampionCorrect === row.predictedChampionCorrect &&
      candidate.knockoutPoints === row.knockoutPoints,
  );

  return firstSameScoreIndex + 1 || index + 1;
}

