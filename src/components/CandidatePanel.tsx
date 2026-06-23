"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/types";

const statusStyle: Record<string, string> = {
  invited: "text-muted",
  interviewing: "text-yellow-300",
  completed: "text-accent-soft",
  advanced: "text-green-400",
  rejected: "text-red-400",
};

export default function CandidatePanel({
  roleId,
  candidates,
}: {
  roleId: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
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

  function copyLink(id: string) {
    const url = `${window.location.origin}/interview/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
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

      <div className="mt-6 space-y-2">
        {candidates.length === 0 && (
          <p className="text-sm text-muted">No candidates yet.</p>
        )}
        {candidates.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3"
          >
            <div>
              <span className="font-medium">{c.name}</span>
              <span className={`ml-3 text-xs ${statusStyle[c.status] ?? "text-muted"}`}>
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => copyLink(c.id)}
                className="rounded-full border border-border px-3 py-1 hover:border-accent"
              >
                {copied === c.id ? "Copied!" : "Copy interview link"}
              </button>
              <Link
                href={`/interview/${c.id}`}
                className="rounded-full border border-border px-3 py-1 hover:border-accent"
              >
                Open
              </Link>
              {(c.status === "completed" ||
                c.status === "advanced" ||
                c.status === "rejected") && (
                <Link
                  href={`/candidates/${c.id}`}
                  className="rounded-full bg-accent px-3 py-1 font-medium text-white hover:bg-accent-soft"
                >
                  View verdict
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
