import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Mints a short-lived signed URL so the browser can connect to the private agent
// without exposing the ElevenLabs API key.
export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs not configured" },
      { status: 400 },
    );
  }
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey } },
    );
    if (!r.ok) {
      const t = await r.text();
      console.error("signed url error", t);
      return NextResponse.json({ error: "Signed URL failed" }, { status: 500 });
    }
    const data = await r.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (e) {
    console.error("signed url exception", e);
    return NextResponse.json({ error: "Signed URL failed" }, { status: 500 });
  }
}
