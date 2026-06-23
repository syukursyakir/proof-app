"use client";

import { useCallback, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import VoiceOrb from "@/components/VoiceOrb";
import { supabaseBrowser } from "@/lib/supabase";
import {
  buildInterviewPrompt,
  interviewFirstMessage,
} from "@/lib/prompts";
import type { Criterion, Turn } from "@/lib/types";

type Props = {
  candidateId: string;
  candidateName: string;
  roleTitle: string;
  questions: string[];
  rubric: Criterion[];
  agentConfigured: boolean;
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
  candidateId,
  candidateName,
  roleTitle,
  questions,
  rubric,
  agentConfigured,
}: Props) {
  const [phase, setPhase] = useState<Phase>("consent");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const turnsRef = useRef<Turn[]>([]);

  const conversation = useConversation({
    onConnect: () => setPhase("live"),
    onDisconnect: () => {},
    onError: (msg) => {
      setError(typeof msg === "string" ? msg : "Connection error");
      setPhase("error");
    },
    onMessage: (m: { message: string; source: "user" | "ai" }) => {
      if (!m?.message) return;
      turnsRef.current.push({
        role: m.source === "ai" ? "agent" : "user",
        text: m.message,
        t: Date.now(),
      });
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

    // Camera + mic for the webcam tile and recording (best-effort).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      try {
        const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorderRef.current = rec;
        rec.start();
      } catch {
        // recording unsupported — continue without it
      }
    } catch {
      // camera/mic denied — the voice interview can still run via the SDK
    }

    try {
      const res = await fetch("/api/eleven-signed-url");
      if (!res.ok) throw new Error("Could not start the interview agent.");
      const { signedUrl } = await res.json();

      conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: buildInterviewPrompt(roleTitle, questions, rubric) },
            firstMessage: interviewFirstMessage(roleTitle),
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

  async function end() {
    setPhase("saving");
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }

    // Stop recording and wait for the final blob.
    const recordingUrl = await new Promise<string | null>((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const supa = supabaseBrowser();
          const path = `${candidateId}/${Date.now()}.webm`;
          const { error } = await supa.storage
            .from("recordings")
            .upload(path, blob, { contentType: "video/webm", upsert: true });
          if (error) return resolve(null);
          const { data } = supa.storage.from("recordings").getPublicUrl(path);
          resolve(data.publicUrl);
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
          candidate_id: candidateId,
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

  // ---- Render ----
  if (phase === "consent") {
    return (
      <Shell>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d6d0ff,#6d5ef8_50%,#3b2fb0)] shadow-[0_0_40px_8px_rgba(109,94,248,0.5)]" />
          <h1 className="text-2xl font-semibold">Your interview for {roleTitle}</h1>
          <p className="mt-3 text-muted">
            You&apos;ll have a short voice conversation with Proof. Speak naturally —
            and you can ask it anything, including how you&apos;re being assessed.
          </p>
          <p className="mt-4 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted">
            🔴 This interview is recorded (audio &amp; video) so the employer can review
            it. Your answers are assessed against a fixed rubric — the same for every
            candidate.
          </p>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            onClick={start}
            className="mt-6 rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft"
          >
            Start interview
          </button>
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
          <h1 className="text-2xl font-semibold">Interview complete 🎉</h1>
          <p className="mt-3 text-muted">
            Thanks, {candidateName}. Your responses have been recorded and sent to the
            employer. You can close this tab.
          </p>
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
                ? "Proof is speaking…"
                : "Listening…"}
        </p>

        {caption && phase === "live" && (
          <p className="mt-6 max-w-xl text-center text-foreground/90">
            &ldquo;{caption}&rdquo;
          </p>
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
