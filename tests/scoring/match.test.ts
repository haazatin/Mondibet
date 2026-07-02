import { describe, expect, it } from "vitest";
import { getMatchBettingLockTime, parseIsraelDateTimeLocal } from "@/lib/scoring/deadlines";
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
      advancingTeamPoints: 0,
      streakCorrect: true,
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
      advancingTeamPoints: 0,
      streakCorrect: true,
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

  it("awards knockout outcome points when a predicted draw selects the actual 90-minute winner", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 1,
          predictedAdvancingTeamId: "home",
        },
        { homeScore90: 2, awayScore90: 1 },
      ),
    ).toEqual({
      outcomePoints: 6,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      advancingTeamPoints: 0,
      streakCorrect: true,
      total: 6,
    });
  });

  it("does not award extra knockout points when a draw prediction selects the actual winner", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 1,
          predictedAdvancingTeamId: "home",
        },
        { homeScore90: 3, awayScore90: 1 },
      ),
    ).toEqual({
      outcomePoints: 6,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      advancingTeamPoints: 0,
      streakCorrect: true,
      total: 6,
    });
  });

  it("withholds knockout draw prediction points when the selected advancing team loses in 90 minutes", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 1,
          predictedAdvancingTeamId: "away",
        },
        { homeScore90: 2, awayScore90: 1 },
      ).total,
    ).toBe(0);
  });

  it("awards two points and streak credit when a predicted knockout winner advances after a 90-minute draw", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 0,
        },
        { homeScore90: 1, awayScore90: 1, advancingTeamId: "home" },
      ),
    ).toEqual({
      outcomePoints: 0,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      advancingTeamPoints: 2,
      streakCorrect: true,
      total: 2,
    });
  });

  it("withholds advancing-team credit when the predicted knockout winner loses after a 90-minute draw", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 0,
        },
        { homeScore90: 1, awayScore90: 1, advancingTeamId: "away" },
      ),
    ).toEqual({
      outcomePoints: 0,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      advancingTeamPoints: 0,
      streakCorrect: false,
      total: 0,
    });
  });

  it("does not award advancing-team credit when the actual knockout result is not a draw", () => {
    expect(
      scoreMatchBet(
        knockoutContext,
        {
          predictedHomeScore90: 1,
          predictedAwayScore90: 0,
        },
        { homeScore90: 2, awayScore90: 0 },
      ),
    ).toEqual({
      outcomePoints: 6,
      exactScorePoints: 0,
      goalDifferencePoints: 0,
      advancingTeamPoints: 0,
      streakCorrect: true,
      total: 6,
    });
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

describe("getMatchBettingLockTime", () => {
  it("locks seven hours before kickoff", () => {
    const lock = getMatchBettingLockTime(new Date("2026-06-12T18:00:00+03:00"));

    expect(lock.toISOString()).toBe("2026-06-12T08:00:00.000Z");
  });

  it("can lock on the previous Israel date for early kickoffs", () => {
    const lock = getMatchBettingLockTime(new Date("2026-06-12T05:00:00+03:00"));

    expect(lock.toISOString()).toBe("2026-06-11T19:00:00.000Z");
  });

  it("parses admin kickoff input as Israel wall time", () => {
    const kickoff = parseIsraelDateTimeLocal("2026-06-12T21:30");

    expect(kickoff?.toISOString()).toBe("2026-06-12T18:30:00.000Z");
  });
});
