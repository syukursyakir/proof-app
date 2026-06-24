"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Candidate, CriterionVerdict, Verdict } from "@/lib/types";
import { pairScores, agreement } from "@/lib/agreement";
import { computeComposite, type CompositeBand } from "@/lib/composite";
import { ease, spring } from "@/lib/motion";
import { Stagger, Item, CountUp } from "@/components/motion";

type SkillsAnswers = {
  qa: { question: string; answer: string }[];
  per_question: { score: number; justification: string }[];
  overall: string | null;
};

const componentBarColor: Record<string, string> = {
  interview: "bg-accent",
  skills: "bg-violet-500",
  aptitude: "bg-accent-soft",
};
const componentSubLabel: Record<string, string> = {
  interview: "behavioural",
  skills: "work-sample",
  aptitude: "cognitive screen",
};

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

const statusPill: Record<string, string> = {
  invited: "bg-slate-100 text-slate-600",
  interviewing: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  advanced: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};
const statusLabel: Record<string, string> = {
  invited: "Invited",
  interviewing: "In progress",
  completed: "Completed",
  advanced: "Advanced",
  rejected: "Rejected",
};

const bandStyle: Record<CompositeBand, { pill: string; bar: string; text: string }> = {
  Strong: { pill: "bg-green-100 text-green-800", bar: "bg-green-500", text: "text-green-700" },
  Recommended: { pill: "bg-accent/15 text-accent-soft", bar: "bg-accent", text: "text-accent-soft" },
  Borderline: { pill: "bg-amber-100 text-amber-800", bar: "bg-amber-500", text: "text-amber-700" },
  "Not recommended": { pill: "bg-red-100 text-red-700", bar: "bg-red-400", text: "text-red-600" },
};

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < score ? "bg-accent-soft" : "bg-border"}`}
        />
      ))}
    </span>
  );
}

export default function VerdictView({
  candidate,
  verdict,
  fullText,
  recordingUrl,
  proctorUrl = null,
  readOnly = false,
  appealRequested = false,
  humanRating = null,
}: {
  candidate: Candidate & {
    aptitude_score?: number | null;
    aptitude_max?: number | null;
    skills_score?: number | null;
    skills_max?: number | null;
    skills_answers?: SkillsAnswers | null;
    proctor_flags?: { share_lost?: boolean; tab_switches?: number } | null;
  };
  verdict: Verdict | null;
  fullText: string | null;
  recordingUrl: string | null;
  proctorUrl?: string | null;
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

  const composite = useMemo(
    () =>
      computeComposite({
        interviewScores: (verdict?.per_criterion ?? []).map((c) => c.score),
        skillsScore: candidate.skills_score,
        skillsMax: candidate.skills_max,
        aptitudeScore: candidate.aptitude_score,
        aptitudeMax: candidate.aptitude_max,
      }),
    [
      verdict,
      candidate.skills_score,
      candidate.skills_max,
      candidate.aptitude_score,
      candidate.aptitude_max,
    ],
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
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusPill[candidate.status] ?? "bg-slate-100 text-slate-600"}`}>
            {statusLabel[candidate.status] ?? candidate.status}
          </span>
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
        Clarion assesses. You decide — the verdict is a recommendation, not a decision.
      </p>

      {composite && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.out }}
          className="rounded-2xl border border-border bg-card/50 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Overall recommendation
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="tnum text-4xl font-semibold leading-none">
                  <CountUp value={Math.round(composite.composite)} />
                  <span className="text-lg font-normal text-muted">/100</span>
                </span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.7 }}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${bandStyle[composite.band].pill}`}
                >
                  {composite.band}
                </motion.span>
              </div>
            </div>
          </div>

          {/* Component bars — assemble from zero, staggered */}
          <div className="mt-6 space-y-4">
            {composite.components.map((c, i) => (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {c.label}{" "}
                    <span className="text-xs font-normal text-muted">
                      · {componentSubLabel[c.key]} · {Math.round(c.weight * 100)}% weight
                    </span>
                  </span>
                  <span className="tnum text-muted">{Math.round(c.pct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.8, ease: ease.out, delay: 0.25 + i * 0.12 }}
                    className={`h-full rounded-full ${componentBarColor[c.key]}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-border/60 pt-4 text-xs leading-5 text-muted">
            A weighted score out of 100 — not a percentile or class rank. Weights
            follow each method&apos;s predictive validity in the research literature
            (interview ρ≈.42, skills work-sample ρ≈.40, aptitude screen ρ≈.31,
            Sackett et al. 2022); these are method-level figures, not a measured
            validity for this assessment. Treat the band, not the exact number, as
            the signal — and treat it as a recommendation. You decide.
          </p>
        </motion.section>
      )}

      {appealRequested && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          ⚑ This candidate has requested a human review of their interview.
        </div>
      )}

      {candidate.proctor_flags &&
        ((candidate.proctor_flags.tab_switches ?? 0) > 0 ||
          candidate.proctor_flags.share_lost) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          ⚑ Aptitude proctoring flags:{" "}
          {(candidate.proctor_flags.tab_switches ?? 0) > 0 && (
            <>left the test tab {candidate.proctor_flags.tab_switches} time
              {candidate.proctor_flags.tab_switches === 1 ? "" : "s"}</>
          )}
          {(candidate.proctor_flags.tab_switches ?? 0) > 0 &&
            candidate.proctor_flags.share_lost &&
            "; "}
          {candidate.proctor_flags.share_lost && "stopped screen sharing"}. Review
          the screen recording before relying on the aptitude score.
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
          {verdict.overall.integrity_flag && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-700">
              ⚑ Possible attempt to game the interview — review the transcript.
            </p>
          )}
        </section>
      )}

      {verdict?.per_criterion && verdict.per_criterion.length > 0 && (() => {
        const avg =
          verdict.per_criterion.reduce((s, c) => s + c.score, 0) /
          verdict.per_criterion.length;
        return (
          <div className="flex items-center gap-5 rounded-xl border border-border bg-card/40 px-5 py-4">
            <div>
              <p className="text-xs text-muted">Average score</p>
              <p className="text-3xl font-semibold leading-none">
                {avg.toFixed(1)}
                <span className="text-base font-normal text-muted">/5</span>
              </p>
            </div>
            <ScoreDots score={Math.round(avg)} />
          </div>
        );
      })()}

      {verdict?.per_criterion && verdict.per_criterion.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Scores &amp; evidence</h2>
          <Stagger className="space-y-3">
            {verdict.per_criterion.map((c: CriterionVerdict, i) => (
              <Item
                key={i}
                className="overflow-hidden rounded-xl border border-border bg-card/50"
              >
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
                    <ScoreDots score={c.score} />
                    <span className="w-8 text-right text-sm font-semibold text-accent-soft">
                      {c.score}/5
                    </span>
                    <span className="text-xs text-muted">
                      {open === i ? "▲" : "▼"}
                    </span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: ease.out }}
                      className="overflow-hidden"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </Item>
            ))}
          </Stagger>
        </section>
      )}

      {candidate.skills_answers?.qa && candidate.skills_answers.qa.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Skills work-sample</h2>
          {candidate.skills_answers.overall && (
            <p className="mb-3 text-sm text-muted">
              {candidate.skills_answers.overall}
            </p>
          )}
          <div className="space-y-3">
            {candidate.skills_answers.qa.map((qa, i) => {
              const pq = candidate.skills_answers?.per_question?.[i];
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{qa.question}</p>
                    {pq && (
                      <span className="shrink-0 text-sm font-semibold text-accent-soft">
                        {pq.score}/5
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap rounded-md bg-background px-3 py-2 text-sm leading-6 text-foreground/85">
                    {qa.answer || <span className="text-muted">(no answer)</span>}
                  </p>
                  {pq?.justification && (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {pq.justification}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {verdict?.per_criterion && verdict.per_criterion.length > 0 && !readOnly && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">
            Calibration — score this candidate yourself
          </h2>
          <p className="mb-3 text-sm text-muted">
            Rate each criterion to measure how closely Clarion agrees with you — this is
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
                  <span className="text-xs text-muted">Clarion: {c.score}</span>
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
                You &amp; Clarion: exact on {Math.round(agr.exact * 100)}%, within ±1 on{" "}
                {Math.round(agr.within1 * 100)}% ({agr.n} criteria · avg diff{" "}
                {agr.mae.toFixed(2)})
              </span>
            )}
          </div>
        </section>
      )}

      {recordingUrl && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Interview recording</h2>
          <video
            controls
            src={recordingUrl}
            className="w-full max-w-xl rounded-xl border border-border"
          />
        </section>
      )}

      {proctorUrl && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Aptitude test — screen recording</h2>
          <p className="mb-3 text-sm text-muted">
            Proctoring capture from Part 1, so you can confirm the timed test was
            taken honestly.
          </p>
          <video
            controls
            src={proctorUrl}
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
