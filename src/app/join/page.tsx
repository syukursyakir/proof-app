"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export default function JoinPage() {
  const router = useRouter();
  const { dict } = useSiteLocale();
  const j = dict.join;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [needName, setNeedName] = useState(false);
  const [roleTitle, setRoleTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!code.trim()) return;
    if (needName && !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name: needName ? name : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? j.invalidCode);
      if (data.needName) {
        // Open role code — collect the candidate's name, then join.
        setNeedName(true);
        setRoleTitle(data.roleTitle ?? null);
        setBusy(false);
        return;
      }
      router.push(`/interview/${data.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : j.invalidCode);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/50 p-8 text-center">
        <div className="mb-5 flex items-center justify-center">
          <Logo />
        </div>
        {!needName ? (
          <>
            <h1 className="text-xl font-semibold">{j.title}</h1>
            <p className="mt-2 text-sm text-muted">{j.subtitle}</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder={j.placeholder}
              maxLength={8}
              className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-accent"
            />
            <button
              onClick={go}
              disabled={busy}
              className="mt-4 w-full rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
            >
              {busy ? j.checking : j.continue}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">
              {roleTitle ?? j.nameTitle}
            </h1>
            <p className="mt-2 text-sm text-muted">{j.nameSubtitle}</p>
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder={j.namePlaceholder}
              className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-base outline-none focus:border-accent"
            />
            <button
              onClick={go}
              disabled={busy || !name.trim()}
              className="mt-4 w-full rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
            >
              {busy ? j.starting : j.startAssessment}
            </button>
            <button
              onClick={() => {
                setNeedName(false);
                setError(null);
              }}
              className="mt-3 text-xs text-muted underline hover:text-foreground"
            >
              {j.backCode}
            </button>
          </>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
