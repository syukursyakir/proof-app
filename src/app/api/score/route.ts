import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { scoreCandidate } from "@/lib/scoreCandidate";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { candidate_id } = await req.json();
    if (!candidate_id) {
      return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
    }

    // RLS: employer can only see/score their own org's candidates.
    const sb = await supabaseServer();
    const { data: candidate } = await sb
      .from("candidates")
      .select("id")
      .eq("id", candidate_id)
      .single();
    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = await scoreCandidate(candidate_id);
    if (!result.ok) {
      const msg =
        result.reason === "too-short" || result.reason === "no-transcript"
          ? "Not enough interview content to score yet."
          : result.reason === "no-rubric"
            ? "This role has no rubric to score against."
            : "Scoring failed — please try again.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: result.verdictId });
  } catch (e) {
    console.error("score error", e);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
