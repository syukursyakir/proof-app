"use client";

import { useState } from "react";
import {
  HeadsetIcon,
  TrendingUpIcon,
  BellIcon,
  BoxesIcon,
  ClipboardIcon,
  ShoppingBagIcon,
  CoffeeIcon,
  HeartIcon,
  PencilIcon,
} from "@/components/icons";

type RoleTile = { label: string; Icon: (p: { className?: string }) => React.ReactNode };

const ROLES: RoleTile[] = [
  { label: "Customer Support", Icon: HeadsetIcon },
  { label: "Sales", Icon: TrendingUpIcon },
  { label: "Front Desk", Icon: BellIcon },
  { label: "Operations", Icon: BoxesIcon },
  { label: "Admin", Icon: ClipboardIcon },
  { label: "Retail / Cashier", Icon: ShoppingBagIcon },
  { label: "Food & Beverage", Icon: CoffeeIcon },
  { label: "Care / Health", Icon: HeartIcon },
];

// Two-level, click-first role + skills picker. AI-adaptive: it suggests skills
// for whatever role is chosen, and "Add your own" covers anything missing.
export default function RolePicker({
  onComplete,
  onDescribeInstead,
}: {
  onComplete: (role: string, skills: string[]) => void;
  onDescribeInstead: () => void;
}) {
  const [step, setStep] = useState<"role" | "skills">("role");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);

  const [suggested, setSuggested] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [custom, setCustom] = useState("");

  async function pickRole(r: string) {
    if (!r.trim()) return;
    setRole(r.trim());
    setStep("skills");
    setLoadingSkills(true);
    setSuggested([]);
    setSelected([]);
    try {
      const res = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r.trim() }),
      });
      const data = await res.json();
      setSuggested(Array.isArray(data.skills) ? data.skills : []);
    } catch {
      setSuggested([]);
    } finally {
      setLoadingSkills(false);
    }
  }

  function toggle(skill: string) {
    setSelected((s) =>
      s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill],
    );
  }

  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!suggested.includes(v)) setSuggested((s) => [...s, v]);
    if (!selected.includes(v)) setSelected((s) => [...s, v]);
    setCustom("");
  }

  // ---- Step 1: role ----
  if (step === "role") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          What are you hiring for?
        </h1>
        <p className="mt-2 text-muted">
          Tap a role to start — you&apos;ll pick the skills next. No long forms.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((r) => (
            <button
              key={r.label}
              onClick={() => pickRole(r.label)}
              className="lift flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 px-3 py-6 text-center text-sm font-medium text-foreground/80 transition-colors hover:border-accent hover:text-foreground"
            >
              <r.Icon className="h-6 w-6 text-accent" />
              {r.label}
            </button>
          ))}
          <button
            onClick={() => setOtherOpen((o) => !o)}
            className={`flex flex-col items-center gap-3 rounded-2xl border px-3 py-6 text-center text-sm font-medium transition-colors ${
              otherOpen
                ? "border-accent text-foreground"
                : "border-dashed border-border text-foreground/80 hover:border-accent hover:text-foreground"
            }`}
          >
            <PencilIcon className="h-6 w-6 text-accent" />
            Other role
          </button>
        </div>

        {otherOpen && (
          <div className="mt-4 flex gap-2">
            <input
              autoFocus
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pickRole(customRole)}
              placeholder="e.g. Warehouse supervisor, Dental nurse…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => pickRole(customRole)}
              disabled={!customRole.trim()}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}

        <button
          onClick={onDescribeInstead}
          className="mt-8 text-sm text-muted underline hover:text-foreground"
        >
          Prefer to describe the role in your own words (or by voice)?
        </button>
      </div>
    );
  }

  // ---- Step 2: skills ----
  return (
    <div>
      <button
        onClick={() => setStep("role")}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
      >
        ← Change role
      </button>
      <h1 className="text-3xl font-semibold tracking-tight">
        Which skills matter most for a {role.toLowerCase()}?
      </h1>
      <p className="mt-2 text-muted">
        Tap the ones you care about. Add any we missed — Clarion builds the
        assessment around your picks.
      </p>

      {loadingSkills ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <span className="orb-pulse h-3 w-3 rounded-full bg-accent" />
          Clarion is suggesting skills for this role…
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {suggested.map((skill) => {
              const on = selected.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggle(skill)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition ${
                    on
                      ? "bg-accent text-white ring-accent"
                      : "bg-card/60 text-foreground/80 ring-border hover:ring-accent"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {skill}
                </button>
              );
            })}
          </div>

          {/* Others — type anything not suggested */}
          <div className="mt-5 flex max-w-md gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="Add your own skill…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={addCustom}
              disabled={!custom.trim()}
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
            >
              + Add
            </button>
          </div>

          <button
            onClick={() => onComplete(role, selected)}
            disabled={selected.length === 0}
            className="mt-8 rounded-full bg-accent px-7 py-3 font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            Build the assessment →
          </button>
          {selected.length === 0 && (
            <p className="mt-3 text-xs text-muted">Pick at least one skill.</p>
          )}
        </>
      )}
    </div>
  );
}
