"use client";

import { useRef, useState } from "react";
import Logo from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/components/LocaleProvider";

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
  const { dict } = useLocale();
  const t = dict.resume;

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError(t.errorType);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t.errorSize);
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
      setError(t.errorUpload);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <Logo size={44} className="mx-auto mb-7 w-fit text-xl" />
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-3 text-muted">
          {mode === "required" ? t.subtitleRequired : t.subtitleOptional}{" "}
          {orgName ?? t.hiringTeam} {t.subtitleOrg}
        </p>
        <p className="mt-2 text-sm text-muted">{t.notice}</p>

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
            {busy ? t.uploading : fileName ? t.chooseDiff : t.chooseFile}
          </button>
        </div>

        {fileName && !busy && (
          <p className="mt-3 text-sm text-accent-sage">
            {t.uploaded.replace("{name}", fileName)}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {mode === "optional" && (
          <div className="mt-5">
            <button
              onClick={onComplete}
              disabled={busy}
              className="text-sm text-muted underline hover:text-foreground disabled:opacity-60"
            >
              {t.skip}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
