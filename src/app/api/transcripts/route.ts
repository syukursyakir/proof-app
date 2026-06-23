import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.candidate_id) {
    return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
  }
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("transcripts")
    .insert({
      candidate_id: body.candidate_id,
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
    .eq("id", body.candidate_id);

  return NextResponse.json(data);
}
