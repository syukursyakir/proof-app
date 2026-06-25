"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/types";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

const statusPill: Record<string, string> = {
  invited: "bg-slate-100 text-slate-600",
  interviewing: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  advanced: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function CandidatePanel({
  roleId,
  roleTitle,
  roleCode = null,
  candidates,
  summaries = {},
}: {
  roleId: string;
  roleTitle?: string;
  roleCode?: string | null;
  candidates: Candidate[];
  summaries?: Record<string, { avg: number; recommendation: string }>;
}) {
  const { dict } = useSiteLocale();
  const p = dict.employer.panel;
  const s = dict.employer.status;

  const statusLabel: Record<string, string> = {
    invited: s.invited,
    interviewing: s.inProgress,
    completed: s.completed,
    advanced: s.advanced,
    rejected: s.rejected,
  };

  const [codeCopied, setCodeCopied] = useState(false);
  function copyRoleInvite() {
    if (!roleCode) return;
    const origin = window.location.origin;
    const msg =
      `You're invited to apply${roleTitle ? ` for ${roleTitle}` : ""}.\n` +
      `Go to ${origin}/join and enter code: ${roleCode}\n` +
      `(Use a desktop browser.)`;
    navigator.clipboard?.writeText(msg);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1800);
  }
  const router = useRouter();
  const sorted = [...candidates].sort(
    (a, b) => (summaries[b.id]?.avg ?? -1) - (summaries[a.id]?.avg ?? -1),
  );
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId, name }),
      });
      setName("");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  function copyInvite(
    id: string,
    token: string | null | undefined,
    code: string | null | undefined,
  ) {
    if (!token) return;
    const origin = window.location.origin;
    const role = roleTitle ? ` for ${roleTitle}` : "";
    const msg =
      `You're invited to complete a short assessment${role}.\n\n` +
      `Two ways to start (use a desktop browser):\n` +
      (code ? `1. Go to ${origin}/join and enter code: ${code}\n` : "") +
      `${code ? "2. " : ""}Or open this link directly: ${origin}/interview/${token}`;
    navigator.clipboard?.writeText(msg);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <section className="mt-12 border-t border-border/60 pt-10">
      <h2 className="text-lg font-semibold">{p.title}</h2>
      <p className="mt-1 text-sm text-muted">{p.subtitle}</p>

      {roleCode && (
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {p.shareCode}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-3xl font-bold tracking-[0.2em] text-foreground">
              {roleCode}
            </span>
            <span className="text-sm text-muted">
              candidates enter it at{" "}
              <span className="text-foreground">clarion.fyi/join</span>
            </span>
            <button
              onClick={copyRoleInvite}
              className="ml-auto rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-soft"
            >
              {codeCopied ? p.copied : p.copyInvite}
            </button>
          </div>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted hover:text-foreground">
          {p.orInvite}
        </summary>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={p.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            disabled={adding}
            className="rounded-full border border-border px-5 py-2 text-sm hover:border-accent disabled:opacity-60"
          >
            {adding ? p.adding : p.addCandidate}
          </button>
        </div>
      </details>

      <h3 className="mt-8 text-sm font-semibold">
        {p.candidatesHeading}{" "}
        <span className="font-normal text-muted">({candidates.length})</span>
      </h3>
      <div className="mt-3 space-y-3">
        {candidates.length === 0 && (
          <p className="text-sm text-muted">{p.noOne}</p>
        )}
        {sorted.map((c) => {
          const shareable = c.join_code && c.access_token && (c.status === "invited" || c.status === "interviewing");
          const decided = c.status === "completed" || c.status === "advanced" || c.status === "rejected";
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                  {summaries[c.id] && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs capitalize text-accent-soft">
                      {summaries[c.id].recommendation || "scored"} · {summaries[c.id].avg.toFixed(1)}/5
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {decided && (
                    <Link
                      href={`/candidates/${c.id}`}
                      className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-soft"
                    >
                      {p.viewVerdict}
                    </Link>
                  )}
                </div>
              </div>

              {shareable && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">Join code</span>
                    <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                      {c.join_code}
                    </span>
                    <span className="hidden text-xs text-muted sm:inline">
                      → they enter it at clarion.fyi/join
                    </span>
                  </div>
                  <button
                    onClick={() => copyInvite(c.id, c.access_token, c.join_code)}
                    className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent"
                  >
                    {copied === c.id ? p.copied : p.copyInvite}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
