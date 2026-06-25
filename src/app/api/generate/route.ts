import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import {
  FOLLOWUP_SYSTEM,
  buildAssessmentSystem,
  buildMcqBatchSystem,
  buildMcqFixSystem,
  buildMcqTranslateSystem,
  CRITIQUE_MCQ_SYSTEM,
} from "@/lib/prompts";
import { getUserOrgId } from "@/lib/org";
import { shuffleMcqOptions } from "@/lib/shuffle";
import { generateTemplatedMcq } from "@/lib/mcqTemplates";
import type { Assessment, TestQuestion } from "@/lib/types";

export const maxDuration = 90;
export const runtime = "nodejs";

type McqOut = { test_mcq: TestQuestion[] };
type Critique = { items: { id: string; verdict: "good" | "easy" | "flawed"; note: string }[] };

// numerical/logical: deterministic item-model templates (src/lib/mcqTemplates.ts)
// — the correct answer and distractors are COMPUTED, not LLM-guessed, so these
// never need the critique/fix loop. verbal/sjt don't reduce to arithmetic, so
// they stay LLM-generated (one concurrent call per category, ~15-20s, ~$0.05/
// role total — see openai.ts for why reasoning_effort isn't used here).
const LLM_CATEGORIES = ["verbal", "sjt"] as const;
const TEMPLATED_CATEGORIES = ["numerical", "logical"] as const;
const PER_CATEGORY = 3;

async function generateMcq(
  roleTitle: string,
  description: string,
  answers: unknown,
  locale: string,
): Promise<TestQuestion[]> {
  // Templated items are free (no API call) in English. Only when the
  // candidate's language isn't English do they need one translation pass —
  // translation is far more reliable than free generation since the prompt
  // can't touch the numbers, only the surrounding prose.
  let templated: TestQuestion[] = TEMPLATED_CATEGORIES.flatMap((category) =>
    generateTemplatedMcq(category, PER_CATEGORY, category[0]),
  );
  if (locale !== "en" && templated.length > 0) {
    try {
      const translated = await jsonChat<McqOut>(
        buildMcqTranslateSystem(locale),
        JSON.stringify({ test_mcq: templated }),
      );
      const byId = new Map((translated.test_mcq ?? []).map((q) => [q.id, q]));
      templated = templated.map((q) => {
        const t = byId.get(q.id);
        return t ? { ...q, question: t.question, options: t.options } : q;
      });
    } catch (e) {
      console.error("mcq template translation failed, leaving in English", e);
    }
  }

  const context = `Role: ${roleTitle}\nRole description:\n${description}\n\nEmployer's clarifying answers:\n${JSON.stringify(answers)}`;
  const batches = await Promise.all(
    LLM_CATEGORIES.map((category) =>
      jsonChat<McqOut>(buildMcqBatchSystem(category, PER_CATEGORY, locale), context).catch((e) => {
        console.error(`mcq batch (${category}) failed`, e);
        return { test_mcq: [] as TestQuestion[] };
      }),
    ),
  );
  let llmGenerated = batches.flatMap((b) => (Array.isArray(b.test_mcq) ? b.test_mcq : [])).map(shuffleMcqOptions);

  if (llmGenerated.length > 0) {
    const compact = llmGenerated.map((q) => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      correct_option: q.options[q.correct],
    }));
    const critique = await jsonChat<Critique>(CRITIQUE_MCQ_SYSTEM, JSON.stringify({ items: compact }));
    const verdictById = new Map((critique.items ?? []).map((it) => [it.id, it.verdict]));
    const notesById = new Map((critique.items ?? []).map((it) => [it.id, it.note]));
    const flagged = llmGenerated.filter((q) => {
      const verdict = verdictById.get(q.id);
      return verdict && verdict !== "good";
    });

    if (flagged.length > 0) {
      // Fix flagged items grouped by category, concurrently — smaller
      // parallel calls beat one larger serial one (same latency logic as
      // generation above).
      const flaggedByCategory = new Map<string, TestQuestion[]>();
      for (const q of flagged) {
        flaggedByCategory.set(q.category, [...(flaggedByCategory.get(q.category) ?? []), q]);
      }
      const fixSystem = buildMcqFixSystem(locale);
      const fixedGroups = await Promise.all(
        Array.from(flaggedByCategory.values()).map((items) =>
          jsonChat<McqOut>(
            fixSystem,
            JSON.stringify({
              role: roleTitle,
              items: items.map((q) => ({
                id: q.id,
                category: q.category,
                question: q.question,
                options: q.options,
                correct: q.correct,
                reviewer_note: notesById.get(q.id),
              })),
            }),
          ).catch((e) => {
            console.error("mcq fix batch failed", e);
            return { test_mcq: [] as TestQuestion[] };
          }),
        ),
      );
      const fixedById = new Map(
        fixedGroups
          .flatMap((g) => (Array.isArray(g.test_mcq) ? g.test_mcq : []))
          .map((q) => [q.id, shuffleMcqOptions(q)] as const),
      );
      llmGenerated = llmGenerated.map((q) => fixedById.get(q.id) ?? q);
    }
  }

  // Re-id sequentially across the combined set — templated and LLM batches
  // each numbered independently, so ids collide until renumbered.
  return [...templated, ...llmGenerated].map((q, i) => ({ ...q, id: `q${i + 1}` }));
}

export async function POST(req: Request) {
  try {
    // Employer-only (denial-of-wallet protection).
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { description, answers, language } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    // Stage 1: no answers yet -> return sharpening follow-up questions.
    if (!answers) {
      const out = await jsonChat<{ followups: string[] }>(
        FOLLOWUP_SYSTEM,
        `Role description (spoken by the employer):\n${description}`,
      );
      return NextResponse.json({
        stage: "followups",
        followups: Array.isArray(out.followups) ? out.followups.slice(0, 2) : [],
      });
    }

    const locale = typeof language === "string" ? language : "en";

    // Stage 2: answers provided -> return the full assessment.
    const out = await jsonChat<Assessment>(
      buildAssessmentSystem(locale),
      `Role description:\n${description}\n\nEmployer's clarifying answers:\n${JSON.stringify(
        answers,
      )}`,
    );

    try {
      out.test_mcq = await generateMcq(out.title ?? "this role", description, answers, locale);
    } catch (e) {
      console.error("mcq generation error", e);
      out.test_mcq = [];
    }

    return NextResponse.json({ stage: "assessment", ...out });
  } catch (e) {
    console.error("generate error", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
