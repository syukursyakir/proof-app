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
import { skillsForCategory } from "@/lib/skillsLibrary";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

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
  const { dict } = useSiteLocale();
  const p = dict.employer.picker;
  const w = dict.employer.wizard;
  const [step, setStep] = useState<"category" | "role" | "skills">("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [otherCat, setOtherCat] = useState(false);
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [suggested, setSuggested] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [custom, setCustom] = useState("");

  async function fetchAiSkills(r: string): Promise<string[]> {
    const res = await fetch("/api/suggest-skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    });
    const data = await res.json();
    return Array.isArray(data.skills) ? data.skills : [];
  }

  async function pickRole(r: string) {
    const role = r.trim();
    if (!role) return;
    setRole(role);
    setStep("skills");
    setSelected([]);
    setCustom("");

    // Known category -> show the curated batch INSTANTLY (no AI wait).
    if (category) {
      setSuggested(skillsForCategory(category.label));
      setLoadingSkills(false);
      return;
    }
    // Custom "Other" role -> fall back to AI suggestions.
    setLoadingSkills(true);
    setSuggested([]);
    try {
      const ai = await fetchAiSkills(role);
      setSuggested(ai.length ? ai : skillsForCategory(null));
    } catch {
      setSuggested(skillsForCategory(null));
    } finally {
      setLoadingSkills(false);
    }
  }

  // Append AI ideas to the curated batch for anything we didn't pre-list.
  async function suggestMore() {
    setLoadingMore(true);
    try {
      const ai = await fetchAiSkills(role);
      setSuggested((cur) => {
        const seen = new Set(cur.map((s) => s.toLowerCase()));
        const extra = ai.filter((s) => !seen.has(s.toLowerCase()));
        return [...cur, ...extra];
      });
    } catch {
      /* no-op */
    } finally {
      setLoadingMore(false);
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
        <span className="block font-medium text-foreground">{p.voiceTitle}</span>
        <span className="block text-sm text-muted">{p.voiceSubtitle}</span>
      </span>
      <span className="ml-auto text-accent-soft">→</span>
    </button>
  );

  // ---- Level 1: category ----
  if (step === "category") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {p.categoryTitle}
        </h1>
        <p className="mt-2 text-muted">{p.categorySubtitle}</p>

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
            {p.other}
          </button>
        </div>

        {otherCat && (
          <div className="mt-4 flex gap-2">
            <input
              autoFocus
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pickRole(customRole)}
              placeholder={p.customRolePlaceholder}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => pickRole(customRole)}
              disabled={!customRole.trim()}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-50"
            >
              {w.next}
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
          {p.allAreas}
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">
          {p.whichRole.replace("{category}", category.label.toLowerCase())}
        </h1>
        <p className="mt-2 text-muted">{p.pickClosest}</p>

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
            placeholder={p.otherRolePlaceholder}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => pickRole(customRole)}
            disabled={!customRole.trim()}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
          >
            {w.next}
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
        {p.changeRole}
      </button>
      <h1 className="text-3xl font-semibold tracking-tight">
        {p.whichSkills.replace("{role}", role.toLowerCase())}
      </h1>
      <p className="mt-2 text-muted">{p.tapSkills}</p>

      {loadingSkills ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <span className="orb-pulse h-3 w-3 rounded-full bg-accent" />
          {p.suggestingSkills}
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
              placeholder={p.addSkillPlaceholder}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={addCustom}
              disabled={!custom.trim()}
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
            >
              {dict.employer.form.add}
            </button>
          </div>

          <button
            onClick={suggestMore}
            disabled={loadingMore}
            className="mt-3 text-sm text-accent-soft hover:underline disabled:opacity-50"
          >
            {loadingMore ? p.thinking : p.suggestMore}
          </button>

          <button
            onClick={() => onComplete(role, selected)}
            disabled={selected.length === 0}
            className="mt-8 rounded-full bg-accent px-7 py-3 font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            {p.buildAssessment}
          </button>
          {selected.length === 0 && (
            <p className="mt-3 text-xs text-muted">{p.pickAtLeastOne}</p>
          )}
        </>
      )}
    </div>
  );
}
