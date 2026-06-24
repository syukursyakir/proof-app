"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";

export default function SkillsTest({
  token,
  questions,
  onComplete,
}: {
  token: string;
  questions: string[];
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(questions.length).fill(""),
  );
  const [submitting, setSubmitting] = useState(false);

  const answered = answers.filter((a) => a.trim().length > 0).length;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/skills-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: questions.map((q, i) => ({ question: q, answer: answers[i] ?? "" })),
        }),
      });
    } catch {
      // best effort — scoring is server-side
    }
    onComplete();
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Skills work-sample
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Show your thinking</h1>
          <p className="mt-2 text-sm text-muted">
            A few short, role-specific questions. Answer in your own words — there&apos;s
            no timer, but keep it focused. This is scored on the substance of your
            answer, not length or polish.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: ease.out }}
              className="rounded-2xl border border-border bg-card/50 p-5"
            >
              <label className="text-sm font-medium leading-6">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {q}
              </label>
              <textarea
                className="mt-3 min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Type your answer…"
                value={answers[i] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => a.map((x, idx) => (idx === i ? e.target.value : x)))
                }
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted">
            {answered} of {questions.length} answered
          </p>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
