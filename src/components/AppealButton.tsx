"use client";

import { useState } from "react";

// Lets a candidate request a human review (shown after the interview completes).
export default function AppealButton({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    try {
      await fetch("/api/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-6 text-sm text-muted">
        Thanks — we&apos;ve flagged your interview for a human review.
      </p>
    );
  }
  return (
    <button
      onClick={request}
      disabled={busy}
      className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:border-accent disabled:opacity-60"
    >
      {busy ? "Requesting…" : "Request a human review"}
    </button>
  );
}
