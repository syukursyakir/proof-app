"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Criterion, Occupation, TestQuestion } from "@/lib/types";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

const CATEGORIES: TestQuestion["category"][] = [
  "numerical",
  "verbal",
  "logical",
  "sjt",
];

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
  resume_mode?: "off" | "optional" | "required";
  language?: string;
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
  const { locale: siteLocale, dict } = useSiteLocale();
  const f = dict.employer.form;
  const CATEGORY_LABEL: Record<TestQuestion["category"], string> = {
    numerical: f.categoryNumerical,
    verbal: f.categoryVerbal,
    logical: f.categoryLogical,
    sjt: f.categorySjt,
  };
  const [language, setLanguage] = useState<string>(initial.language ?? "en");

  // Once the site locale is read from localStorage (after mount), default new
  // roles to that locale if no language was pre-set from the DB.
  useEffect(() => {
    if (!initial.language) setLanguage(siteLocale);
  }, [siteLocale, initial.language]);

  const [title, setTitle] = useState(initial.title);
  const [rubric, setRubric] = useState<Criterion[]>(initial.rubric ?? []);
  const [tests, setTests] = useState<string[]>(initial.test_questions ?? []);
  const [mcq, setMcq] = useState<TestQuestion[]>(initial.test_mcq ?? []);
  const [critique, setCritique] = useState<
    Record<string, { verdict: "good" | "easy" | "flawed"; note: string }>
  >({});
  const [checking, setChecking] = useState(false);

  async function checkDifficulty() {
    if (!mcq.length) return;
    setChecking(true);
    try {
      const res = await fetch("/api/critique-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: mcq }),
      });
      const data = await res.json();
      const map: typeof critique = {};
      for (const it of data.items ?? []) {
        if (it?.id) map[it.id] = { verdict: it.verdict, note: it.note };
      }
      setCritique(map);
    } finally {
      setChecking(false);
    }
  }
  const [questions, setQuestions] = useState<string[]>(
    initial.interview_questions ?? [],
  );
  const [terms, setTerms] = useState<string[]>(initial.terms ?? []);
  const [testEnabled, setTestEnabled] = useState(initial.test_enabled);
  const [resumeMode, setResumeMode] = useState<"off" | "optional" | "required">(
    initial.resume_mode ?? "optional",
  );
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
        resume_mode: resumeMode,
        language,
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
      {/* Candidate language — for "create" the wizard already asked this upfront */}
      {mode === "edit" && (
        <section>
          <h2 className="text-lg font-semibold">{f.candidateLanguage}</h2>
          <p className="mb-3 mt-1 text-sm text-muted">{f.candidateLanguageDesc}</p>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  language === l.code
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted hover:border-accent"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <div>
        <label className={label}>{f.roleTitle}</label>
        <input
          className={`${input} mt-2 text-lg`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {initial.occupation?.title && (
          <p className="mt-2 text-xs text-muted">
            {f.groundedIn}{" "}
            <span className="text-foreground">{initial.occupation.title}</span>
            {initial.occupation.soc_code ? ` (${initial.occupation.soc_code})` : ""}
          </p>
        )}
      </div>

      {/* Rubric */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{f.rubric}</h2>
          <button
            type="button"
            onClick={() =>
              setRubric((r) => [...r, { name: "", good: "", bad: "" }])
            }
            className="text-sm text-accent-soft hover:underline"
          >
            {f.addCriterion}
          </button>
        </div>
        <div className="space-y-4">
          {rubric.map((c, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2">
                <input
                  className={input}
                  placeholder={f.criterionName}
                  value={c.name}
                  onChange={(e) => updateCriterion(i, "name", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setRubric((r) => r.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-xs text-muted hover:text-foreground"
                >
                  {f.remove}
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>{f.goodLooksLike}</label>
                  <textarea
                    className={`${input} mt-1 min-h-16`}
                    value={c.good}
                    onChange={(e) => updateCriterion(i, "good", e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>{f.badLooksLike}</label>
                  <textarea
                    className={`${input} mt-1 min-h-16`}
                    value={c.bad}
                    onChange={(e) => updateCriterion(i, "bad", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={label}>{f.scoreAnchors}</label>
                <div className="mt-2 space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-xs text-muted">{level}</span>
                      <input
                        className={input}
                        placeholder={f.scoreAnchorPlaceholder.replace("{level}", String(level))}
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
          <h2 className="text-lg font-semibold">{f.aptitudeTest}</h2>
          <div className="flex items-center gap-3">
            {mcq.length > 0 && (
              <button
                type="button"
                onClick={checkDifficulty}
                disabled={checking}
                className="text-sm text-accent-soft hover:underline disabled:opacity-50"
              >
                {checking ? f.checking : f.checkDifficulty}
              </button>
            )}
            <button
              type="button"
              onClick={addMcq}
              className="text-sm text-accent-soft hover:underline"
            >
              {f.addQuestion}
            </button>
          </div>
        </div>
        <p className="mb-3 text-sm text-muted">{f.mcqHint}</p>
        {mcq.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            {f.noAptitude}
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
                {critique[q.id] &&
                  (() => {
                    const v = critique[q.id];
                    const style =
                      v.verdict === "good"
                        ? "bg-green-100 text-green-700"
                        : v.verdict === "easy"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700";
                    const vlabel =
                      v.verdict === "good"
                        ? f.verdictGood
                        : v.verdict === "easy"
                          ? f.verdictEasy
                          : f.verdictFlawed;
                    return (
                      <span
                        title={v.note}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
                      >
                        {vlabel}
                      </span>
                    );
                  })()}
                <button
                  type="button"
                  onClick={() => setMcq((m) => m.filter((_, idx) => idx !== i))}
                  className="ml-auto text-xs text-muted hover:text-red-600"
                >
                  {f.remove}
                </button>
              </div>
              {critique[q.id] && critique[q.id].verdict !== "good" && (
                <p className="mt-1 pl-6 text-xs text-muted">{critique[q.id].note}</p>
              )}
              <textarea
                className={`${input} mt-3 min-h-12`}
                placeholder={f.questionTextPlaceholder}
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
                        placeholder={f.optionPlaceholder.replace("{letter}", String.fromCharCode(65 + oi))}
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
        title={f.skillsTitle}
        items={tests}
        setItems={setTests}
        placeholder={f.skillsPlaceholder}
        addLabel={f.add}
        removeLabel={f.remove}
        toggle={{ value: testEnabled, set: setTestEnabled, label: f.includeWrittenTests }}
      />

      {/* Interview questions */}
      <StringList
        title={f.interviewQuestionsTitle}
        items={questions}
        setItems={setQuestions}
        placeholder={f.interviewQuestionPlaceholder}
        addLabel={f.add}
        removeLabel={f.remove}
      />

      {/* Glossary / terms */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{f.glossary}</h2>
          <button
            type="button"
            onClick={() => setTerms((t) => [...t, ""])}
            className="text-sm text-accent-soft hover:underline"
          >
            {f.addTerm}
          </button>
        </div>
        <p className="mb-3 text-sm text-muted">{f.glossaryHint}</p>
        <div className="space-y-2">
          {terms.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={input}
                placeholder={f.termPlaceholder}
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
                {f.remove}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Resume collection */}
      <section>
        <h2 className="text-lg font-semibold">{f.resume}</h2>
        <p className="mb-3 mt-1 text-sm text-muted">{f.resumeHint}</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "off", label: f.resumeOff },
              { v: "optional", label: f.resumeOptional },
              { v: "required", label: f.resumeRequired },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setResumeMode(opt.v)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                resumeMode === opt.v
                  ? "border-accent bg-accent text-white"
                  : "border-border text-muted hover:border-accent"
              }`}
            >
              {opt.label}
            </button>
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
          {saving ? f.saving : mode === "edit" ? f.saveChanges : f.saveRole}
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
  addLabel,
  removeLabel,
  toggle,
}: {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
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
          {addLabel}
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
              {removeLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
