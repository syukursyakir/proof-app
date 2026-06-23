"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ease } from "@/lib/motion";
import type { TestQuestion } from "@/lib/types";

const MINUTES = 20;
const CATEGORY_LABEL: Record<string, string> = {
  numerical: "Numerical reasoning",
  verbal: "Verbal reasoning",
  logical: "Logical reasoning",
  sjt: "Situational judgement",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function AptitudeTest({
  token,
  questions,
  onComplete,
}: {
  token: string;
  questions: TestQuestion[];
  onComplete: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MINUTES * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          void submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[current];
  const isLast = current === questions.length - 1;

  async function submit(forced = false) {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    const finalAnswers = forced
      ? { ...answers, ...(selected !== null ? { [q.id]: selected } : {}) }
      : answers;
    try {
      await fetch("/api/test-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers: finalAnswers }),
      });
    } catch {
      // best effort
    }
    onComplete();
  }

  function confirm() {
    if (selected === null) return;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    setConfirmed(true);
  }

  function advance() {
    if (isLast) {
      void submit();
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerWarning = secondsLeft < 120;

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Part 1 of 2 — Aptitude assessment
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Question {current + 1} of {questions.length} ·{" "}
              <span className="text-foreground">{CATEGORY_LABEL[q.category]}</span>
            </p>
          </div>
          <div
            className={`rounded-full border px-4 py-1.5 font-mono text-sm font-semibold tabular-nums ${
              timerWarning
                ? "border-red-300 bg-red-50 text-red-600"
                : "border-border bg-card/50 text-foreground"
            }`}
          >
            {pad(mins)}:{pad(secs)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: ease.out }}
          />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: ease.out }}
            className="rounded-2xl border border-border bg-card/50 p-8"
          >
            <p className="text-lg font-medium leading-7">{q.question}</p>
            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isLocked = confirmed;
                const isCorrect = confirmed && i === q.correct;
                const isWrong = confirmed && isSelected && i !== q.correct;

                return (
                  <button
                    key={i}
                    disabled={isLocked}
                    onClick={() => !isLocked && setSelected(i)}
                    className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left text-sm transition-all ${
                      isCorrect
                        ? "border-green-400 bg-green-50 text-green-800"
                        : isWrong
                          ? "border-red-300 bg-red-50 text-red-700"
                          : isSelected
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border bg-background hover:border-accent/60"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                        isCorrect
                          ? "border-green-500 bg-green-500 text-white"
                          : isWrong
                            ? "border-red-400 bg-red-400 text-white"
                            : isSelected
                              ? "border-accent bg-accent text-white"
                              : "border-border text-muted"
                      }`}
                    >
                      {isCorrect ? "✓" : isWrong ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted">
            {confirmed
              ? "Answer locked in."
              : selected !== null
                ? "Review your answer before confirming."
                : "Select an answer."}
          </p>
          {!confirmed ? (
            <button
              onClick={confirm}
              disabled={selected === null}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-40"
            >
              Confirm answer
            </button>
          ) : (
            <button
              onClick={advance}
              disabled={submitting}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-60"
            >
              {submitting ? "Submitting…" : isLast ? "Submit test" : "Next question →"}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Answers are locked once confirmed — you cannot go back. The test
          auto-submits when the timer reaches zero.
        </p>
      </div>
    </div>
  );
}
