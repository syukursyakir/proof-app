"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Invalid code");
      const { token } = await res.json();
      router.push(`/interview/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/50 p-8 text-center">
        <div className="mx-auto mb-5 flex items-center justify-center gap-2 font-semibold">
          <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.5)]" />
          Clarion
        </div>
        <h1 className="text-xl font-semibold">Join your interview</h1>
        <p className="mt-2 text-sm text-muted">Enter the code your employer gave you.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="ABCD2345"
          maxLength={8}
          className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-accent"
        />
        <button
          onClick={go}
          disabled={busy}
          className="mt-4 w-full rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join interview"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
