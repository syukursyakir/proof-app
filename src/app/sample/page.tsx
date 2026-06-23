import Link from "next/link";
import VerdictView from "@/components/VerdictView";
import type { Candidate, Verdict } from "@/lib/types";

// Public, static showcase of a glass-box verdict (no DB, no auth) — safe to link
// from the landing and the demo video. Real verdicts live behind login at /candidates/[id].

const TRANSCRIPT = `Interviewer: Tell me about a time you dealt with an angry customer.
Candidate: We had a customer whose refund was three weeks late and she was really upset. I told her I completely understood why she was frustrated, and that I'd stay on the line until it was sorted.
Interviewer: You said you'd stay on the line — what was going through your mind?
Candidate: Honestly I felt my heart racing, but I slowed down, took a breath, and focused on one issue at a time so I wouldn't make it worse.
Interviewer: How did you make sure it actually got resolved?
Candidate: I didn't pass her around — I took her number and personally followed up the next morning once the refund cleared.
Interviewer: How did you keep her informed?
Candidate: I explained the refund timeline in plain language and repeated the key steps so she knew exactly what to expect.`;

const candidate: Candidate = {
  id: "sample",
  role_id: "sample",
  name: "Jordan (sample)",
  status: "completed",
  created_at: "",
};

const verdict: Verdict = {
  id: "sample",
  candidate_id: "sample",
  created_at: "",
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

export default function SamplePage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.6)]" />
            Clarion
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              Sample verdict
            </span>
            <Link
              href="/roles"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft"
            >
              Try it free
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="mb-6 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted">
          This is an example of Clarion&apos;s glass-box verdict — every score links to the exact
          words behind it. Expand a criterion to see the evidence highlighted in the transcript.
        </p>
        <VerdictView
          candidate={candidate}
          verdict={verdict}
          fullText={TRANSCRIPT}
          recordingUrl={null}
          readOnly
        />
      </main>
    </div>
  );
}
