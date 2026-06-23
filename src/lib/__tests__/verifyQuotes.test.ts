import { describe, it, expect } from "vitest";
import { quoteFound, groundQuotes, clampScore } from "../verifyQuotes";
import type { CriterionVerdict } from "../types";

const transcript =
  "Candidate: I told her I completely understood why she was frustrated, and I'd stay on the line.";

describe("quoteFound", () => {
  it("matches an exact substring", () => {
    expect(quoteFound("completely understood why she was frustrated", transcript)).toBe(true);
  });
  it("matches across smart-quote / whitespace differences", () => {
    expect(quoteFound("I’d stay on the   line", transcript)).toBe(true);
  });
  it("rejects a hallucinated quote", () => {
    expect(quoteFound("I told her to calm down or leave", transcript)).toBe(false);
  });
  it("rejects empty / trivial quotes", () => {
    expect(quoteFound("", transcript)).toBe(false);
    expect(quoteFound("the", transcript)).toBe(false);
  });
});

describe("groundQuotes", () => {
  it("drops invented quotes and flags it", () => {
    const input: CriterionVerdict[] = [
      {
        name: "Empathy",
        score: 5,
        justification: "x",
        quotes: ["completely understood why she was frustrated", "FABRICATED QUOTE"],
      },
    ];
    const { grounded, droppedAny } = groundQuotes(input, transcript);
    expect(grounded[0].quotes).toEqual(["completely understood why she was frustrated"]);
    expect(droppedAny).toBe(true);
  });
});

describe("clampScore", () => {
  it("clamps to 1..5 and handles junk", () => {
    expect(clampScore(9)).toBe(5);
    expect(clampScore(0)).toBe(1);
    expect(clampScore(3)).toBe(3);
    expect(clampScore("nonsense")).toBe(1);
  });
});
