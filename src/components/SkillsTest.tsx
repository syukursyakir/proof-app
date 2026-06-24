"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";

// One question's answer box: type, or record a voice answer (transcribed).
function AnswerBox({
  token,
  value,
  onChange,
}: {
  token: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("audio", blob, "answer.webm");
          fd.append("token", token);
          const res = await fetch("/api/candidate-transcribe", { method: "POST", body: fd });
          if (res.ok) {
            const { text } = await res.json();
            onChange(value ? `${value} ${text}` : text);
          }
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }
  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="mt-3">
      <textarea
        className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        placeholder="Type your answer — or record it by voice below."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stopRec : startRec}
          disabled={transcribing}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
            recording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "border border-border text-foreground/80 hover:border-accent"
          }`}
        >
          <span aria-hidden>🎙️</span>
          {recording ? "Stop & transcribe" : "Answer by voice"}
        </button>
        {recording && (
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Recording
          </span>
        )}
        {transcribing && <span className="text-xs text-muted">Transcribing…</span>}
      </div>
    </div>
  );
}

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
          <h1 className="mt-1 text-2xl font-semibold">A quick taste of the job</h1>
          <p className="mt-2 text-sm text-muted">
            A couple of realistic tasks — do them as you actually would. Type or
            answer by voice. You&apos;re scored on the substance of your work, not
            length or polish.
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
              <AnswerBox
                token={token}
                value={answers[i] ?? ""}
                onChange={(v) =>
                  setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)))
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
