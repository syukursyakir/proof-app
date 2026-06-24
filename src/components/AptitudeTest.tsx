"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ease } from "@/lib/motion";
import { supabaseBrowser } from "@/lib/supabase";
import type { ClientTestQuestion } from "@/lib/types";

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
  questions: ClientTestQuestion[];
  onComplete: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [shareLost, setShareLost] = useState(false);
  const [recording, setRecording] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MINUTES * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Always points at the latest submit() so the timer's auto-submit uses CURRENT
  // answers/flags (not a stale closure from when the test started).
  const submitRef = useRef<(forced?: boolean) => void>(() => {});

  // Request screen share + start recording. Required to begin the test.
  async function requestScreenAndStart() {
    setShareError(null);
    setRequesting(true);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setShareError(
          "Screen sharing isn't supported in this browser. Please use a desktop browser (Chrome, Edge, or Firefox) to take the timed test.",
        );
        setRequesting(false);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = stream;

      // If the candidate stops sharing mid-test, flag it.
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setShareLost(true);
      });

      try {
        const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.start();
        recorderRef.current = rec;
        setRecording(true);
      } catch {
        // recording unsupported — proceed; the share itself is still the deterrent
      }
      setStarted(true);
    } catch {
      setShareError(
        "Screen sharing was declined. It's required for this timed assessment — please share your entire screen to begin.",
      );
    } finally {
      setRequesting(false);
    }
  }

  // Flag tab/window switches during the test (the most common cheat: looking
  // up answers). An honest signal, surfaced to the employer — not a hard block.
  useEffect(() => {
    if (!started) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") setTabSwitches((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          submitRef.current(true); // latest closure → current answers/flags
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Stop screen capture and upload the recording; returns the storage path.
  async function uploadProctorRecording(): Promise<string | null> {
    const rec = recorderRef.current;
    const stream = screenStreamRef.current;
    const path = await new Promise<string | null>((resolve) => {
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const signRes = await fetch("/api/recordings/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (!signRes.ok) return resolve(null);
          const { path: p, signedToken } = await signRes.json();
          const supa = supabaseBrowser();
          const { error } = await supa.storage
            .from("recordings")
            .uploadToSignedUrl(p, signedToken, blob);
          resolve(error ? null : p);
        } catch {
          resolve(null);
        }
      };
      rec.stop();
    });
    stream?.getTracks().forEach((t) => t.stop());
    return path;
  }

  const q = questions[current];
  const isLast = current === questions.length - 1;

  async function submit(forced = false) {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    const finalAnswers = forced
      ? { ...answers, ...(selected !== null ? { [q.id]: selected } : {}) }
      : answers;
    const proctorPath = await uploadProctorRecording();
    try {
      await fetch("/api/test-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: finalAnswers,
          proctor_recording_url: proctorPath,
          proctor_flags: { share_lost: shareLost, tab_switches: tabSwitches },
        }),
      });
    } catch {
      // best effort
    }
    onComplete();
  }
  submitRef.current = submit; // keep the timer's reference fresh every render

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

  // Screen-share gate — must share before the timed test begins.
  if (!started) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-3xl">
            🖥️
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Part 1 of 2 — Aptitude assessment
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Share your screen to begin
          </h1>
          <p className="mt-3 text-muted">
            This is a timed, proctored test. To keep it fair for everyone, your
            screen is recorded while you answer — so the employer can see the
            test was taken honestly, without help or lookups.
          </p>
          <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-muted">
            <li>• {questions.length} questions · {MINUTES} minutes</li>
            <li>• Choose <span className="text-foreground">your entire screen</span> when prompted</li>
            <li>• Keep this tab focused — answers lock when confirmed</li>
          </ul>
          {shareError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {shareError}
            </p>
          )}
          <button
            onClick={requestScreenAndStart}
            disabled={requesting}
            className="mt-6 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
          >
            {requesting ? "Waiting for screen share…" : "Share screen & start test"}
          </button>
          <p className="mt-4 text-xs text-muted">
            Desktop browser required for Part 1. Your recording is private to the
            employer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Proctoring indicator */}
        <div className="mb-4 flex items-center justify-center gap-2 text-xs">
          {shareLost ? (
            <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Screen sharing stopped — this will be flagged.
            </span>
          ) : recording ? (
            <span className="flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Screen recording — proctored
            </span>
          ) : (
            <span className="rounded-full bg-card/70 px-3 py-1 text-muted">
              Timed assessment
            </span>
          )}
        </div>

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
            className={`tnum rounded-full border px-4 py-1.5 font-mono text-sm font-semibold tabular-nums ${
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
                // No correctness reveal — the answer key never reaches the
                // candidate's browser. Scoring is done server-side.
                return (
                  <button
                    key={i}
                    disabled={isLocked}
                    onClick={() => !isLocked && setSelected(i)}
                    className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left text-sm transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border bg-background hover:border-accent/60"
                    } ${isLocked ? "opacity-90" : ""}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                        isSelected
                          ? "border-accent bg-accent text-white"
                          : "border-border text-muted"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
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
