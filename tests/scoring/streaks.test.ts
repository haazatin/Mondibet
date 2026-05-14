import { describe, expect, it } from "vitest";
import { scoreStreakBonuses } from "@/lib/scoring/streaks";

describe("scoreStreakBonuses", () => {
  it("awards one 3-streak bonus for three correct outcomes", () => {
    expect(scoreStreakBonuses([true, true, true])).toEqual({
      streaksOfThree: 1,
      streaksOfFive: 0,
      total: 5,
    });
  });

  it("awards only the 5-streak bonus for five correct outcomes", () => {
    expect(scoreStreakBonuses([true, true, true, true, true])).toEqual({
      streaksOfThree: 0,
      streaksOfFive: 1,
      total: 10,
    });
  });

  it("scores completed streaks separated by misses", () => {
    expect(scoreStreakBonuses([true, true, true, false, true, true, true, true, true])).toEqual({
      streaksOfThree: 1,
      streaksOfFive: 1,
      total: 15,
    });
  });
});

