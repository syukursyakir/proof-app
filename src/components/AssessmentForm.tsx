"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Criterion } from "@/lib/types";

type Initial = {
  title: string;
  description_raw?: string | null;
  rubric: Criterion[];
  test_questions: string[];
  interview_questions: string[];
  test_enabled: boolean;
};

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const label = "text-xs font-medium uppercase tracking-wide text-muted";

export default function AssessmentForm({
  mode,
  roleId,
  initial,
}: {
  mode: "create" | "edit";
  roleId?: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [rubric, setRubric] = useState<Criterion[]>(initial.rubric ?? []);
  const [tests, setTests] = useState<string[]>(initial.test_questions ?? []);
  const [questions, setQuestions] = useState<string[]>(
    initial.interview_questions ?? [],
  );
  const [testEnabled, setTestEnabled] = useState(initial.test_enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCriterion(i: number, key: keyof Criterion, v: string) {
    setRubric((r) => r.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description_raw: initial.description_raw ?? null,
        rubric,
        test_questions: tests,
        interview_questions: questions,
        test_enabled: testEnabled,
        ...(mode === "edit" ? { id: roleId } : {}),
      };
      const res = await fetch("/api/roles", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      router.push("/roles");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <label className={label}>Role title</label>
        <input
          className={`${input} mt-2 text-lg`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Rubric */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rubric</h2>
          <button
            type="button"
            onClick={() =>
              setRubric((r) => [...r, { name: "", good: "", bad: "" }])
            }
            className="text-sm text-accent-soft hover:underline"
          >
            + Add criterion
          </button>
        </div>
        <div className="space-y-4">
          {rubric.map((c, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2">
                <input
                  className={input}
                  placeholder="Criterion name"
                  value={c.name}
                  onChange={(e) => updateCriterion(i, "name", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setRubric((r) => r.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-xs text-muted hover:text-foreground"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Good looks like</label>
                  <textarea
                    className={`${input} mt-1 min-h-16`}
                    value={c.good}
                    onChange={(e) => updateCriterion(i, "good", e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Bad looks like</label>
                  <textarea
                    className={`${input} mt-1 min-h-16`}
                    value={c.bad}
                    onChange={(e) => updateCriterion(i, "bad", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Test questions */}
      <StringList
        title="Skills test"
        items={tests}
        setItems={setTests}
        placeholder="Test question"
        toggle={{ value: testEnabled, set: setTestEnabled, label: "Include skills test" }}
      />

      {/* Interview questions */}
      <StringList
        title="Interview questions"
        items={questions}
        setItems={setQuestions}
        placeholder="Interview question"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-accent px-6 py-2.5 font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save role"}
        </button>
      </div>
    </div>
  );
}

function StringList({
  title,
  items,
  setItems,
  placeholder,
  toggle,
}: {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  toggle?: { value: boolean; set: (v: boolean) => void; label: string };
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {toggle && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={toggle.value}
                onChange={(e) => toggle.set(e.target.checked)}
              />
              {toggle.label}
            </label>
          )}
        </div>
        <button
          type="button"
          onClick={() => setItems((q) => [...q, ""])}
          className="text-sm text-accent-soft hover:underline"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-xs text-muted">
              {i + 1}
            </span>
            <input
              className={input}
              placeholder={placeholder}
              value={q}
              onChange={(e) =>
                setItems((arr) =>
                  arr.map((x, idx) => (idx === i ? e.target.value : x)),
                )
              }
            />
            <button
              type="button"
              onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}
              className="shrink-0 text-xs text-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
