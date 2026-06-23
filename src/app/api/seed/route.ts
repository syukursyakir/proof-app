import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Seeds a complete, reliable Customer Support demo: role + candidate +
// transcript + glass-box verdict (quotes are verbatim substrings of the
// transcript so highlighting works). Visit /api/seed once.
const RUBRIC = [
  {
    name: "Customer empathy",
    good: "Acknowledges the customer's feelings before solving the problem.",
    bad: "Jumps straight to process; sounds robotic or dismissive.",
  },
  {
    name: "Problem ownership",
    good: "Takes personal responsibility and follows through to resolution.",
    bad: "Passes the customer around or blames other teams.",
  },
  {
    name: "Composure under pressure",
    good: "Stays calm and structured when the customer is upset.",
    bad: "Gets flustered, defensive, or escalates the tension.",
  },
  {
    name: "Clear communication",
    good: "Explains next steps in plain language and confirms understanding.",
    bad: "Uses jargon or leaves the customer unsure what happens next.",
  },
];

const TRANSCRIPT = `Interviewer: Tell me about a time you dealt with an angry customer.
Candidate: We had a customer whose refund was three weeks late and she was really upset. I told her I completely understood why she was frustrated, and that I'd stay on the line until it was sorted.
Interviewer: You said you'd stay on the line — what was going through your mind?
Candidate: Honestly I felt my heart racing, but I slowed down, took a breath, and focused on one issue at a time so I wouldn't make it worse.
Interviewer: How did you make sure it actually got resolved?
Candidate: I didn't pass her around — I took her number and personally followed up the next morning once the refund cleared.
Interviewer: How did you keep her informed?
Candidate: I explained the refund timeline in plain language and repeated the key steps so she knew exactly what to expect.`;

const TURNS = TRANSCRIPT.split("\n").map((line) => {
  const isAgent = line.startsWith("Interviewer:");
  return {
    role: isAgent ? "agent" : "user",
    text: line.replace(/^(Interviewer|Candidate):\s*/, ""),
  };
});

const VERDICT = {
  overall: {
    summary:
      "A strong, customer-first candidate. Jordan leads with empathy, takes personal ownership, and communicates clearly. Composure is good though self-described nerves are worth a light probe in a follow-up.",
    recommendation: "advance",
  },
  per_criterion: [
    {
      name: "Customer empathy",
      score: 5,
      justification: "Acknowledged the customer's emotion before problem-solving.",
      quotes: [
        "I told her I completely understood why she was frustrated, and that I'd stay on the line until it was sorted.",
      ],
    },
    {
      name: "Problem ownership",
      score: 5,
      justification: "Took personal responsibility and followed through to resolution.",
      quotes: [
        "I didn't pass her around — I took her number and personally followed up the next morning once the refund cleared.",
      ],
    },
    {
      name: "Composure under pressure",
      score: 4,
      justification: "Stayed structured despite admitting nerves.",
      quotes: [
        "I slowed down, took a breath, and focused on one issue at a time so I wouldn't make it worse.",
      ],
    },
    {
      name: "Clear communication",
      score: 5,
      justification: "Explained next steps plainly and confirmed understanding.",
      quotes: [
        "I explained the refund timeline in plain language and repeated the key steps so she knew exactly what to expect.",
      ],
    },
  ],
};

async function seed() {
  const supa = supabaseAdmin();

  const { data: role, error: roleErr } = await supa
    .from("roles")
    .insert({
      title: "Customer Support",
      description_raw:
        "A customer support rep who stays calm with angry customers, takes ownership of problems, and communicates clearly.",
      rubric: RUBRIC,
      test_questions: [
        "A customer is charged twice. Walk through how you'd resolve it.",
        "Draft a one-line reply to a customer whose order is lost.",
        "How would you de-escalate someone threatening to leave a bad review?",
      ],
      interview_questions: [
        "Tell me about a time you dealt with an angry customer.",
        "How do you decide when to escalate an issue versus handling it yourself?",
        "Describe a time you didn't know the answer — what did you do?",
        "How do you keep your tone calm when a customer is rude?",
        "What does great customer service mean to you?",
      ],
      test_enabled: true,
    })
    .select()
    .single();
  if (roleErr) throw new Error(roleErr.message);

  const { data: candidate, error: candErr } = await supa
    .from("candidates")
    .insert({ role_id: role.id, name: "Jordan (sample)", status: "completed" })
    .select()
    .single();
  if (candErr) throw new Error(candErr.message);

  await supa.from("transcripts").insert({
    candidate_id: candidate.id,
    full_text: TRANSCRIPT,
    turns: TURNS,
  });

  await supa.from("verdicts").insert({
    candidate_id: candidate.id,
    overall: VERDICT.overall,
    per_criterion: VERDICT.per_criterion,
  });

  return { roleId: role.id, candidateId: candidate.id };
}

export async function GET(req: Request) {
  // Locked: requires ?key=<SEED_SECRET>. Disabled entirely if SEED_SECRET is unset.
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SEED_SECRET || key !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const ids = await seed();
    return NextResponse.json({
      ok: true,
      ...ids,
      verdictUrl: `/candidates/${ids.candidateId}`,
      roleUrl: `/roles/${ids.roleId}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
