"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AssessmentForm from "@/components/AssessmentForm";
import RolePicker from "@/components/RolePicker";
import { ease } from "@/lib/motion";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import type { Assessment, TestQuestion } from "@/lib/types";

type Phase = "language" | "pick" | "describe" | "followups" | "building" | "ready";

export default function NewRolePage() {
  const { dict, locale: siteLocale } = useSiteLocale();
  const w = dict.employer.wizard;
  const f = dict.employer.form;
  const BUILDING_STEPS = w.buildingSteps;
  const [phase, setPhase] = useState<Phase>("language");
  const [language, setLanguage] = useState<string>(siteLocale);
  const [description, setDescription] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [testMcq, setTestMcq] = useState<TestQuestion[] | null>(null);
  const [terms, setTerms] = useState<string[] | null>(null);
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
      setError(w.micBlocked);
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
      setError(w.transcribeFailed);
    } finally {
      setTranscribing(false);
    }
  }

  async function getFollowups() {
    if (!description.trim()) {
      setError(w.describeFirst);
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
      setError(w.genericError);
      setPhase("describe");
    }
  }

  // Shared: turn a description + Q/A pairs into the full assessment draft.
  async function generateAssessment(
    desc: string,
    qa: { q: string; a: string }[],
    onError: () => void,
  ) {
    setError(null);
    setPhase("building");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, answers: qa, language }),
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
      setTestMcq(Array.isArray(data.test_mcq) ? data.test_mcq : null);
      setTerms(Array.isArray(data.terms) ? data.terms : null);
      setPhase("ready");
    } catch {
      setError(w.genericError);
      onError();
    }
  }

  function buildAssessment() {
    void generateAssessment(
      description,
      followups.map((q, i) => ({ q, a: answers[i] ?? "" })),
      () => setPhase("followups"),
    );
  }

  // From the click-first picker: role + chosen skills -> assessment.
  function buildFromPicks(role: string, skills: string[]) {
    setDescription(`${role} — key skills: ${skills.join(", ")}`);
    void generateAssessment(
      `Hiring for the role: ${role}.`,
      [
        {
          q: "The most important skills and qualities to assess for this role",
          a: skills.join(", "),
        },
      ],
      () => setPhase("pick"),
    );
  }

  const stepIndex = phase === "ready" ? 1 : 0; // Build -> Review -> Invite
  const STEPS = w.steps;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Focused top bar: title · step indicator · close */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/roles"
            aria-label={w.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-foreground"
          >
            ✕
          </Link>
          <span className="truncate font-medium">{w.headerTitle}</span>
        </div>

        {/* Stepper */}
        <ol className="hidden items-center gap-1 sm:flex">
          {STEPS.map((label, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <li key={label} className="flex items-center gap-1">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    done
                      ? "bg-accent text-white"
                      : active
                        ? "bg-accent/15 text-accent-soft ring-1 ring-accent"
                        : "bg-card text-muted ring-1 ring-border"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${active ? "font-medium text-foreground" : "text-muted"}`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-2 h-px w-6 bg-border" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="w-9 sm:w-24" aria-hidden />
      </header>

      {/* Scrollable focused content */}
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: ease.out }}
            >
        {phase === "language" && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {f.candidateLanguage}
            </h1>
            <p className="mt-2 text-muted">{f.candidateLanguageDesc}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    language === l.code
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted hover:border-accent"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPhase("pick")}
              className="mt-8 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              {w.next}
            </button>
          </div>
        )}

        {phase === "pick" && (
          <div>
            <button
              onClick={() => setPhase("language")}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
            >
              ← {f.candidateLanguage}
            </button>
            <RolePicker
              onComplete={buildFromPicks}
              onDescribeInstead={() => setPhase("describe")}
            />
          </div>
        )}

        {phase === "describe" && (
          <div>
            <button
              onClick={() => setPhase("pick")}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
            >
              {w.pickInstead}
            </button>
            <h1 className="text-3xl font-semibold tracking-tight">
              {w.describeTitle}
            </h1>
            <p className="mt-2 text-muted">{w.describeSubtitle}</p>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                className={`inline-flex h-12 items-center gap-2 rounded-full px-6 font-medium text-white transition-colors disabled:opacity-60 ${
                  recording ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-accent-soft"
                }`}
              >
                <span aria-hidden>🎙️</span>
                {recording ? w.stopRecording : w.recordDescription}
              </button>
              {transcribing && <span className="text-sm text-muted">{w.transcribing}</span>}
              {recording && (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {w.listening}
                </span>
              )}
            </div>

            <textarea
              className="mt-6 min-h-40 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder={w.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={getFollowups}
              className="mt-6 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              {w.next}
            </button>
          </div>
        )}

        {phase === "building" && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Clarion"
              width={72}
              height={72}
              className="orb-pulse rounded-2xl drop-shadow-[0_10px_36px_rgba(42,62,98,0.45)]"
              style={{ width: 72, height: 72 }}
            />
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
              {w.followupsTitle}
            </h1>
            <p className="mt-2 text-muted">{w.followupsSubtitle}</p>
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
              {w.generateAssessment}
            </button>
          </div>
        )}

        {phase === "ready" && assessment && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {w.reviewTitle}
            </h1>
            <p className="mt-2 mb-8 text-muted">{w.reviewSubtitle}</p>
            {assessment.occupation?.soc_code &&
              (assessment.occupation.soc_code.startsWith("15") ||
                assessment.occupation.soc_code.startsWith("17")) && (
              <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>{w.technicalDetected}</strong> {w.technicalNote}
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
                test_mcq: testMcq,
                interview_questions: assessment.interview_questions,
                terms: terms,
                test_enabled: true,
                language,
              }}
            />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
