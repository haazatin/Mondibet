import { describe, expect, it } from "vitest";
import { scoreGeneralBonus } from "@/lib/scoring/generalBonus";

const result = {
  championTeamId: "ARG",
  runnerUpTeamId: "BRA",
  topScorerName: "Mina Cohen",
  topScorerGoalCount: 8,
  playerOfTournament: "Lee David",
  highestScoringGroupId: "A",
  lowestScoringGroupId: "B",
  mostGoalsTeamId: "FRA",
  fewestGoalsTeamId: "JPN",
};

describe("scoreGeneralBonus", () => {
  it("scores every resolved general bonus category", () => {
    expect(scoreGeneralBonus(result, result).total).toBe(90);
  });

  it("normalizes text bonus answers", () => {
    expect(
      scoreGeneralBonus(
        {
          topScorerName: "  mina cohen ",
          playerOfTournament: "LEE DAVID",
        },
        result,
      ),
    ).toMatchObject({
      topScorerPoints: 10,
      playerOfTournamentPoints: 10,
      total: 20,
    });
  });

  it("does not include surprise or disappointment scoring", () => {
    const score = scoreGeneralBonus({}, result);

    expect(score).not.toHaveProperty("surprisePoints");
    expect(score).not.toHaveProperty("disappointmentPoints");
    expect(score.total).toBe(0);
  });
});

