"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AptitudeTest from "@/components/AptitudeTest";
import InterviewRoom from "@/components/InterviewRoom";
import { ease } from "@/lib/motion";
import type { TestQuestion } from "@/lib/types";

type Phase = "intro" | "test" | "bridge" | "interview";

export default function AptitudeGate({
  token,
  roleTitle,
  orgName,
  questions,
  interviewQuestionCount,
}: {
  token: string;
  roleTitle: string;
  orgName: string | null;
  questions: TestQuestion[];
  interviewQuestionCount: number;
}) {
  const [phase, setPhase] = useState<Phase>("intro");

  // Interview props are fetched server-side and baked in via the page;
  // we re-fetch them here via a lightweight inline load on bridge → interview.
  const [interviewReady, setInterviewReady] = useState<{
    candidateName: string;
    interviewQuestions: string[];
    rubric: unknown[];
  } | null>(null);

  async function loadInterview() {
    try {
      const res = await fetch(`/api/interview/props?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setInterviewReady(data);
      }
    } catch {
      // fallback handled below
    }
    setPhase("interview");
  }

  if (phase === "test") {
    return (
      <AptitudeTest
        token={token}
        questions={questions}
        onComplete={() => {
          setPhase("bridge");
          void loadInterview();
        }}
      />
    );
  }

  if (phase === "bridge") {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl font-semibold text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Part 1 complete</h1>
          <p className="mt-3 text-muted">
            Great work. Now get ready for Part 2 — a short voice conversation
            with Clarion about your experience and approach.
          </p>
          <p className="mt-2 text-sm text-muted">Loading your interview…</p>
        </div>
      </div>
    );
  }

  if (phase === "interview" && interviewReady) {
    return (
      <InterviewRoom
        token={token}
        candidateName={interviewReady.candidateName}
        roleTitle={roleTitle}
        questions={interviewReady.interviewQuestions as string[]}
        rubric={interviewReady.rubric as never}
        agentConfigured={true}
        orgName={orgName}
      />
    );
  }

  if (phase === "interview" && !interviewReady) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6">
        <p className="text-muted">Loading interview…</p>
      </div>
    );
  }

  // Intro screen
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: ease.out }}
        className="flex min-h-screen flex-1 items-center justify-center px-6 py-12"
      >
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d6d0ff,#6d5ef8_50%,#3b2fb0)] shadow-[0_0_40px_8px_rgba(109,94,248,0.5)]" />
          <h1 className="text-2xl font-semibold">{roleTitle}</h1>
          {orgName && <p className="mt-1 text-sm text-muted">with {orgName}</p>}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Part 1
              </p>
              <p className="mt-1 font-semibold">Aptitude test</p>
              <p className="mt-1 text-sm text-muted">
                {questions.length} questions · {20} min
              </p>
              <p className="mt-1 text-xs text-muted">
                Numerical, verbal &amp; logical reasoning
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Part 2
              </p>
              <p className="mt-1 font-semibold">Voice interview</p>
              <p className="mt-1 text-sm text-muted">
                {interviewQuestionCount} questions · ≈{" "}
                {Math.round(interviewQuestionCount * 2.5)} min
              </p>
              <p className="mt-1 text-xs text-muted">
                Behavioural questions with Clarion AI
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted">
            Complete both parts in one sitting. Part 1 is timed and{" "}
            <span className="text-foreground">proctored via screen share</span> —
            use a desktop browser. Answers lock when you confirm them.
          </p>

          <button
            onClick={() => setPhase("test")}
            className="mt-8 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft"
          >
            Begin Part 1
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
