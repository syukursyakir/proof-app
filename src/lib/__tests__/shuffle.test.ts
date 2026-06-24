import { describe, it, expect } from "vitest";
import { shuffleMcqOptions } from "../shuffle";
import type { TestQuestion } from "../types";

const q: TestQuestion = {
  id: "q1",
  category: "numerical",
  question: "2 + 2?",
  options: ["3", "4", "5", "6"],
  correct: 1, // "4"
};

describe("shuffleMcqOptions", () => {
  it("always keeps the correct option pointing at the right text", () => {
    for (let i = 0; i < 200; i++) {
      const s = shuffleMcqOptions(q);
      expect(s.options).toHaveLength(4);
      expect(s.options[s.correct]).toBe("4");
      expect([...s.options].sort()).toEqual(["3", "4", "5", "6"]);
    }
  });

  it("actually varies the correct position across runs", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 200; i++) positions.add(shuffleMcqOptions(q).correct);
    // With 200 shuffles, all 4 positions should appear.
    expect(positions.size).toBe(4);
  });
});
