import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

export const APTITUDE_DURATION_SEC = 20 * 60;

// Server-authoritative aptitude state.
//  - action "start": stamps aptitude_started_at once (idempotent) and returns
//    the start time + any autosaved answers, so the client computes the REAL
//    remaining time and resumes after a refresh.
//  - action "save": autosaves in-progress answers (only while unscored).
export async function POST(req: Request) {
  try {
    const { token, action, answers } = await req.json();
    const cand = await resolveToken(token);
    if (!cand) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }
    const admin = supabaseAdmin();

    // Already submitted — tell the client it's done (one attempt).
    const c = cand as {
      id: string;
      aptitude_score?: number | null;
      aptitude_started_at?: string | null;
      aptitude_answers?: Record<string, number> | null;
    };
    if (c.aptitude_score !== null && c.aptitude_score !== undefined) {
      return NextResponse.json({ done: true });
    }

    if (action === "save") {
      if (answers && typeof answers === "object") {
        await admin
          .from("candidates")
          .update({ aptitude_answers: answers })
          .eq("id", c.id)
          .is("aptitude_score", null);
      }
      return NextResponse.json({ ok: true });
    }

    // action "start" (default): stamp start time once.
    let startedAt = c.aptitude_started_at ?? null;
    if (!startedAt) {
      startedAt = new Date().toISOString();
      await admin
        .from("candidates")
        .update({ aptitude_started_at: startedAt })
        .eq("id", c.id)
        .is("aptitude_started_at", null);
    }
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    const remaining = Math.max(0, Math.round(APTITUDE_DURATION_SEC - elapsed));
    return NextResponse.json({
      startedAt,
      remaining,
      durationSec: APTITUDE_DURATION_SEC,
      answers: c.aptitude_answers ?? {},
    });
  } catch (e) {
    console.error("aptitude-state error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
