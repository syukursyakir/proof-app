import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import { scoreCandidate } from "@/lib/scoreCandidate";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  // Only mark complete + score if the candidate actually said something — an
  // all-interviewer transcript shouldn't lock them out or get fabricated scores.
  const turns = Array.isArray(body.turns) ? body.turns : [];
  const candidateSpoke = turns.some(
    (t: { role?: string; text?: string }) =>
      t?.role === "user" && (t.text ?? "").trim().length > 0,
  );

  if (candidateSpoke) {
    await supa.from("candidates").update({ status: "completed" }).eq("id", cand.id);
    // Auto-score AFTER responding, so the candidate isn't left waiting on 3 GPT
    // calls. The verdict is ready by the time the employer looks. Best-effort.
    const candId = cand.id;
    after(async () => {
      try {
        await scoreCandidate(candId);
      } catch {
        /* employer can still trigger scoring manually */
      }
    });
  }

  return NextResponse.json(data);
}
