"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/types";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

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
        <Card tint="accent" padding="md" className="mt-4">
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
            <Button size="sm" className="ml-auto" onClick={copyRoleInvite}>
              {codeCopied ? p.copied : p.copyInvite}
            </Button>
          </div>
        </Card>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted hover:text-foreground">
          {p.orInvite}
        </summary>
        <div className="mt-3 flex gap-2">
          <Input
            className="flex-1"
            placeholder={p.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button variant="secondary" size="sm" onClick={add} loading={adding} loadingText={p.adding}>
            {p.addCandidate}
          </Button>
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
            <Card key={c.id} padding="sm" radius="xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge domain="status" value={c.status} size="xs">
                    {statusLabel[c.status] ?? c.status}
                  </Badge>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyInvite(c.id, c.access_token, c.join_code)}
                  >
                    {copied === c.id ? p.copied : p.copyInvite}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
