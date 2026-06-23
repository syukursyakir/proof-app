import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { SCORE_SYSTEM } from "@/lib/prompts";
import { supabaseServer } from "@/lib/supabase-server";
import { groundQuotes, clampScore } from "@/lib/verifyQuotes";
import type { CriterionVerdict } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

type ScoreResult = {
  overall: { summary: string; recommendation: string };
  per_criterion: CriterionVerdict[];
};

export async function POST(req: Request) {
  try {
    const { candidate_id } = await req.json();
    if (!candidate_id) {
      return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
    }

    // User-scoped client: RLS guarantees the employer can only score their own
    // org's candidates. If they can't read it, they can't score it.
    const sb = await supabaseServer();

    const { data: candidate } = await sb
      .from("candidates")
      .select("*")
      .eq("id", candidate_id)
      .single();
    if (!candidate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: role } = await sb
      .from("roles")
      .select("*")
      .eq("id", candidate.role_id)
      .single();

    const { data: transcript } = await sb
      .from("transcripts")
      .select("*")
      .eq("candidate_id", candidate_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!transcript?.full_text) {
      return NextResponse.json(
        { error: "No transcript to score yet" },
        { status: 400 },
      );
    }

    const fullText: string = transcript.full_text;

    // Deterministic (temp 0), with the transcript clearly delimited as untrusted data.
    const result = await jsonChat<ScoreResult>(
      SCORE_SYSTEM,
      `Rubric:\n${JSON.stringify(role?.rubric ?? [])}\n\n<<<TRANSCRIPT>>>\n${fullText}\n<<<END_TRANSCRIPT>>>`,
      { temperature: 0 },
    );

    // Clamp scores and DROP any quote the model didn't actually take from the transcript.
    const normalized: CriterionVerdict[] = (result.per_criterion ?? []).map((c) => ({
      name: c.name,
      score: clampScore(c.score),
      justification: c.justification ?? "",
      quotes: c.quotes ?? [],
    }));
    const { grounded } = groundQuotes(normalized, fullText);

    await sb.from("verdicts").delete().eq("candidate_id", candidate_id);
    const { data, error } = await sb
      .from("verdicts")
      .insert({
        candidate_id,
        org_id: candidate.org_id,
        overall: result.overall,
        per_criterion: grounded,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e) {
    console.error("score error", e);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
