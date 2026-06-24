import type { TestQuestion } from "./types";

// Fisher-Yates over a question's 4 options, remapping the correct index so the
// answer key stays valid. Eliminates the model's tendency to cluster the
// correct answer at one position (a real, noticeable psychometric flaw).
export function shuffleMcqOptions(q: TestQuestion): TestQuestion {
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const options = idx.map((i) => q.options[i]) as TestQuestion["options"];
  const correct = idx.indexOf(q.correct);
  return { ...q, options, correct };
}
