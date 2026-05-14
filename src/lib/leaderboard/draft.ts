export interface ParticipantSummary {
  id: string;
  displayName: string;
}

export interface ScoreEventSummary {
  participant_id: string;
  category: string;
  points: number;
}

export interface DraftLeaderboardRow {
  participantId: string;
  displayName: string;
  rank: number;
  totalPoints: number;
  groupStagePoints: number;
  knockoutPoints: number;
  bonusPoints: number;
  streakPoints: number;
}

export function buildDraftLeaderboard({
  participants,
  scoreEvents,
}: {
  participants: ParticipantSummary[];
  scoreEvents: ScoreEventSummary[];
}): DraftLeaderboardRow[] {
  const pointsByParticipant = new Map<string, Omit<DraftLeaderboardRow, "rank" | "displayName">>();

  for (const participant of participants) {
    pointsByParticipant.set(participant.id, {
      participantId: participant.id,
      totalPoints: 0,
      groupStagePoints: 0,
      knockoutPoints: 0,
      bonusPoints: 0,
      streakPoints: 0,
    });
  }

  for (const event of scoreEvents) {
    const row = pointsByParticipant.get(event.participant_id);

    if (!row) {
      continue;
    }

    row.totalPoints += event.points;

    if (event.category === "streak") {
      row.streakPoints += event.points;
    } else if (event.category.includes("bonus")) {
      row.bonusPoints += event.points;
    } else {
      row.groupStagePoints += event.points;
    }
  }

  const participantNames = new Map(participants.map((participant) => [participant.id, participant.displayName]));
  const sortedRows = [...pointsByParticipant.values()].sort(
    (left, right) =>
      right.totalPoints - left.totalPoints || left.participantId.localeCompare(right.participantId),
  );

  return sortedRows.map((row, index, rows) => ({
    ...row,
    displayName: participantNames.get(row.participantId) ?? "Participant",
    rank: getCompetitionRank(row.totalPoints, index, rows),
  }));
}

function getCompetitionRank(
  totalPoints: number,
  index: number,
  rows: Omit<DraftLeaderboardRow, "rank" | "displayName">[],
): number {
  const firstSameScoreIndex = rows.findIndex((row) => row.totalPoints === totalPoints);
  return firstSameScoreIndex + 1 || index + 1;
}
