"use client";

import { useRef, useState } from "react";
import Logo from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase";

const ACCEPT = ".pdf,.doc,.docx";
const ALLOWED_EXT = ["pdf", "doc", "docx"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ResumeUpload({
  token,
  mode,
  orgName,
  onComplete,
}: {
  token: string;
  mode: "optional" | "required";
  orgName: string | null;
  onComplete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("Please upload a PDF, DOC, or DOCX file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 10 MB — please upload a smaller version.");
      return;
    }
    setBusy(true);
    try {
      // 1. Mint a one-time signed upload URL (token-gated, private bucket).
      const signRes = await fetch("/api/recordings/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ext }),
      });
      if (!signRes.ok) throw new Error();
      const { path, signedToken } = await signRes.json();

      // 2. Upload the file straight to storage.
      const supa = supabaseBrowser();
      const { error: upErr } = await supa.storage
        .from("recordings")
        .uploadToSignedUrl(path, signedToken, file);
      if (upErr) throw new Error();

      // 3. Save the path against the candidate.
      const saveRes = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, path }),
      });
      if (!saveRes.ok) throw new Error();

      setFileName(file.name);
      onComplete();
    } catch {
      setError("Upload failed — please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <Logo size={44} className="mx-auto mb-7 w-fit text-xl" />
        <h1 className="text-2xl font-semibold">Add your resume</h1>
        <p className="mt-3 text-muted">
          {mode === "required"
            ? "Attach your resume so "
            : "Optionally attach your resume so "}
          {orgName ?? "the hiring team"} has your full background on file.
        </p>
        <p className="mt-2 text-sm text-muted">
          Your resume is <span className="text-foreground">context for the hiring
          team — it is not scored by the AI</span>. You&apos;re assessed on what you
          demonstrate, not your resume.
        </p>

        <div className="mt-6">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
          >
            {busy ? "Uploading…" : fileName ? "Choose a different file" : "Choose file (PDF, DOC, DOCX)"}
          </button>
        </div>

        {fileName && !busy && (
          <p className="mt-3 text-sm text-accent-sage">✓ Uploaded {fileName}</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {mode === "optional" && (
          <div className="mt-5">
            <button
              onClick={onComplete}
              disabled={busy}
              className="text-sm text-muted underline hover:text-foreground disabled:opacity-60"
            >
              Skip — I&apos;d rather be judged on my assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
