"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AssessmentForm from "@/components/AssessmentForm";
import { ease } from "@/lib/motion";
import type { Assessment } from "@/lib/types";

type Phase = "describe" | "followups" | "building" | "ready";

const BUILDING_STEPS = [
  "Analysing your description…",
  "Identifying role requirements…",
  "Building your rubric…",
  "Writing interview questions…",
];

export default function NewRolePage() {
  const [phase, setPhase] = useState<Phase>("describe");
  const [description, setDescription] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [buildStep, setBuildStep] = useState(0);
  useEffect(() => {
    if (phase !== "building") return;
    setBuildStep(0);
    const id = setInterval(
      () => setBuildStep((s) => Math.min(s + 1, BUILDING_STEPS.length - 1)),
      3200,
    );
    return () => clearInterval(id);
  }, [phase]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError("Microphone blocked — type your description below instead.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "description.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Transcription failed");
      const { text } = await res.json();
      setDescription((d) => (d ? d + " " + text : text));
    } catch {
      setError("Couldn't transcribe — type your description below instead.");
    } finally {
      setTranscribing(false);
    }
  }

  async function getFollowups() {
    if (!description.trim()) {
      setError("Describe the role first (speak or type).");
      return;
    }
    setError(null);
    setPhase("building");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setFollowups(data.followups ?? []);
      setAnswers(new Array((data.followups ?? []).length).fill(""));
      setPhase("followups");
    } catch {
      setError("Something went wrong. Try again.");
      setPhase("describe");
    }
  }

  async function buildAssessment() {
    setError(null);
    setPhase("building");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          answers: followups.map((q, i) => ({ q, a: answers[i] ?? "" })),
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setAssessment({
        title: data.title ?? "New role",
        occupation: data.occupation ?? null,
        rubric: data.rubric ?? [],
        test_questions: data.test_questions ?? [],
        interview_questions: data.interview_questions ?? [],
      });
      setPhase("ready");
    } catch {
      setError("Something went wrong. Try again.");
      setPhase("followups");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/roles" className="text-sm text-muted hover:text-foreground">
            ← Roles
          </Link>
          <span className="text-sm font-medium">New role</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: ease.out }}
          >
        {phase === "describe" && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Describe your ideal hire
            </h1>
            <p className="mt-2 text-muted">
              Speak it out loud, or type. Mention the role, the key skills, and what
              great looks like.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                className={`inline-flex h-12 items-center gap-2 rounded-full px-6 font-medium text-white transition-colors disabled:opacity-60 ${
                  recording ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-accent-soft"
                }`}
              >
                <span aria-hidden>🎙️</span>
                {recording ? "Stop recording" : "Record description"}
              </button>
              {transcribing && <span className="text-sm text-muted">Transcribing…</span>}
              {recording && (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Listening
                </span>
              )}
            </div>

            <textarea
              className="mt-6 min-h-40 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="e.g. I need a customer support rep who stays calm with angry customers, takes ownership of problems, and communicates clearly…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={getFollowups}
              className="mt-6 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              Next →
            </button>
          </div>
        )}

        {phase === "building" && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="orb-pulse orb-glow h-20 w-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,#b9aefff2,#6d5ef8_45%,#3b2fb0_100%)]" />
            <p className="min-h-[1.5rem] text-muted transition-all duration-500">
              {BUILDING_STEPS[buildStep]}
            </p>
            <div className="flex gap-1.5">
              {BUILDING_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                    i <= buildStep ? "bg-accent" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "followups" && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Two quick questions
            </h1>
            <p className="mt-2 text-muted">
              These sharpen the assessment. Answer briefly.
            </p>
            <div className="mt-8 space-y-6">
              {followups.map((q, i) => (
                <div key={i}>
                  <label className="text-sm font-medium">{q}</label>
                  <input
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) =>
                        a.map((x, idx) => (idx === i ? e.target.value : x)),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              onClick={buildAssessment}
              className="mt-8 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              Generate assessment →
            </button>
          </div>
        )}

        {phase === "ready" && assessment && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Review &amp; edit
            </h1>
            <p className="mt-2 mb-8 text-muted">
              Clarion drafted this. Edit anything, then save.
            </p>
            {assessment.occupation?.soc_code &&
              (assessment.occupation.soc_code.startsWith("15") ||
                assessment.occupation.soc_code.startsWith("17")) && (
              <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Technical role detected.</strong> Voice interviews assess
                communication and problem-solving approach — consider pairing
                with a take-home test to evaluate hands-on technical skill.
              </div>
            )}
            <AssessmentForm
              mode="create"
              initial={{
                title: assessment.title,
                description_raw: description,
                occupation: assessment.occupation,
                rubric: assessment.rubric,
                test_questions: assessment.test_questions,
                interview_questions: assessment.interview_questions,
                test_enabled: true,
              }}
            />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
