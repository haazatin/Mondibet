import { describe, expect, it } from "vitest";
import { getDailyBettingLockTime, parseIsraelDateTimeLocal } from "@/lib/scoring/deadlines";
import { scoreMatchBet } from "@/lib/scoring/match";
import type { MatchContext } from "@/types/tournament";

const groupContext: MatchContext = {
  stage: "group",
  homeTeamId: "home",
  awayTeamId: "away",
};

const knockoutContext: MatchContext = {
  stage: "round_of_32",
  homeTeamId: "home",
  awayTeamId: "away",
};

describe("scoreMatchBet", () => {
  it("awards group-stage exact score and outcome points", () => {
    expect(
      scoreMatchBet(
        groupContext,
        { predictedHomeScore90: 2, predictedAwayScore90: 1 },
        { homeScore90: 2, awayScore90: 1 },
      ),
    ).toEqual({
      outcomePoints: 5,
      exactScorePoints: 5,
      goalDifferencePoints: 0,
      total: 10,
    });
  });

  it("awards group-stage goal-difference points only with the correct winner", () => {
    expect(
      scoreMatchBet(
        groupContext,
        { predictedHomeScore90: 3, predictedAwayScore90: 1 },
        { homeScore90: 2, awayScore90: 0 },
      ).total,
    ).toBe(7);
  });

  it("does not award goal-difference points for draws", () => {
    expect(
      scoreMatchBet(
        groupContext,
        { predictedHomeScore90: 2, predictedAwayScore90: 2 },
        { homeScore90: 1, awayScore90: 1 },
      ),
    ).toEqual({
      outcomePoints: 5,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      total: 5,
    });
  });

  it("requires the advancing team for knockout draw outcome points", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 1,
          predictedAdvancingTeamId: "home",
        },
        { homeScore90: 1, awayScore90: 1, advancingTeamId: "home" },
      ).total,
    ).toBe(12);
  });

  it("withholds knockout draw outcome points when advancing team is wrong", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 1,
          predictedAdvancingTeamId: "away",
        },
        { homeScore90: 1, awayScore90: 1, advancingTeamId: "home" },
      ).total,
    ).toBe(6);
  });
});

describe("getDailyBettingLockTime", () => {
  it("locks at noon when first kickoff is after noon", () => {
    const matchDay = new Date("2026-06-12T00:00:00+03:00");
    const lock = getDailyBettingLockTime(
      [{ startsAt: new Date("2026-06-12T18:00:00+03:00") }],
      matchDay,
    );

    expect(lock.toISOString()).toBe("2026-06-12T09:00:00.000Z");
  });

  it("locks at first kickoff when it is before noon", () => {
    const matchDay = new Date("2026-06-12T00:00:00+03:00");
    const lock = getDailyBettingLockTime(
      [
        { startsAt: new Date("2026-06-12T15:00:00+03:00") },
        { startsAt: new Date("2026-06-12T11:00:00+03:00") },
      ],
      matchDay,
    );

    expect(lock.toISOString()).toBe("2026-06-12T08:00:00.000Z");
  });

  it("parses admin kickoff input as Israel wall time", () => {
    const kickoff = parseIsraelDateTimeLocal("2026-06-12T21:30");

    expect(kickoff?.toISOString()).toBe("2026-06-12T18:30:00.000Z");
  });
});
