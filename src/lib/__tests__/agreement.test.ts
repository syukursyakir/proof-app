import { describe, it, expect } from "vitest";
import { pairScores, agreement } from "../agreement";

describe("pairScores", () => {
  it("matches by criterion name and ignores unmatched", () => {
    const pairs = pairScores(
      [{ name: "Empathy", score: 5 }, { name: "Comms", score: 3 }],
      [{ name: "Empathy", score: 4 }, { name: "Other", score: 1 }],
    );
    expect(pairs).toEqual([{ name: "Empathy", ai: 5, human: 4 }]);
  });
});

describe("agreement", () => {
  it("computes exact / within1 / mae", () => {
    const a = agreement([
      { name: "a", ai: 5, human: 5 }, // exact
      { name: "b", ai: 4, human: 3 }, // within 1
      { name: "c", ai: 5, human: 2 }, // off by 3
    ]);
    expect(a.n).toBe(3);
    expect(a.exact).toBeCloseTo(1 / 3);
    expect(a.within1).toBeCloseTo(2 / 3);
    expect(a.mae).toBeCloseTo((0 + 1 + 3) / 3);
  });
  it("handles empty", () => {
    expect(agreement([])).toEqual({ n: 0, exact: 0, within1: 0, mae: 0 });
  });
});
