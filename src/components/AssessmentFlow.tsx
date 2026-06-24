"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AptitudeTest from "@/components/AptitudeTest";
import SkillsTest from "@/components/SkillsTest";
import InterviewRoom from "@/components/InterviewRoom";
import { ease } from "@/lib/motion";
import type { ClientTestQuestion } from "@/lib/types";

type Phase = "intro" | "aptitude" | "skills" | "bridge" | "interview";

export default function AssessmentFlow({
  token,
  roleTitle,
  orgName,
  aptitudeQuestions,
  skillsQuestions,
  interviewQuestionCount,
}: {
  token: string;
  roleTitle: string;
  orgName: string | null;
  aptitudeQuestions: ClientTestQuestion[]; // empty if not needed; answer key stripped
  skillsQuestions: string[]; // empty if not needed
  interviewQuestionCount: number;
}) {
  const hasAptitude = aptitudeQuestions.length > 0;
  const hasSkills = skillsQuestions.length > 0;

  const [phase, setPhase] = useState<Phase>("intro");
  const [interviewReady, setInterviewReady] = useState<{
    candidateName: string;
    interviewQuestions: string[];
    rubric: unknown[];
  } | null>(null);

  // The first incomplete step after the intro.
  const firstStep: Phase = hasAptitude ? "aptitude" : hasSkills ? "skills" : "bridge";

  function afterAptitude() {
    setPhase(hasSkills ? "skills" : "bridge");
    if (!hasSkills) void loadInterview();
  }

  function afterSkills() {
    setPhase("bridge");
    void loadInterview();
  }

  async function loadInterview() {
    try {
      const res = await fetch(
        `/api/interview/props?token=${encodeURIComponent(token)}`,
      );
      if (res.ok) setInterviewReady(await res.json());
    } catch {
      // fallback handled below
    }
    setPhase("interview");
  }

  if (phase === "aptitude") {
    return (
      <AptitudeTest token={token} questions={aptitudeQuestions} onComplete={afterAptitude} />
    );
  }

  if (phase === "skills") {
    return (
      <SkillsTest token={token} questions={skillsQuestions} onComplete={afterSkills} />
    );
  }

  if (phase === "bridge") {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl font-semibold text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Written section complete</h1>
          <p className="mt-3 text-muted">
            Great work. Now get ready for the final part — a short voice
            conversation with Clarion about your experience and approach.
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

  // Intro — lay out every part the candidate will complete.
  const parts: { tag: string; title: string; meta: string; sub: string }[] = [];
  if (hasAptitude)
    parts.push({
      tag: `Part ${parts.length + 1}`,
      title: "Aptitude test",
      meta: `${aptitudeQuestions.length} questions · 20 min · proctored`,
      sub: "Numerical, verbal & logical reasoning",
    });
  if (hasSkills)
    parts.push({
      tag: `Part ${parts.length + 1}`,
      title: "Skills work-sample",
      meta: `${skillsQuestions.length} written questions`,
      sub: "Role-specific, scored on substance",
    });
  parts.push({
    tag: `Part ${parts.length + 1}`,
    title: "Voice interview",
    meta: `${interviewQuestionCount} questions · ≈ ${Math.round(interviewQuestionCount * 2.5)} min`,
    sub: "Behavioural questions with Clarion AI",
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: ease.out }}
        className="flex min-h-screen flex-1 items-center justify-center px-6 py-12"
      >
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d6d0ff,#6d5ef8_50%,#3b2fb0)] shadow-[0_0_40px_8px_rgba(109,94,248,0.5)]" />
          <h1 className="text-2xl font-semibold">{roleTitle}</h1>
          {orgName && <p className="mt-1 text-sm text-muted">with {orgName}</p>}

          <div
            className={`mt-6 grid gap-3 ${parts.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            {parts.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-card/50 p-4 text-left"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {p.tag}
                </p>
                <p className="mt-1 font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-muted">{p.meta}</p>
                <p className="mt-1 text-xs text-muted">{p.sub}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted">
            Complete every part in one sitting.{" "}
            {hasAptitude && (
              <>
                The aptitude test is timed and{" "}
                <span className="text-foreground">proctored via screen share</span> —
                use a desktop browser.{" "}
              </>
            )}
          </p>

          <button
            onClick={() => setPhase(firstStep)}
            className="mt-8 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft"
          >
            Begin {parts[0].title}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
