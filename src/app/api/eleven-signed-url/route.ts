import { NextResponse } from "next/server";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Mints a short-lived signed URL so the browser can connect to the private agent.
// Gated by a valid candidate token (prevents anyone from minting connections).
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const cand = await resolveToken(token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!agentId || !apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 400 });
  }
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey } },
    );
    if (!r.ok) {
      console.error("signed url error", await r.text());
      return NextResponse.json({ error: "Signed URL failed" }, { status: 500 });
    }
    const data = await r.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (e) {
    console.error("signed url exception", e);
    return NextResponse.json({ error: "Signed URL failed" }, { status: 500 });
  }
}
