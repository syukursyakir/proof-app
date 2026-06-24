import { NextResponse } from "next/server";
import { openai, TRANSCRIBE_MODEL } from "@/lib/openai";
import { resolveToken } from "@/lib/candidateToken";

export const maxDuration = 60;
export const runtime = "nodejs";

// Token-gated transcription so a candidate (not logged in) can answer a skills
// work-sample by voice instead of typing.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = form.get("token");
    if (typeof token !== "string" || !(await resolveToken(token))) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }
    const file = form.get("audio");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }
    const tr = await openai.audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
    });
    return NextResponse.json({ text: tr.text });
  } catch (e) {
    console.error("candidate-transcribe error", e);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
