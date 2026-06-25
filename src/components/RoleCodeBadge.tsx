"use client";

import { useState } from "react";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

// Shows a role's open join code with one-tap copy. Lives OUTSIDE the card's
// link so clicking copy doesn't navigate into the role.
export default function RoleCodeBadge({
  code,
  roleTitle,
}: {
  code: string;
  roleTitle: string;
}) {
  const { dict } = useSiteLocale();
  const p = dict.employer.panel;
  const s = dict.employer.settingsP;
  const [copied, setCopied] = useState(false);

  function copyInvite() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const msg =
      `You're invited to apply for ${roleTitle}.\n` +
      `Go to ${origin}/join and enter code: ${code}\n` +
      `(Use a desktop browser.)`;
    navigator.clipboard?.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <span className="text-xs text-muted">{s.code}</span>
        <span className="font-mono font-bold tracking-widest text-foreground">
          {code}
        </span>
      </span>
      <button
        onClick={copyInvite}
        className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent"
      >
        {copied ? p.copied : p.copyInvite}
      </button>
    </div>
  );
}
