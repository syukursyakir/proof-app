"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Criterion, Occupation, TestQuestion } from "@/lib/types";

const CATEGORIES: TestQuestion["category"][] = [
  "numerical",
  "verbal",
  "logical",
  "sjt",
];
const CATEGORY_LABEL: Record<TestQuestion["category"], string> = {
  numerical: "Numerical",
  verbal: "Verbal",
  logical: "Logical",
  sjt: "Situational",
};

type Initial = {
  title: string;
  description_raw?: string | null;
  occupation?: Occupation | null;
  rubric: Criterion[];
  test_questions: string[];
  test_mcq?: TestQuestion[] | null;
  interview_questions: string[];
  terms?: string[] | null;
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
  const [mcq, setMcq] = useState<TestQuestion[]>(initial.test_mcq ?? []);
  const [questions, setQuestions] = useState<string[]>(
    initial.interview_questions ?? [],
  );
  const [terms, setTerms] = useState<string[]>(initial.terms ?? []);
  const [testEnabled, setTestEnabled] = useState(initial.test_enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateMcq(i: number, patch: Partial<TestQuestion>) {
    setMcq((m) => m.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function updateMcqOption(i: number, oi: number, v: string) {
    setMcq((m) =>
      m.map((q, idx) => {
        if (idx !== i) return q;
        const options = [...q.options] as TestQuestion["options"];
        options[oi] = v;
        return { ...q, options };
      }),
    );
  }
  function addMcq() {
    setMcq((m) => [
      ...m,
      {
        id: `q${m.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
        category: "numerical",
        question: "",
        options: ["", "", "", ""],
        correct: 0,
      },
    ]);
  }

  function updateCriterion(i: number, key: "name" | "good" | "bad", v: string) {
    setRubric((r) => r.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)));
  }

  function updateAnchor(i: number, level: number, v: string) {
    setRubric((r) =>
      r.map((c, idx) => {
        if (idx !== i) return c;
        const anchors = [...(c.anchors ?? ["", "", "", "", ""])];
        while (anchors.length < 5) anchors.push("");
        anchors[level] = v;
        return { ...c, anchors };
      }),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description_raw: initial.description_raw ?? null,
        occupation: initial.occupation ?? null,
        rubric,
        test_questions: tests,
        test_mcq: mcq.length ? mcq : null,
        interview_questions: questions,
        terms: terms.length ? terms : null,
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
        {initial.occupation?.title && (
          <p className="mt-2 text-xs text-muted">
            Grounded in O*NET occupation:{" "}
            <span className="text-foreground">{initial.occupation.title}</span>
            {initial.occupation.soc_code ? ` (${initial.occupation.soc_code})` : ""}
          </p>
        )}
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
              <div className="mt-3">
                <label className={label}>
                  Score anchors — what each level (1–5) looks like
                </label>
                <div className="mt-2 space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-xs text-muted">{level}</span>
                      <input
                        className={input}
                        placeholder={`A score of ${level} looks like…`}
                        value={c.anchors?.[level - 1] ?? ""}
                        onChange={(e) => updateAnchor(i, level - 1, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aptitude MCQ — review & edit the AI-drafted questions */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aptitude test</h2>
          <button
            type="button"
            onClick={addMcq}
            className="text-sm text-accent-soft hover:underline"
          >
            + Add question
          </button>
        </div>
        <p className="mb-3 text-sm text-muted">
          AI drafted these — <span className="text-foreground">review every question
          and mark the correct answer</span> before candidates take the test. Click an
          option&apos;s circle to set it as correct.
        </p>
        {mcq.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No aptitude questions. Add one, or this part is skipped for candidates.
          </p>
        )}
        <div className="space-y-4">
          {mcq.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted">{i + 1}</span>
                <select
                  value={q.category}
                  onChange={(e) =>
                    updateMcq(i, { category: e.target.value as TestQuestion["category"] })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMcq((m) => m.filter((_, idx) => idx !== i))}
                  className="ml-auto text-xs text-muted hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <textarea
                className={`${input} mt-3 min-h-12`}
                placeholder="Question text"
                value={q.question}
                onChange={(e) => updateMcq(i, { question: e.target.value })}
              />
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = q.correct === oi;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() => updateMcq(i, { correct: oi })}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                          isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-border text-muted hover:border-green-400"
                        }`}
                      >
                        {isCorrect ? "✓" : String.fromCharCode(65 + oi)}
                      </button>
                      <input
                        className={`${input} ${isCorrect ? "border-green-400" : ""}`}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        value={opt}
                        onChange={(e) => updateMcqOption(i, oi, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills work-sample questions */}
      <StringList
        title="Skills work-sample"
        items={tests}
        setItems={setTests}
        placeholder="Open-ended skills question"
        toggle={{ value: testEnabled, set: setTestEnabled, label: "Include written tests" }}
      />

      {/* Interview questions */}
      <StringList
        title="Interview questions"
        items={questions}
        setItems={setQuestions}
        placeholder="Interview question"
      />

      {/* Glossary / terms */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Glossary</h2>
          <button
            type="button"
            onClick={() => setTerms((t) => [...t, ""])}
            className="text-sm text-accent-soft hover:underline"
          >
            + Add term
          </button>
        </div>
        <p className="mb-3 text-sm text-muted">
          Terms, tools, and proper nouns the AI interviewer should recognise when a
          candidate says them aloud — so speech-to-text mishearings (e.g. &ldquo;cloud
          code&rdquo; → &ldquo;Claude Code&rdquo;) get corrected. Add any company-specific jargon.
        </p>
        <div className="space-y-2">
          {terms.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={input}
                placeholder="e.g. Claude Code, Salesforce, FIFO"
                value={t}
                onChange={(e) =>
                  setTerms((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))
                }
              />
              <button
                type="button"
                onClick={() => setTerms((arr) => arr.filter((_, idx) => idx !== i))}
                className="shrink-0 text-xs text-muted hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
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
