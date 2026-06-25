"use client";

import { useState } from "react";
import AppealButton from "@/components/AppealButton";
import type { Turn } from "@/lib/types";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

// Accessible, written alternative to the voice interview (ADA / no-mic option).
export default function TextInterview({
  token,
  roleTitle,
  candidateName,
  questions,
}: {
  token: string;
  roleTitle: string;
  candidateName: string;
  questions: string[];
}) {
  const [phase, setPhase] = useState<"intro" | "answering" | "saving" | "done">(
    "intro",
  );
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [error, setError] = useState<string | null>(null);

  function start() {
    fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
    setPhase("answering");
  }

  function setAnswer(v: string) {
    setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)));
  }

  async function submit() {
    setPhase("saving");
    setError(null);
    const turns: Turn[] = [];
    questions.forEach((q, idx) => {
      turns.push({ role: "agent", text: q });
      turns.push({ role: "user", text: answers[idx] ?? "" });
    });
    const fullText = turns
      .map((t) => `${t.role === "agent" ? "Interviewer" : "Candidate"}: ${t.text}`)
      .join("\n");
    try {
      const res = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, full_text: fullText, turns }),
      });
      if (!res.ok) throw new Error("Could not submit");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
      setPhase("answering");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
      {phase === "intro" && (
        <div>
          <h1 className="text-2xl font-semibold">Written interview — {roleTitle}</h1>
          <p className="mt-3 text-muted">
            You&apos;ll answer {questions.length} questions in writing. Take your time;
            you can move back and forth. Your answers are assessed against the same
            rubric as everyone else.
          </p>
          <p className="mt-4 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted">
            Your responses are recorded for the employer to review. A human makes the
            final decision.
          </p>
          <Button onClick={start} className="mt-6">
            Start written interview
          </Button>
        </div>
      )}

      {phase === "answering" && (
        <div>
          <p className="text-sm text-muted">
            Question {i + 1} of {questions.length}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{questions[i]}</h2>
          <label htmlFor="answer" className="sr-only">
            Your answer
          </label>
          <Textarea
            id="answer"
            size="lg"
            autoFocus
            className="mt-4"
            placeholder="Type your answer…"
            value={answers[i] ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
          />
          {error && <p className="mt-3 text-sm text-accent-clay">{error}</p>}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setI((n) => Math.max(0, n - 1))}
              disabled={i === 0}
            >
              ← Back
            </Button>
            {i < questions.length - 1 ? (
              <Button onClick={() => setI((n) => n + 1)}>Next →</Button>
            ) : (
              <Button onClick={submit}>Submit interview</Button>
            )}
          </div>
        </div>
      )}

      {phase === "saving" && <p className="text-center text-muted">Submitting…</p>}

      {phase === "done" && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Interview complete 🎉</h1>
          <p className="mt-3 text-muted">
            Thanks, {candidateName}. Your answers have been sent to the employer.
          </p>
          <AppealButton token={token} />
        </div>
      )}
    </div>
  );
}
