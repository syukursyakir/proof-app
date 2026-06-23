import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Candidate-facing (unauthenticated): the candidate's browser posts the
// transcript at the end of the interview. Runs via service role, but we set
// org_id from the candidate so the owning employer can read it under RLS.
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.candidate_id) {
    return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
  }
  const supa = supabaseAdmin();

  const { data: cand } = await supa
    .from("candidates")
    .select("id, org_id")
    .eq("id", body.candidate_id)
    .single();
  if (!cand) {
    return NextResponse.json({ error: "Unknown candidate" }, { status: 404 });
  }

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

  await supa
    .from("candidates")
    .update({ status: "completed" })
    .eq("id", cand.id);

  return NextResponse.json(data);
}
