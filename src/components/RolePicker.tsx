"use client";

import { useState } from "react";
import {
  HeadsetIcon,
  TrendingUpIcon,
  CodeIcon,
  CalculatorIcon,
  BoxesIcon,
  ShoppingBagIcon,
  HeartIcon,
  PencilIcon,
  MicIcon,
} from "@/components/icons";

type Category = {
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  roles: string[];
};

// Two levels: category → specific role. "Other" at each level keeps it adaptive.
const CATEGORIES: Category[] = [
  {
    label: "Customer & Support",
    Icon: HeadsetIcon,
    roles: ["Customer Support Rep", "Call Centre Agent", "Help Desk / IT Support", "Client Success"],
  },
  {
    label: "Sales & Marketing",
    Icon: TrendingUpIcon,
    roles: ["Sales Representative", "Account Executive", "Marketing Coordinator", "Social Media Manager"],
  },
  {
    label: "Software & Tech",
    Icon: CodeIcon,
    roles: ["Software Engineer", "Frontend Developer", "Backend Developer", "QA / Tester", "Data Analyst"],
  },
  {
    label: "Finance & Admin",
    Icon: CalculatorIcon,
    roles: ["Accountant", "Bookkeeper", "Finance Analyst", "Admin Assistant", "Office Manager"],
  },
  {
    label: "Operations",
    Icon: BoxesIcon,
    roles: ["Operations Coordinator", "Warehouse Associate", "Logistics / Dispatch", "Supply Chain"],
  },
  {
    label: "Retail & Hospitality",
    Icon: ShoppingBagIcon,
    roles: ["Cashier", "Retail Associate", "Barista", "Server / Waitstaff", "Front Desk / Receptionist"],
  },
  {
    label: "Healthcare & Care",
    Icon: HeartIcon,
    roles: ["Caregiver", "Medical Assistant", "Dental Nurse", "Clinic Receptionist"],
  },
];

export default function RolePicker({
  onComplete,
  onDescribeInstead,
}: {
  onComplete: (role: string, skills: string[]) => void;
  onDescribeInstead: () => void;
}) {
  const [step, setStep] = useState<"category" | "role" | "skills">("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [otherCat, setOtherCat] = useState(false);
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");

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
    setSelected((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }
  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!suggested.includes(v)) setSuggested((s) => [...s, v]);
    if (!selected.includes(v)) setSelected((s) => [...s, v]);
    setCustom("");
  }

  // Prominent voice/describe card — we want to encourage this path.
  const VoiceCard = (
    <button
      onClick={onDescribeInstead}
      className="lift mt-8 flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-left transition-colors hover:border-accent"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        <MicIcon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-medium text-foreground">
          Rather just talk? Describe the role by voice
        </span>
        <span className="block text-sm text-muted">
          Say what you need in your own words — Clarion builds the whole assessment.
        </span>
      </span>
      <span className="ml-auto text-accent-soft">→</span>
    </button>
  );

  // ---- Level 1: category ----
  if (step === "category") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          What are you hiring for?
        </h1>
        <p className="mt-2 text-muted">
          Pick an area — you&apos;ll choose the exact role next. No long forms.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                setCategory(c);
                setOtherCat(false);
                setStep("role");
              }}
              className="lift flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 px-3 py-6 text-center text-sm font-medium text-foreground/80 transition-colors hover:border-accent hover:text-foreground"
            >
              <c.Icon className="h-6 w-6 text-accent" />
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setOtherCat((o) => !o)}
            className={`flex flex-col items-center gap-3 rounded-2xl border px-3 py-6 text-center text-sm font-medium transition-colors ${
              otherCat ? "border-accent text-foreground" : "border-dashed border-border text-foreground/80 hover:border-accent hover:text-foreground"
            }`}
          >
            <PencilIcon className="h-6 w-6 text-accent" />
            Other
          </button>
        </div>

        {otherCat && (
          <div className="mt-4 flex gap-2">
            <input
              autoFocus
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pickRole(customRole)}
              placeholder="Type the role — e.g. Warehouse supervisor, Tutor…"
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

        {VoiceCard}
      </div>
    );
  }

  // ---- Level 2: specific role ----
  if (step === "role" && category) {
    return (
      <div>
        <button
          onClick={() => setStep("category")}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
        >
          ← All areas
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">
          Which {category.label.toLowerCase()} role?
        </h1>
        <p className="mt-2 text-muted">Pick the closest — or add your own.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {category.roles.map((r) => (
            <button
              key={r}
              onClick={() => pickRole(r)}
              className="rounded-full bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground/80 ring-1 ring-border transition hover:ring-accent"
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-5 flex max-w-md gap-2">
          <input
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pickRole(customRole)}
            placeholder="Other role…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => pickRole(customRole)}
            disabled={!customRole.trim()}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
          >
            Next →
          </button>
        </div>

        {VoiceCard}
      </div>
    );
  }

  // ---- Level 3: skills ----
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
