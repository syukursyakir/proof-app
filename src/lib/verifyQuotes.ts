import type { CriterionVerdict } from "./types";

// Normalize for tolerant matching: lowercase, unify smart quotes/dashes, collapse whitespace.
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPunct(s: string): string {
  return s.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Is this quote actually present in the transcript? exact -> normalized -> punctuation-stripped.
export function quoteFound(quote: string, transcript: string): boolean {
  if (!quote || !transcript) return false;
  const q = norm(quote);
  // Too short to be meaningful evidence (avoids matching stray words like "the").
  if (q.length < 8) return false;
  if (transcript.includes(quote)) return true;
  const t = norm(transcript);
  if (t.includes(q)) return true;
  return stripPunct(t).includes(stripPunct(q));
}

// Drop any quote the model invented. Flags criteria whose evidence couldn't be grounded.
export function groundQuotes(
  perCriterion: CriterionVerdict[],
  transcript: string,
): { grounded: CriterionVerdict[]; droppedAny: boolean } {
  let droppedAny = false;
  const grounded = (perCriterion ?? []).map((c) => {
    const original = c.quotes ?? [];
    const kept = original.filter((q) => quoteFound(q, transcript));
    if (kept.length < original.length) droppedAny = true;
    return { ...c, quotes: kept };
  });
  return { grounded, droppedAny };
}

export function clampScore(n: unknown): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(5, x));
}
