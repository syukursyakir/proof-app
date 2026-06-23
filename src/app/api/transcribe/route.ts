import { NextResponse } from "next/server";
import { openai, TRANSCRIBE_MODEL } from "@/lib/openai";
import { getUserOrgId } from "@/lib/org";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Employer-only (denial-of-wallet protection).
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const form = await req.formData();
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
    console.error("transcribe error", e);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
