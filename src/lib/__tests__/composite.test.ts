import { describe, it, expect } from "vitest";
import {
  bandFor,
  interviewPercent,
  percentOfMax,
  computeComposite,
  BASE_WEIGHTS,
} from "../composite";

describe("bandFor", () => {
  it("maps scores to the right band", () => {
    expect(bandFor(90)).toBe("Strong");
    expect(bandFor(75)).toBe("Strong");
    expect(bandFor(60)).toBe("Recommended");
    expect(bandFor(45)).toBe("Borderline");
    expect(bandFor(10)).toBe("Not recommended");
  });
});

describe("interviewPercent", () => {
  it("maps 1->0, 5->100, averages", () => {
    expect(interviewPercent([1])).toBe(0);
    expect(interviewPercent([5])).toBe(100);
    expect(interviewPercent([5, 3])).toBe(75); // mean 4 -> 75
    expect(interviewPercent([])).toBeNull();
  });
});

describe("percentOfMax", () => {
  it("computes percent / handles missing", () => {
    expect(percentOfMax(9, 12)).toBe(75);
    expect(percentOfMax(null, 12)).toBeNull();
    expect(percentOfMax(9, null)).toBeNull();
  });
});

describe("computeComposite", () => {
  it("weights three components by normalised base weights", () => {
    // all at 100% -> composite 100 regardless of weights
    const r = computeComposite({
      interviewScores: [5],
      skillsScore: 15,
      skillsMax: 15,
      aptitudeScore: 12,
      aptitudeMax: 12,
    });
    expect(r!.composite).toBeCloseTo(100, 5);
    expect(r!.components).toHaveLength(3);
    // weights normalise to 1
    const wsum = r!.components.reduce((s, c) => s + c.weight, 0);
    expect(wsum).toBeCloseTo(1, 5);
  });

  it("applies the validity tilt (interview > skills > aptitude)", () => {
    const r = computeComposite({
      interviewScores: [5], // 100
      skillsScore: 0,
      skillsMax: 15, // 0
      aptitudeScore: 0,
      aptitudeMax: 12, // 0
    });
    // only the interview contributes; its normalised weight * 100
    const expected = (BASE_WEIGHTS.interview /
      (BASE_WEIGHTS.interview + BASE_WEIGHTS.skills + BASE_WEIGHTS.aptitude)) *
      100;
    expect(r!.composite).toBeCloseTo(expected, 5);
  });

  it("re-normalises when only two components are present", () => {
    const r = computeComposite({
      interviewScores: [3], // 50%
      aptitudeScore: 12,
      aptitudeMax: 12, // 100%
    });
    const wI = BASE_WEIGHTS.interview / (BASE_WEIGHTS.interview + BASE_WEIGHTS.aptitude);
    const wA = BASE_WEIGHTS.aptitude / (BASE_WEIGHTS.interview + BASE_WEIGHTS.aptitude);
    expect(r!.composite).toBeCloseTo(wI * 50 + wA * 100, 5);
    expect(r!.components).toHaveLength(2);
  });

  it("falls back to a single component", () => {
    const r = computeComposite({ interviewScores: [3] });
    expect(r!.composite).toBe(50);
    expect(r!.components[0].weight).toBe(1);
  });

  it("returns null when no signal exists", () => {
    expect(computeComposite({})).toBeNull();
  });
});
