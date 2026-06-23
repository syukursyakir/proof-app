"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, CriterionVerdict, Verdict } from "@/lib/types";
import { pairScores, agreement } from "@/lib/agreement";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Highlights verbatim quotes inside the transcript text.
function Highlighted({ text, quotes }: { text: string; quotes: string[] }) {
  const parts = useMemo(() => {
    const valid = Array.from(new Set(quotes))
      .filter((q) => q && text.includes(q))
      .sort((a, b) => b.length - a.length);
    if (valid.length === 0) return [{ t: text, hit: false }];
    const re = new RegExp(`(${valid.map(escapeRe).join("|")})`, "g");
    return text.split(re).map((t) => ({ t, hit: valid.includes(t) }));
  }, [text, quotes]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
      {parts.map((p, i) =>
        p.hit ? (
          <mark
            key={i}
            className="rounded bg-accent/25 px-1 text-foreground"
          >
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </p>
  );
}

const recColor: Record<string, string> = {
  advance: "bg-green-500/15 text-green-700",
  "lean advance": "bg-green-500/15 text-green-700",
  "lean reject": "bg-red-500/15 text-red-700",
  reject: "bg-red-500/15 text-red-700",
};

export default function VerdictView({
  candidate,
  verdict,
  fullText,
  recordingUrl,
  readOnly = false,
  appealRequested = false,
  humanRating = null,
}: {
  candidate: Candidate;
  verdict: Verdict | null;
  fullText: string | null;
  recordingUrl: string | null;
  readOnly?: boolean;
  appealRequested?: boolean;
  humanRating?: { name: string; score: number }[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    (humanRating ?? []).forEach((r) => (m[r.name] = r.score));
    return m;
  });
  const [savingRating, setSavingRating] = useState(false);

  const agr = agreement(
    pairScores(
      (verdict?.per_criterion ?? []).map((c) => ({ name: c.name, score: c.score })),
      humanRating ?? [],
    ),
  );

  async function saveRating() {
    setSavingRating(true);
    try {
      const per_criterion = (verdict?.per_criterion ?? [])
        .map((c) => ({ name: c.name, score: scores[c.name] ?? 0 }))
        .filter((x) => x.score > 0);
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id, per_criterion }),
      });
      router.refresh();
    } finally {
      setSavingRating(false);
    }
  }

  const allQuotes = useMemo(
    () => (verdict?.per_criterion ?? []).flatMap((c) => c.quotes ?? []),
    [verdict],
  );

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Scoring failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await fetch("/api/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: candidate.id, status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{candidate.name}</h1>
          <p className="mt-1 text-sm text-muted">Status: {candidate.status}</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setStatus("advanced")}
              disabled={busy}
              className="rounded-full bg-green-500/90 px-5 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
            >
              Advance
            </button>
            <button
              onClick={() => setStatus("rejected")}
              disabled={busy}
              className="rounded-full border border-border px-5 py-2 text-sm hover:border-red-500 hover:text-red-400 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      <p className="-mt-6 text-xs text-muted">
        Proof assesses. You decide — the verdict is a recommendation, not a decision.
      </p>

      {appealRequested && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          ⚑ This candidate has requested a human review of their interview.
        </div>
      )}

      {!verdict && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          {fullText ? (
            <>
              <p className="text-muted">No verdict yet.</p>
              <button
                onClick={generate}
                disabled={busy}
                className="mt-4 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
              >
                {busy ? "Scoring…" : "Generate verdict"}
              </button>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </>
          ) : (
            <p className="text-muted">
              This candidate hasn&apos;t completed their interview yet.
            </p>
          )}
        </div>
      )}

      {verdict?.overall && (
        <section className="rounded-2xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overall</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                recColor[verdict.overall.recommendation] ?? "bg-card text-muted"
              }`}
            >
              {verdict.overall.recommendation}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-foreground/85">
            {verdict.overall.summary}
          </p>
        </section>
      )}

      {verdict?.per_criterion && verdict.per_criterion.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Scores &amp; evidence</h2>
          <div className="space-y-3">
            {verdict.per_criterion.map((c: CriterionVerdict, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="flex items-center gap-3">
                    {c.low_confidence && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">
                        uncertain — review
                      </span>
                    )}
                    <span className="text-sm font-semibold text-accent-soft">
                      {c.score}/5
                    </span>
                    <span className="text-xs text-muted">
                      {open === i ? "▲" : "▼"}
                    </span>
                  </span>
                </button>
                {open === i && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <p className="text-sm text-foreground/85">{c.justification}</p>
                    <div className="mt-3 space-y-2">
                      {(c.quotes ?? []).length === 0 && (
                        <p className="text-xs text-muted">No direct quote found.</p>
                      )}
                      {(c.quotes ?? []).map((q, j) => (
                        <p
                          key={j}
                          className="rounded-md bg-accent/10 px-3 py-2 text-xs leading-6 text-foreground/90"
                        >
                          &ldquo;{q}&rdquo;
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {verdict?.per_criterion && verdict.per_criterion.length > 0 && !readOnly && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">
            Calibration — score this candidate yourself
          </h2>
          <p className="mb-3 text-sm text-muted">
            Rate each criterion to measure how closely Proof agrees with you — this is
            your reliability evidence.
          </p>
          <div className="space-y-3">
            {verdict.per_criterion.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">Proof: {c.score}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setScores((s) => ({ ...s, [c.name]: n }))}
                        className={`h-7 w-7 rounded-full text-xs ${
                          scores[c.name] === n
                            ? "bg-accent text-white"
                            : "border border-border text-foreground hover:border-accent"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={saveRating}
              disabled={savingRating}
              className="rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft disabled:opacity-60"
            >
              {savingRating ? "Saving…" : "Save my scores"}
            </button>
            {humanRating && humanRating.length > 0 && agr.n > 0 && (
              <span className="text-sm text-muted">
                You &amp; Proof: exact on {Math.round(agr.exact * 100)}%, within ±1 on{" "}
                {Math.round(agr.within1 * 100)}% ({agr.n} criteria · avg diff{" "}
                {agr.mae.toFixed(2)})
              </span>
            )}
          </div>
        </section>
      )}

      {recordingUrl && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recording</h2>
          <video
            controls
            src={recordingUrl}
            className="w-full max-w-xl rounded-xl border border-border"
          />
        </section>
      )}

      {fullText && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Transcript</h2>
          <div className="rounded-xl border border-border bg-card/30 p-5">
            <Highlighted text={fullText} quotes={allQuotes} />
          </div>
        </section>
      )}
    </div>
  );
}
