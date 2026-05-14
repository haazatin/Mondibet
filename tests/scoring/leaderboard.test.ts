import { describe, expect, it } from "vitest";
import type { ParticipantScoreInput } from "@/lib/scoring/leaderboard";
import { buildLeaderboard } from "@/lib/scoring/leaderboard";

describe("buildLeaderboard", () => {
  it("sorts by total points first", () => {
    expect(
      buildLeaderboard([
        baseScore("B", { groupStagePoints: 5 }),
        baseScore("A", { groupStagePoints: 10 }),
      ]).map((row) => row.participantId),
    ).toEqual(["A", "B"]);
  });

  it("uses champion prediction and knockout points as tie-breakers", () => {
    expect(
      buildLeaderboard([
        baseScore("A", { knockoutPoints: 20, bonusPoints: 80, predictedChampionCorrect: false }),
        baseScore("B", { knockoutPoints: 10, bonusPoints: 90, predictedChampionCorrect: true }),
        baseScore("C", { knockoutPoints: 30, bonusPoints: 70, predictedChampionCorrect: false }),
      ]).map((row) => row.participantId),
    ).toEqual(["B", "C", "A"]);
  });

  it("assigns shared competition ranks when tie-breakers are still equal", () => {
    expect(
      buildLeaderboard([
        baseScore("A", { groupStagePoints: 10 }),
        baseScore("B", { groupStagePoints: 10 }),
        baseScore("C", { groupStagePoints: 5 }),
      ]).map((row) => ({ id: row.participantId, rank: row.rank })),
    ).toEqual([
      { id: "A", rank: 1 },
      { id: "B", rank: 1 },
      { id: "C", rank: 3 },
    ]);
  });
});

function baseScore(
  participantId: string,
  overrides: Partial<ParticipantScoreInput> = {},
): ParticipantScoreInput {
  return {
    participantId,
    groupStagePoints: 0,
    knockoutPoints: 0,
    bonusPoints: 0,
    streakPoints: 0,
    predictedChampionCorrect: false,
    ...overrides,
  };
}
