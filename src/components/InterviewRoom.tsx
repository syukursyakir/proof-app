"use client";

import { useCallback, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import VoiceOrb from "@/components/VoiceOrb";
import Logo from "@/components/Logo";
import TextInterview from "@/components/TextInterview";
import AppealButton from "@/components/AppealButton";
import DeviceCheck from "@/components/DeviceCheck";
import { supabaseBrowser } from "@/lib/supabase";
import {
  buildInterviewPrompt,
  interviewFirstMessage,
} from "@/lib/prompts";
import type { Criterion, Turn } from "@/lib/types";

type Props = {
  token: string;
  candidateName: string;
  roleTitle: string;
  questions: string[];
  rubric: Criterion[];
  agentConfigured: boolean;
  orgName?: string | null;
  terms?: string[];
};

type Phase = "consent" | "connecting" | "live" | "saving" | "done" | "error";

export default function InterviewRoom(props: Props) {
  return (
    <ConversationProvider>
      <Room {...props} />
    </ConversationProvider>
  );
}

function Room({
  token,
  candidateName,
  roleTitle,
  questions,
  rubric,
  agentConfigured,
  orgName,
  terms,
}: Props) {
  const [phase, setPhase] = useState<Phase>("consent");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [caption, setCaption] = useState("");
  const [lines, setLines] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const finishingRef = useRef(false);
  const connectedAtRef = useRef(0);

  const conversation = useConversation({
    onConnect: () => {
      connectedAtRef.current = Date.now();
      setPhase("live");
    },
    onDisconnect: () => {
      if (finishingRef.current) return;
      // Guard against a premature/dropped session: if the candidate never spoke
      // and we just connected, this isn't a real interview ending — don't mark
      // it complete. Let them retry.
      const hadUserTurn = turnsRef.current.some((t) => t.role === "user");
      const elapsed = Date.now() - (connectedAtRef.current || Date.now());
      if (!hadUserTurn && elapsed < 20000) {
        setError(
          "The interview disconnected before it really started. This is usually a brief network hiccup — please start it again.",
        );
        setPhase("error");
        return;
      }
      // A genuine end (agent finished, or candidate ended) — save everything.
      void finalize();
    },
    onError: (msg) => {
      setError(typeof msg === "string" ? msg : "Connection error");
      setPhase("error");
    },
    onMessage: (m: { message: string; source: "user" | "ai" }) => {
      if (!m?.message) return;
      const role: Turn["role"] = m.source === "ai" ? "agent" : "user";
      turnsRef.current.push({ role, text: m.message, t: Date.now() });
      setLines((prev) => [...prev, { role, text: m.message }].slice(-6));
      if (m.source === "ai") setCaption(m.message);
    },
  });

  // Stable accessor for the orb (conversation identity changes each render).
  const convRef = useRef(conversation);
  convRef.current = conversation;
  const getLevel = useCallback(() => {
    try {
      const c = convRef.current;
      // react to the AI's voice while speaking, the candidate's mic while listening
      return c.isSpeaking ? c.getOutputVolume() : c.getInputVolume();
    } catch {
      return 0;
    }
  }, []);

  async function start() {
    setError(null);
    if (!agentConfigured) {
      setError(
        "The interview agent isn't configured yet (missing ElevenLabs keys).",
      );
      setPhase("error");
      return;
    }
    setPhase("connecting");

    // Log consent + mark interviewing (best-effort, authorized by token).
    fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});

    // Camera + mic for the webcam tile and recording. If video is blocked, fall
    // back to audio-only so we still capture *something* (best-effort).
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        stream = null; // both denied — interview still runs via the SDK
      }
    }
    if (stream) {
      streamRef.current = stream;
      const hasVideo = stream.getVideoTracks().length > 0;
      if (videoRef.current && hasVideo) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Record the candidate's own stream directly. (We do NOT tap the SDK's
      // audio graph — doing so destabilised the live session. The interviewer's
      // side is preserved in the saved transcript.)
      try {
        const mimeType = hasVideo ? "video/webm" : "audio/webm";
        const rec = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorderRef.current = rec;
        rec.start();
      } catch {
        // recording unsupported — continue without it
      }
    }

    try {
      const res = await fetch(
        `/api/eleven-signed-url?token=${encodeURIComponent(token)}`,
      );
      if (!res.ok) throw new Error("Could not start the interview agent.");
      const { signedUrl } = await res.json();

      conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: buildInterviewPrompt(roleTitle, questions, rubric, terms ?? []) },
            firstMessage: interviewFirstMessage(
              roleTitle,
              questions.length,
              rubric.map((c) => c.name),
            ),
          },
        },
        dynamicVariables: {
          role_title: roleTitle,
          candidate_name: candidateName,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview.");
      setPhase("error");
    }
  }

  async function finalize() {
    if (finishingRef.current) return; // run once, whoever ends the call
    finishingRef.current = true;
    setPhase("saving");

    // Stop recording and wait for the final blob.
    const recordingUrl = await new Promise<string | null>((resolve) => {
      const rec = recorderRef.current;
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
          const { path, signedToken } = await signRes.json();
          const supa = supabaseBrowser();
          const { error } = await supa.storage
            .from("recordings")
            .uploadToSignedUrl(path, signedToken, blob);
          if (error) return resolve(null);
          resolve(path); // store the private storage path, not a public URL
        } catch {
          resolve(null);
        }
      };
      rec.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());

    const turns = turnsRef.current;
    const fullText = turns
      .map((t) => `${t.role === "agent" ? "Interviewer" : "Candidate"}: ${t.text}`)
      .join("\n");

    try {
      await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_text: fullText,
          turns,
          recording_url: recordingUrl,
        }),
      });
    } catch {
      /* best effort */
    }
    setPhase("done");
  }

  // Candidate pressed "End interview" — stop the session, then finalize.
  function end() {
    try {
      conversation.endSession();
    } catch {
      /* ignore */
    }
    void finalize();
  }

  // ---- Render ----
  if (mode === "text") {
    return (
      <TextInterview
        token={token}
        roleTitle={roleTitle}
        candidateName={candidateName}
        questions={questions}
      />
    );
  }

  if (phase === "consent") {
    return (
      <Shell>
        <div className="max-w-md text-center">
          <Logo size={44} className="mx-auto mb-7 w-fit text-xl" />
          <h1 className="text-2xl font-semibold">{roleTitle}</h1>
          {orgName && (
            <p className="mt-1 text-sm text-muted">with {orgName}</p>
          )}
          <div className="mt-3 flex justify-center gap-5 text-sm text-muted">
            <span>{questions.length} questions</span>
            <span>≈ {Math.round(questions.length * 2.5)} min</span>
            <span>Same rubric for every candidate</span>
          </div>
          <p className="mt-5 text-muted">
            Speak naturally — you can ask Clarion anything along the way,
            including exactly how you&apos;re being assessed.
          </p>

          {rubric.length > 0 && (
            <div className="mt-5 rounded-lg border border-border bg-card/60 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                What you&apos;ll be assessed on
              </p>
              <ul className="mt-2 space-y-1">
                {rubric.map((c) => (
                  <li key={c.name} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-accent-soft">•</span>
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border/60 pt-2 text-xs text-muted">
                A real person on the hiring team makes the final decision —
                Clarion&apos;s assessment is a recommendation, not a verdict.
              </p>
            </div>
          )}

          <p className="mt-4 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted">
            🔴 This interview is recorded (audio &amp; video) so the employer can
            review it. Your answers are scored against a fixed rubric — only what
            you <span className="text-foreground">say</span> is assessed. No facial
            analysis, no demographic inputs.
          </p>
          <p className="mt-2 text-xs text-muted">
            Your recording is private to {orgName ?? "the hiring team"} — never sold,
            shared, or used to train AI.
          </p>
          <DeviceCheck />
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            onClick={start}
            className="mt-6 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft"
          >
            Start interview
          </button>
          <div className="mt-4">
            <button
              onClick={() => setMode("text")}
              className="text-sm text-muted underline hover:text-foreground"
            >
              Prefer not to use voice? Take the written interview instead
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Can&apos;t start the interview</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setPhase("consent");
            }}
            className="mt-6 rounded-full border border-border px-6 py-2.5 hover:border-accent"
          >
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "done") {
    return (
      <Shell>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl font-semibold text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Assessment complete</h1>
          <p className="mt-3 text-muted">
            Thanks, {candidateName}. Your responses have been saved and sent to{" "}
            {orgName ?? "the hiring team"}.
          </p>

          {rubric.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card/50 p-5 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                What you were assessed on
              </p>
              <ul className="mt-3 space-y-1.5">
                {rubric.map((c) => (
                  <li key={c.name} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-accent-soft">•</span>
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-5 text-muted">
                You were scored against the same rubric as every other candidate.
                A member of the hiring team — a real person — makes the final
                decision; Clarion&apos;s assessment is a recommendation, not a
                verdict.
              </p>
            </div>
          )}

          <p className="mt-4 rounded-lg border border-border bg-card/40 px-4 py-3 text-sm text-muted">
            <span className="font-medium text-foreground">What happens next:</span>{" "}
            {orgName ?? "the hiring team"} reviews your assessment and a real person
            makes the decision. Bookmark this page — you can return here anytime to
            see your status.
          </p>
          <p className="mt-4 text-sm text-muted">
            Feel something was missed or assessed unfairly?
          </p>
          <AppealButton token={token} />
          <p className="mt-6 text-xs text-muted">You can close this tab.</p>
        </div>
      </Shell>
    );
  }

  // connecting / live / saving
  const speaking = conversation.isSpeaking;
  return (
    <Shell>
      <div className="relative flex w-full max-w-3xl flex-col items-center">
        {/* webcam tile */}
        <div className="absolute right-0 top-0 h-28 w-40 overflow-hidden rounded-xl border border-border bg-black/60">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </div>

        <VoiceOrb
          state={
            phase === "live" ? (speaking ? "speaking" : "listening") : "thinking"
          }
          getLevel={getLevel}
          size={320}
        />

        <p className="mt-2 text-sm font-medium text-muted">
          {phase === "connecting"
            ? "Connecting…"
            : phase === "saving"
              ? "Saving your interview…"
              : speaking
                ? "Clarion is speaking…"
                : "Listening…"}
        </p>

        {caption && phase === "live" && (
          <p className="mt-6 max-w-xl text-center text-foreground/90">
            &ldquo;{caption}&rdquo;
          </p>
        )}

        {phase === "live" && lines.length > 0 && (
          <div className="mt-6 max-h-44 w-full max-w-xl space-y-2 overflow-y-auto rounded-xl border border-border bg-card/50 p-4 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Live transcript
            </p>
            {lines.map((l, i) => (
              <p
                key={i}
                className={l.role === "user" ? "text-foreground" : "text-muted"}
              >
                <span className="font-medium">
                  {l.role === "user" ? "You" : "Clarion"}:
                </span>{" "}
                {l.text}
              </p>
            ))}
          </div>
        )}

        {phase === "live" && (
          <button
            onClick={end}
            className="mt-10 rounded-full border border-border px-6 py-2.5 text-sm hover:border-red-500 hover:text-red-600"
          >
            End interview
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}
