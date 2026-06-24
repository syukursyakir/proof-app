// Composite scoring — combines up to three signals into one defensible
// recommendation: the structured interview (behavioural), the skills
// work-sample, and the aptitude screen (cognitive).
//
// Methodology (grounded in selection-science research):
//  - MECHANICAL combination, never holistic — statistical combination beats
//    expert holistic judgement by >50% validity (Kuncel et al. 2013).
//  - COMPENSATORY model: strength in one part offsets weakness in another
//    (Ock & Oswald 2018). The aptitude test is a soft screen, never a hard
//    cognitive cutoff (cognitive d≈1.0 is the biggest adverse-impact risk).
//  - WEIGHTS are validity-proportional, from Sackett et al. (2022):
//    structured interview ρ≈.42, work sample / job-knowledge ρ≈.40, cognitive
//    ability ρ≈.31. Normalised to sum to 1. Unit weighting (Wainer 1976) is the
//    safe default absent local data; this mild tilt tracks the evidence.
//  - Each predictor is normalised to a common 0–100 scale before weighting so a
//    larger-range predictor can't silently dominate.
//  - Weights re-normalise to whichever components are present, so a candidate
//    with only an interview still gets a composite.

export const BASE_WEIGHTS = {
  interview: 0.37, // ρ≈.42
  skills: 0.35, //    ρ≈.40
  aptitude: 0.28, //  ρ≈.31
};

export type CompositeBand =
  | "Strong"
  | "Recommended"
  | "Borderline"
  | "Not recommended";

export type CompositeComponent = {
  key: "interview" | "skills" | "aptitude";
  label: string;
  pct: number; // 0–100
  weight: number; // normalised, 0–1
};

export type CompositeResult = {
  composite: number; // 0–100
  band: CompositeBand;
  components: CompositeComponent[];
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
  const mean = criterionScores.reduce((s, n) => s + n, 0) / criterionScores.length;
  return ((mean - 1) / 4) * 100;
}

export function percentOfMax(
  score: number | null | undefined,
  max: number | null | undefined,
): number | null {
  if (score == null || !max) return null;
  return (score / max) * 100;
}

export type CompositeInput = {
  interviewScores?: number[];
  skillsScore?: number | null;
  skillsMax?: number | null;
  aptitudeScore?: number | null;
  aptitudeMax?: number | null;
};

export function computeComposite(input: CompositeInput): CompositeResult | null {
  const raw: { key: CompositeComponent["key"]; label: string; pct: number }[] = [];

  const interviewPct = interviewPercent(input.interviewScores ?? []);
  if (interviewPct != null)
    raw.push({ key: "interview", label: "Interview", pct: interviewPct });

  const skillsPct = percentOfMax(input.skillsScore, input.skillsMax);
  if (skillsPct != null) raw.push({ key: "skills", label: "Skills", pct: skillsPct });

  const aptitudePct = percentOfMax(input.aptitudeScore, input.aptitudeMax);
  if (aptitudePct != null)
    raw.push({ key: "aptitude", label: "Aptitude", pct: aptitudePct });

  if (raw.length === 0) return null;

  // Re-normalise the base weights across whichever components are present.
  const weightSum = raw.reduce((s, c) => s + BASE_WEIGHTS[c.key], 0);
  const components: CompositeComponent[] = raw.map((c) => ({
    ...c,
    weight: BASE_WEIGHTS[c.key] / weightSum,
  }));

  const composite = components.reduce((s, c) => s + c.weight * c.pct, 0);

  return { composite, band: bandFor(composite), components };
}
