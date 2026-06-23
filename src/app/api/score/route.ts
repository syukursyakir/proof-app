import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { SCORE_SYSTEM } from "@/lib/prompts";
import { supabaseServer } from "@/lib/supabase-server";
import { groundQuotes, clampScore } from "@/lib/verifyQuotes";
import type { CriterionVerdict } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

type ScoreResult = {
  overall: { summary: string; recommendation: string; integrity_flag?: boolean };
  per_criterion: CriterionVerdict[];
};

const N_SAMPLES = 3;

export async function POST(req: Request) {
  try {
    const { candidate_id } = await req.json();
    if (!candidate_id) {
      return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
    }

    // RLS: employer can only score their own org's candidates.
    const sb = await supabaseServer();
    const { data: candidate } = await sb
      .from("candidates")
      .select("*")
      .eq("id", candidate_id)
      .single();
    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      return NextResponse.json({ error: "No transcript to score yet" }, { status: 400 });
    }
    const fullText: string = transcript.full_text;

    const userMsg = `Rubric:\n${JSON.stringify(role?.rubric ?? [])}\n\n<<<TRANSCRIPT>>>\n${fullText}\n<<<END_TRANSCRIPT>>>`;

    // Self-consistency: sample N times, take the per-criterion MEDIAN, flag disagreement.
    const runs = await Promise.all(
      Array.from({ length: N_SAMPLES }, () =>
        jsonChat<ScoreResult>(SCORE_SYSTEM, userMsg, { temperature: 0.3 }).catch(
          () => null,
        ),
      ),
    );
    const valid = runs.filter(Boolean) as ScoreResult[];
    if (!valid.length) {
      return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
    }

    const rubricNames = (role?.rubric as { name: string }[] | null)?.map((c) => c.name);
    const names =
      rubricNames && rubricNames.length
        ? rubricNames
        : (valid[0].per_criterion ?? []).map((c) => c.name);

    const per: CriterionVerdict[] = names.map((name) => {
      const entries = valid
        .map((r) => (r.per_criterion ?? []).find((c) => c.name === name))
        .filter(Boolean) as CriterionVerdict[];
      const scores = entries.map((e) => clampScore(e.score)).sort((a, b) => a - b);
      const median = scores.length ? scores[Math.floor(scores.length / 2)] : 1;
      const range = scores.length ? scores[scores.length - 1] - scores[0] : 0;
      const rep =
        entries.length > 0
          ? entries.reduce((best, e) =>
              Math.abs(clampScore(e.score) - median) <
              Math.abs(clampScore(best.score) - median)
                ? e
                : best,
            )
          : null;
      return {
        name,
        score: median,
        justification: rep?.justification ?? "",
        quotes: rep?.quotes ?? [],
        low_confidence: range >= 2,
      };
    });

    const { grounded } = groundQuotes(per, fullText);

    // Overall: majority recommendation across samples.
    const recCounts: Record<string, number> = {};
    for (const r of valid) {
      const rec = r.overall?.recommendation;
      if (rec) recCounts[rec] = (recCounts[rec] ?? 0) + 1;
    }
    const recommendation =
      Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      valid[0].overall?.recommendation ??
      "lean advance";
    const integrity_flag = valid.some((r) => r.overall?.integrity_flag);
    const overall = {
      summary: valid[0].overall?.summary ?? "",
      recommendation,
      integrity_flag,
    };

    await sb.from("verdicts").delete().eq("candidate_id", candidate_id);
    const { data, error } = await sb
      .from("verdicts")
      .insert({
        candidate_id,
        org_id: candidate.org_id,
        overall,
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
