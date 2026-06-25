"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AptitudeTest from "@/components/AptitudeTest";
import SkillsTest from "@/components/SkillsTest";
import InterviewRoom from "@/components/InterviewRoom";
import ResumeUpload from "@/components/ResumeUpload";
import Logo from "@/components/Logo";
import { ease } from "@/lib/motion";
import { useLocale } from "@/components/LocaleProvider";
import type { ClientTestQuestion } from "@/lib/types";

type Phase = "intro" | "resume" | "aptitude" | "skills" | "bridge" | "interview";

export default function AssessmentFlow({
  token,
  roleTitle,
  orgName,
  aptitudeQuestions,
  skillsQuestions,
  interviewQuestionCount,
  resumeMode = "off",
}: {
  token: string;
  roleTitle: string;
  orgName: string | null;
  aptitudeQuestions: ClientTestQuestion[]; // empty if not needed; answer key stripped
  skillsQuestions: string[]; // empty if not needed
  interviewQuestionCount: number;
  resumeMode?: "off" | "optional" | "required";
}) {
  const hasAptitude = aptitudeQuestions.length > 0;
  const hasSkills = skillsQuestions.length > 0;
  const { dict } = useLocale();
  const t = dict.assessment;

  const [phase, setPhase] = useState<Phase>("intro");
  const [interviewReady, setInterviewReady] = useState<{
    candidateName: string;
    interviewQuestions: string[];
    rubric: unknown[];
  } | null>(null);

  // The first incomplete step after the intro.
  const firstStep: Phase = hasAptitude ? "aptitude" : hasSkills ? "skills" : "bridge";

  // After the intro, go to the resume step first if the role asks for one.
  const afterIntro: Phase = resumeMode !== "off" ? "resume" : firstStep;

  function afterResume() {
    if (hasAptitude) setPhase("aptitude");
    else if (hasSkills) setPhase("skills");
    else {
      setPhase("bridge");
      void loadInterview();
    }
  }

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

  if (phase === "resume" && resumeMode !== "off") {
    return (
      <ResumeUpload
        token={token}
        mode={resumeMode}
        orgName={orgName}
        onComplete={afterResume}
      />
    );
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
          <h1 className="text-2xl font-semibold">
            {hasAptitude || hasSkills ? t.bridgeComplete : t.bridgeAllSet}
          </h1>
          <p className="mt-3 text-muted">{t.bridgeReady}</p>
          <p className="mt-2 text-sm text-muted">{t.bridgeLoading}</p>
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
        <p className="text-muted">{t.loadingInterview}</p>
      </div>
    );
  }

  // Intro — lay out every part the candidate will complete.
  const parts: { tag: string; title: string; meta: string; sub: string }[] = [];
  if (hasAptitude)
    parts.push({
      tag: t.partNumber.replace("{n}", String(parts.length + 1)),
      title: t.partAptitude,
      meta: t.partAptitudeMeta.replace("{n}", String(aptitudeQuestions.length)),
      sub: t.partAptitudeSub,
    });
  if (hasSkills)
    parts.push({
      tag: t.partNumber.replace("{n}", String(parts.length + 1)),
      title: t.partSkills,
      meta: t.partSkillsMeta.replace("{n}", String(skillsQuestions.length)),
      sub: t.partSkillsSub,
    });
  parts.push({
    tag: t.partNumber.replace("{n}", String(parts.length + 1)),
    title: t.partInterview,
    meta: t.partInterviewMeta
      .replace("{n}", String(interviewQuestionCount))
      .replace("{m}", String(Math.round(interviewQuestionCount * 2.5))),
    sub: t.partInterviewSub,
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
          <Logo size={44} className="mx-auto mb-7 w-fit text-xl" />
          <h1 className="text-2xl font-semibold">{roleTitle}</h1>
          {orgName && <p className="mt-1 text-sm text-muted">{t.withOrg.replace("{orgName}", orgName)}</p>}

          <div
            className={`mt-6 grid gap-3 ${
              parts.length === 3
                ? "sm:grid-cols-3"
                : parts.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:max-w-xs sm:mx-auto"
            }`}
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
            {t.onesitting}{" "}
            {hasAptitude && (
              <span className="text-foreground">{t.proctored}</span>
            )}
          </p>

          <button
            onClick={() => {
              setPhase(afterIntro);
              // No resume/aptitude/skills step at all — go straight to the
              // interview. Every other entry point calls loadInterview() from
              // its own onComplete handler; this is the only one that skips
              // straight to "bridge" without passing through one of those.
              if (afterIntro === "bridge") void loadInterview();
            }}
            className="mt-8 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft"
          >
            {afterIntro === "resume"
              ? t.getStarted
              : t.begin.replace("{title}", parts[0].title)}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
