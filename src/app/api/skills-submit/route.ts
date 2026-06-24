import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import { jsonChat } from "@/lib/openai";
import { SKILLS_SYSTEM } from "@/lib/prompts";
import type { Criterion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type SkillsScore = {
  per_question: { score: number; justification: string }[];
  overall: string;
};

export async function POST(req: Request) {
  try {
    const { token, answers } = await req.json();
    // answers: { question: string, answer: string }[]
    if (!token || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const candidate = await resolveToken(token);
    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: role } = await supabaseAdmin()
      .from("roles")
      .select("rubric")
      .eq("id", candidate.role_id)
      .single();

    const rubric = (role?.rubric as Criterion[]) ?? [];
    const rubricText = rubric
      .map((c) => `- ${c.name}: strong = ${c.good}; weak = ${c.bad}`)
      .join("\n");

    const qa = answers
      .map(
        (a: { question: string; answer: string }, i: number) =>
          `Q${i + 1}: ${a.question}\nAnswer: ${a.answer || "(blank)"}`,
      )
      .join("\n\n");

    const user = `Role rubric:\n${rubricText}\n\n<<<ANSWERS>>>\n${qa}\n<<<END_ANSWERS>>>`;

    let scored: SkillsScore | null = null;
    try {
      scored = await jsonChat<SkillsScore>(SKILLS_SYSTEM, user);
    } catch {
      scored = null;
    }

    const perQ = scored?.per_question ?? [];
    const sum = perQ.reduce((s, q) => s + (Number(q.score) || 0), 0);
    const max = answers.length * 5;

    await supabaseAdmin()
      .from("candidates")
      .update({
        skills_score: perQ.length ? sum : null,
        skills_max: perQ.length ? max : null,
        skills_answers: {
          qa: answers,
          per_question: perQ,
          overall: scored?.overall ?? null,
        },
      })
      .eq("id", candidate.id);

    return NextResponse.json({ score: sum, max });
  } catch (e) {
    console.error("skills-submit error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
