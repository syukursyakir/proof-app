// Composite scoring — combines the aptitude (cognitive) and interview
// (structured/behavioral) signals into one defensible recommendation.
//
// Methodology (grounded in selection-science research):
//  - MECHANICAL combination, never holistic. Statistical combination of
//    predictors beats expert holistic judgment by >50% validity
//    (Kuncel et al. 2013).
//  - COMPENSATORY model: a strong interview can offset a weaker aptitude
//    score and vice-versa (Ock & Oswald 2018). The aptitude test is a soft
//    screen, not a hard cognitive cutoff — a high cognitive hurdle is the
//    single biggest adverse-impact risk (cognitive d≈1.0 vs interview d≈.23).
//  - WEIGHTS: a mild validity-proportional tilt toward the interview, since
//    structured interviews (ρ≈.42, Sackett et al. 2022) out-predict cognitive
//    ability (ρ≈.31). Unit weighting (50/50) is the safe default absent local
//    validation data (Wainer 1976); we use 60/40 as a justified mild tilt.
//  - Both predictors are normalised to a common 0–100 scale before weighting
//    so the larger-range predictor can't silently dominate the composite.
//
// NOTE: true z-score standardisation needs a norm group (candidate pool mean
// + SD) which a fresh deployment doesn't have. Percent-of-max is the honest
// interim; swap in z-scores once a baseline pool exists.

export const INTERVIEW_WEIGHT = 0.6;
export const APTITUDE_WEIGHT = 0.4;

export type CompositeBand =
  | "Strong"
  | "Recommended"
  | "Borderline"
  | "Not recommended";

export type CompositeResult = {
  composite: number; // 0–100
  band: CompositeBand;
  aptitudePct: number | null; // 0–100, null if no aptitude test
  interviewPct: number | null; // 0–100, null if no interview scores
  weights: { interview: number; aptitude: number };
};

export function bandFor(score: number): CompositeBand {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Recommended";
  if (score >= 40) return "Borderline";
  return "Not recommended";
}

// Mean interview rating (1–5) -> 0–100. A rating of 1 maps to 0, 5 maps to 100.
export function interviewPercent(criterionScores: number[]): number | null {
  if (!criterionScores.length) return null;
  const mean =
    criterionScores.reduce((s, n) => s + n, 0) / criterionScores.length;
  return ((mean - 1) / 4) * 100;
}

export function aptitudePercent(
  score: number | null | undefined,
  max: number | null | undefined,
): number | null {
  if (score == null || !max) return null;
  return (score / max) * 100;
}

export function computeComposite(
  interviewScores: number[],
  aptitudeScore: number | null | undefined,
  aptitudeMax: number | null | undefined,
): CompositeResult | null {
  const interviewPct = interviewPercent(interviewScores);
  const aptitudePct = aptitudePercent(aptitudeScore, aptitudeMax);

  // Re-normalise weights to whichever components are present, so a candidate
  // with only an interview (no aptitude test configured) still gets a composite.
  let composite: number;
  let weights = { interview: INTERVIEW_WEIGHT, aptitude: APTITUDE_WEIGHT };

  if (interviewPct != null && aptitudePct != null) {
    composite = INTERVIEW_WEIGHT * interviewPct + APTITUDE_WEIGHT * aptitudePct;
  } else if (interviewPct != null) {
    composite = interviewPct;
    weights = { interview: 1, aptitude: 0 };
  } else if (aptitudePct != null) {
    composite = aptitudePct;
    weights = { interview: 0, aptitude: 1 };
  } else {
    return null;
  }

  return {
    composite,
    band: bandFor(composite),
    aptitudePct,
    interviewPct,
    weights,
  };
}
