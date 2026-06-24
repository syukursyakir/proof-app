"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/types";

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

export default function CandidatePanel({
  roleId,
  roleTitle,
  candidates,
  summaries = {},
}: {
  roleId: string;
  roleTitle?: string;
  candidates: Candidate[];
  summaries?: Record<string, { avg: number; recommendation: string }>;
}) {
  const router = useRouter();
  // Rank scored candidates first, highest average score on top.
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
      <h2 className="text-lg font-semibold">Candidates</h2>
      <p className="mt-1 text-sm text-muted">
        Add a candidate to generate their interview link.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Candidate name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          onClick={add}
          disabled={adding}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add candidate"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {candidates.length === 0 && (
          <p className="text-sm text-muted">No candidates yet.</p>
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
                      View verdict
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
                    {copied === c.id ? "✓ Invite copied" : "Copy invite"}
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
