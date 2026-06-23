import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { SCORE_SYSTEM } from "@/lib/prompts";
import { supabaseAdmin } from "@/lib/supabase";
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
    const supa = supabaseAdmin();

    const { data: candidate } = await supa
      .from("candidates")
      .select("*")
      .eq("id", candidate_id)
      .single();
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const { data: role } = await supa
      .from("roles")
      .select("*")
      .eq("id", candidate.role_id)
      .single();

    const { data: transcript } = await supa
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

    const result = await jsonChat<ScoreResult>(
      SCORE_SYSTEM,
      `Rubric:\n${JSON.stringify(role?.rubric ?? [])}\n\nInterview transcript:\n${transcript.full_text}`,
    );

    // Replace any prior verdict for this candidate.
    await supa.from("verdicts").delete().eq("candidate_id", candidate_id);
    const { data, error } = await supa
      .from("verdicts")
      .insert({
        candidate_id,
        overall: result.overall,
        per_criterion: result.per_criterion,
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
