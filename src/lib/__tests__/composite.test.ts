import { describe, it, expect } from "vitest";
import {
  bandFor,
  interviewPercent,
  aptitudePercent,
  computeComposite,
  INTERVIEW_WEIGHT,
  APTITUDE_WEIGHT,
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
  it("maps 1->0 and 5->100", () => {
    expect(interviewPercent([1])).toBe(0);
    expect(interviewPercent([5])).toBe(100);
    expect(interviewPercent([3])).toBe(50);
  });
  it("averages multiple criteria", () => {
    expect(interviewPercent([5, 3])).toBe(75); // mean 4 -> 75
  });
  it("returns null when empty", () => {
    expect(interviewPercent([])).toBeNull();
  });
});

describe("aptitudePercent", () => {
  it("computes percent of max", () => {
    expect(aptitudePercent(9, 12)).toBe(75);
    expect(aptitudePercent(6, 12)).toBe(50);
  });
  it("returns null without data", () => {
    expect(aptitudePercent(null, 12)).toBeNull();
    expect(aptitudePercent(9, null)).toBeNull();
  });
});

describe("computeComposite", () => {
  it("weights interview 60 / aptitude 40 when both present", () => {
    // interview mean 5 -> 100%, aptitude 6/12 -> 50%
    const r = computeComposite([5, 5], 6, 12);
    expect(r).not.toBeNull();
    expect(r!.composite).toBeCloseTo(0.6 * 100 + 0.4 * 50, 5); // 80
    expect(r!.band).toBe("Strong");
    expect(r!.weights).toEqual({ interview: INTERVIEW_WEIGHT, aptitude: APTITUDE_WEIGHT });
  });

  it("falls back to interview-only when no aptitude", () => {
    const r = computeComposite([3, 3], null, null); // 50%
    expect(r!.composite).toBe(50);
    expect(r!.weights).toEqual({ interview: 1, aptitude: 0 });
  });

  it("falls back to aptitude-only when no interview", () => {
    const r = computeComposite([], 12, 12); // 100%
    expect(r!.composite).toBe(100);
    expect(r!.weights).toEqual({ interview: 0, aptitude: 1 });
  });

  it("returns null when neither signal exists", () => {
    expect(computeComposite([], null, null)).toBeNull();
  });
});
