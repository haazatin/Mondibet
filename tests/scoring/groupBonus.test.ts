import { describe, expect, it } from "vitest";
import { scoreGroupBonus } from "@/lib/scoring/groupBonus";

const result = {
  firstTeamId: "A",
  secondTeamId: "B",
  thirdTeamId: "C",
};

describe("scoreGroupBonus", () => {
  it("awards qualifier, exact position, and perfect-group points", () => {
    expect(scoreGroupBonus(result, result)).toEqual({
      qualifierPoints: 9,
      exactPositionPoints: 6,
      perfectGroupPoints: 10,
      total: 25,
    });
  });

  it("awards qualifier points without exact-position points when order is wrong", () => {
    expect(
      scoreGroupBonus(
        {
          firstTeamId: "B",
          secondTeamId: "A",
          thirdTeamId: "C",
        },
        result,
      ),
    ).toEqual({
      qualifierPoints: 9,
      exactPositionPoints: 2,
      perfectGroupPoints: 0,
      total: 11,
    });
  });

  it("does not score best third-place qualifiers separately", () => {
    expect(
      scoreGroupBonus(
        {
          firstTeamId: "D",
          secondTeamId: "E",
          thirdTeamId: "F",
        },
        result,
      ).total,
    ).toBe(0);
  });
});

