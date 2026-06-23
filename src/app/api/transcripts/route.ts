import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Candidate-facing: the browser posts the transcript at the end of the interview.
// Authorized by the access token (not a raw candidate_id). recording_url is a
// private storage PATH, not a public URL.
export async function POST(req: Request) {
  const body = await req.json();
  const cand = await resolveToken(body.token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  const supa = supabaseAdmin();

  const { data, error } = await supa
    .from("transcripts")
    .insert({
      candidate_id: cand.id,
      org_id: cand.org_id,
      full_text: body.full_text ?? null,
      turns: body.turns ?? null,
      recording_url: body.recording_url ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supa.from("candidates").update({ status: "completed" }).eq("id", cand.id);

  return NextResponse.json(data);
}
