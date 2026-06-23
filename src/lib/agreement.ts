// AI-vs-human score agreement metrics (validation harness, P9).

export type ScorePair = { name: string; ai: number; human: number };

type Scored = { name: string; score: number };

// Match AI and human scores by criterion name.
export function pairScores(ai: Scored[], human: Scored[]): ScorePair[] {
  const hmap = new Map(human.map((h) => [h.name, h.score]));
  return ai
    .filter((a) => hmap.has(a.name))
    .map((a) => ({ name: a.name, ai: a.score, human: hmap.get(a.name) as number }));
}

export type Agreement = {
  n: number;
  exact: number; // fraction with identical score
  within1: number; // fraction within ±1
  mae: number; // mean absolute error
};

export function agreement(pairs: ScorePair[]): Agreement {
  const n = pairs.length;
  if (!n) return { n: 0, exact: 0, within1: 0, mae: 0 };
  let exact = 0;
  let within1 = 0;
  let sad = 0;
  for (const p of pairs) {
    const d = Math.abs(p.ai - p.human);
    if (d === 0) exact++;
    if (d <= 1) within1++;
    sad += d;
  }
  return { n, exact: exact / n, within1: within1 / n, mae: sad / n };
}
