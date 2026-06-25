// Phase 3 of the aptitude-test-quality fix: real Automatic Item Generation
// (AIG), per Gierl & Lai's template-based methodology (the approach used to
// build items for the GMAT, GRE, and medical licensure exams).
//
// Core idea: separate RADICALS (the structural/math features that determine
// difficulty — e.g. "two compounding percentage steps") from INCIDENTALS
// (cosmetic cover-story details that don't affect difficulty — e.g. "support
// tickets" vs "sales orders"). Vary only incidentals from a fixed radical and
// you get near-identical clones; build several distinct radical structures
// (item models) and vary their incidentals, and you get genuinely diverse,
// difficulty-controlled items — with the correct answer and distractors
// COMPUTED in code, not guessed by an LLM. This gets numerical/logical items
// to zero wrong-answer-key risk, which no amount of prompting can fully
// guarantee.
//
// Verbal and SJT items are NOT templated here — they don't reduce to
// arithmetic/deduction, so templating buys little (this mirrors the AIG
// literature: "strong theory" AIG has historically been applied almost
// entirely to quantitative/logical domains). Those stay LLM-generated via
// buildMcqBatchSystem.

import type { TestQuestion } from "./types";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function fmtPct(n: number): string {
  const s = n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return (n > 0 ? "+" : "") + s + "%";
}
// Build the 4-option array with the correct value at index 0, then shuffle.
function assemble(
  id: string,
  category: "numerical" | "logical",
  reasoning: string,
  question: string,
  correctText: string,
  distractors: [string, string, string],
): TestQuestion {
  const options = [correctText, ...distractors] as [string, string, string, string];
  return shuffleOptions({ id, category, reasoning, question, options, correct: 0 });
}
function shuffleOptions(q: TestQuestion): TestQuestion {
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const options = idx.map((i) => q.options[i]) as TestQuestion["options"];
  return { ...q, options, correct: idx.indexOf(0) };
}
// Dedupe distractors against the correct value and each other by nudging
// collisions — extremely rare with these ranges, but a wrong-key-by-collision
// (two options reading identically) is worse than a slightly imperfect trap.
function uniqueText(value: string, taken: Set<string>, bump: () => string): string {
  let v = value;
  let guard = 0;
  while (taken.has(v) && guard++ < 5) v = bump();
  taken.add(v);
  return v;
}

// ---------------------------------------------------------------------------
// NUMERICAL templates
// ---------------------------------------------------------------------------

const NUM_SUBJECTS = [
  "support tickets",
  "sales orders",
  "delivery shipments",
  "service calls",
  "job applications",
  "support emails",
  "customer invoices",
];

// Radical: two sequential percentage changes that must be compounded, not
// summed — the classic trap from the existing prompt's worked examples.
function numCompoundPct(id: string): TestQuestion {
  const subject = pick(NUM_SUBJECTS);
  const base = pick([200, 300, 400, 500, 600, 800, 1000, 1200]);
  const pcts = [8, 12, 15, 18, 20, 22, 25, 28, 30];
  let p1 = pick(pcts) * pick([1, -1]);
  let p2 = pick(pcts) * pick([1, -1]);
  if (p1 === 0) p1 = 10;
  if (p2 === 0) p2 = -10;

  const correct = ((1 + p1 / 100) * (1 + p2 / 100) - 1) * 100;
  const naiveSum = p1 + p2; // banned-easy mistake: adding instead of compounding
  const signFlip = -correct;
  const firstStepOnly = p1; // mistake: forgot the second step entirely

  const taken = new Set<string>();
  const correctText = uniqueText(fmtPct(correct), taken, () => fmtPct(correct + 0.1));
  const d1 = uniqueText(fmtPct(naiveSum), taken, () => fmtPct(naiveSum + 0.3));
  const d2 = uniqueText(fmtPct(signFlip), taken, () => fmtPct(signFlip - 0.3));
  const d3 = uniqueText(fmtPct(firstStepOnly), taken, () => fmtPct(firstStepOnly + 0.4));

  const question = `A company tracked ${base} ${subject} in January. The volume changed by ${fmtPct(p1)} the following month, then changed by ${fmtPct(p2)} the month after that. What is the net percentage change versus the original January figure?`;
  const reasoning = `Compound the two changes multiplicatively, never add them: (1 + ${p1}/100) × (1 + ${p2}/100) − 1 = ${correct.toFixed(2)}%. Naive-sum distractor: ${p1}+${p2}=${naiveSum}%. Sign-flip distractor: ${signFlip.toFixed(2)}%. First-step-only distractor: ${p1}%.`;
  return assemble(id, "numerical", reasoning, question, correctText, [d1, d2, d3]);
}

// Radical: a pledged percentage reduction against a starting count, then
// asking for the SHORTFALL versus the target (not the raw current count) —
// forces tracking two derived quantities, not one direct lookup.
function numMissTarget(id: string): TestQuestion {
  const subject = pick(NUM_SUBJECTS);
  const start = randInt(20, 60);
  const pledgePct = pick([60, 65, 70, 75, 80, 85, 90]);
  const target = Math.round(start * (1 - pledgePct / 100));
  // Actual achieved must be worse than target (a real miss) but plausible.
  const actual = target + randInt(2, Math.max(3, Math.round(start * 0.15)));

  const miss = actual - target;
  const naive = start - actual; // mistake: compares to the original count, not the target
  const zero = 0; // mistake: "they reduced overall, so call it a win"
  const reportTargetAsMiss = target; // mistake: confuses the target value with the gap

  const taken = new Set<string>();
  const correctText = uniqueText(`${miss}`, taken, () => `${miss + 1}`);
  const d1 = uniqueText(`${naive}`, taken, () => `${naive + 1}`);
  const d2 = uniqueText(`${zero}`, taken, () => `1`);
  const d3 = uniqueText(`${reportTargetAsMiss}`, taken, () => `${reportTargetAsMiss + 1}`);

  const question = `A team had ${start} open ${subject} per day and pledged to cut that by ${pledgePct}%. They got it down to ${actual} per day. By how many did they MISS their pledged target?`;
  const reasoning = `Target = ${start} × (1 − ${pledgePct}/100) = ${target}. Miss = actual − target = ${actual} − ${target} = ${miss}. Naive distractor compares to the original count instead of the target: ${start} − ${actual} = ${naive}.`;
  return assemble(id, "numerical", reasoning, question, correctText, [d1, d2, d3]);
}

// Radical: combining two independent before/after sources requires summing
// first, THEN taking the percentage — averaging the two individual
// percentages (a very common real mistake) gives a different, wrong answer.
function numCombinedPct(id: string): TestQuestion {
  const labelSets = [
    ["Region A", "Region B"],
    ["Team A", "Team B"],
    ["Store A", "Store B"],
    ["Channel A", "Channel B"],
  ] as const;
  const [labelA, labelB] = pick(labelSets);
  const subject = pick(NUM_SUBJECTS);
  const a1 = randInt(80, 150);
  const a2 = Math.round(a1 * (1 - pick([0.1, 0.15, 0.2, 0.25]) - Math.random() * 0.05));
  const b1 = randInt(80, 150);
  const b2 = Math.round(b1 * (1 - pick([0.05, 0.1, 0.15]) - Math.random() * 0.05));

  const before = a1 + b1;
  const after = a2 + b2;
  const correct = ((before - after) / before) * 100;
  const pctA = ((a1 - a2) / a1) * 100;
  const pctB = ((b1 - b2) / b1) * 100;
  const avgOfTwo = (pctA + pctB) / 2; // mistake: averaging the two %s instead of combining totals
  const wrongBase = ((before - after) / after) * 100; // mistake: dividing by the wrong (ending) base

  // Express as a decrease, matching the question's framing.
  const taken = new Set<string>();
  const correctDisplay = uniqueText(`${correct.toFixed(2)}% decrease`, taken, () => `${(correct + 0.1).toFixed(2)}% decrease`);
  const d1 = uniqueText(`${avgOfTwo.toFixed(2)}% decrease`, taken, () => `${(avgOfTwo + 0.3).toFixed(2)}% decrease`);
  const d2 = uniqueText(`${wrongBase.toFixed(2)}% decrease`, taken, () => `${(wrongBase + 0.3).toFixed(2)}% decrease`);
  const d3 = uniqueText(`${pctA.toFixed(2)}% decrease`, taken, () => `${(pctA + 0.3).toFixed(2)}% decrease`);

  const question = `${labelA} handled ${a1} ${subject} last month and ${a2} this month. ${labelB} handled ${b1} last month and ${b2} this month. What is the COMBINED percentage decrease across both, compared with last month?`;
  const reasoning = `Sum totals first: before = ${a1}+${b1}=${before}, after = ${a2}+${b2}=${after}. Combined % decrease = (${before}−${after})/${before} × 100 = ${correct.toFixed(2)}%. Averaging the two individual percentages instead (a common mistake) wrongly gives ${avgOfTwo.toFixed(2)}%.`;
  return assemble(id, "numerical", reasoning, question, correctDisplay, [d1, d2, d3]);
}

// ---------------------------------------------------------------------------
// LOGICAL templates
// ---------------------------------------------------------------------------

// Radical: a 3-link conditional chain ending in a negated link, requiring the
// contrapositive applied twice. Cover-story domains are swappable incidentals;
// the chain structure (and its validity) is fixed and pre-verified.
// p1 and p4 are STATES (used after "is"/"that is"); p2 and p3 are NOUN
// PHRASES (used after the template's own fixed verbs "requires"/"gets"/"with")
// — keeping all four slots grammatically consistent across every domain is
// what makes this safe to randomly recombine.
const CHAIN_DOMAINS = [
  {
    p1: "sent to Compliance",
    p2: "manager approval",
    p3: "an audit log",
    p4: "archived the same day",
    subject: "Ticket",
  },
  {
    p1: "flagged as high-risk",
    p2: "a second reviewer",
    p3: "a case note attached",
    p4: "closed within an hour",
    subject: "Claim",
  },
  {
    p1: "marked urgent",
    p2: "senior review",
    p3: "a callback slot",
    p4: "left unresolved overnight",
    subject: "Request",
  },
  {
    p1: "imported from a partner system",
    p2: "a validation check",
    p3: "an export entry",
    p4: "missing a customer ID",
    subject: "Record",
  },
] as const;

function logChain(id: string): TestQuestion {
  const d = pick(CHAIN_DOMAINS);
  const subj = `${d.subject} ${pick(["R", "Q", "M", "K", "T", "P"])}${randInt(1, 9)}`;

  const question = `Assuming all rules were applied as stated: every item that is ${d.p1} requires ${d.p2}. Every item that requires ${d.p2} gets ${d.p3}. No item with ${d.p3} is ${d.p4}. ${subj} is ${d.p4}. What follows about ${subj}?`;
  const correctText = `${subj} was not ${d.p1}.`;
  const d1 = `${subj} could have required ${d.p2} but skipped getting ${d.p3}.`; // denying the antecedent
  const d2 = `${subj} requires ${d.p2}.`; // affirms a mid-chain link the premises actually rule out
  const d3 = `It cannot be determined whether ${subj} was ${d.p1}.`; // false "cannot be determined"
  const reasoning = `Chain: P1→P2→P3→¬P4. ${subj} is P4, so by contrapositive on the third rule, ${subj} lacks P3 (${d.p3}). By contrapositive on the second rule, ${subj} doesn't have P2 (${d.p2}). By contrapositive on the first rule, ${subj} was not P1 (${d.p1}). The chain is fully determined, so "cannot be determined" is wrong, and "could have required P2 but skipped P3" denies the antecedent incorrectly.`;
  return assemble(id, "logical", reasoning, question, correctText, [d1, d2, d3]);
}

// Radical: "Some X are Y" existence premise + "No Y are Z" — the classic
// pattern, but the existence premise is REQUIRED before drawing a "some ...
// are not ..." conclusion (this exact flaw was caught by manual critique on
// an earlier LLM-generated item: a missing existence premise).
// y and z carry their own head noun (matching x's pattern) so they're valid
// standalone noun phrases in BOTH clauses — "No [y] are [z]" needs y and z to
// work as subjects, not just as predicate complements after "are".
const SYLLOGISM_DOMAINS = [
  { x: "tickets reviewed within the hour", y: "tickets downgraded after triage", z: "tickets still assigned to the escalation team at day's end" },
  { x: "applicants who passed the screen", y: "applicants invited to a second interview", z: "applicants offered the role" },
  { x: "shipments flagged for inspection", y: "shipments held back at the warehouse", z: "shipments delivered on the original schedule" },
  { x: "claims filed this quarter", y: "claims escalated to a senior adjuster", z: "claims closed within 48 hours" },
] as const;

function logSyllogism(id: string): TestQuestion {
  const d = pick(SYLLOGISM_DOMAINS);
  const question = `Some ${d.x} are ${d.y}. No ${d.y} are ${d.z}. Which conclusion MUST be true?`;
  const correctText = `At least some ${d.x} are not ${d.z}.`;
  const d1 = `All ${d.x} are not ${d.z}.`; // overreaches "some" into "all"
  const d2 = `No ${d.x} are ${d.y}.`; // contradicts the first premise outright
  const d3 = `Some ${d.z} are ${d.x}.`; // illicit conversion / reversed relation
  const reasoning = `"Some X are Y" guarantees at least one X that is Y exists. "No Y are Z" means that same item is not Z. So at least some X are not Z — this is the one conclusion the premises actually force. Extending to "all X" overreaches what "some" supports; the other two options misstate or reverse the premises.`;
  return assemble(id, "logical", reasoning, question, correctText, [d1, d2, d3]);
}

// ---------------------------------------------------------------------------

const NUMERICAL_TEMPLATES = [numCompoundPct, numMissTarget, numCombinedPct];
const LOGICAL_TEMPLATES = [logChain, logSyllogism];

// Generates `count` items for one templated category, IDs prefixed as given.
// Picks templates round-robin-ish (with repeats allowed once the pool is
// smaller than count) so a 3-item batch from 3 templates gets full variety.
export function generateTemplatedMcq(
  category: "numerical" | "logical",
  count: number,
  idPrefix: string,
): TestQuestion[] {
  const pool = category === "numerical" ? NUMERICAL_TEMPLATES : LOGICAL_TEMPLATES;
  const items: TestQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    items.push(template(`${idPrefix}${i + 1}`));
  }
  return items;
}
