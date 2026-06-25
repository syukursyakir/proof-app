"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export default function SettingsForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const { dict } = useSiteLocale();
  const s = dict.employer.settingsP;
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? s.saveFailed);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : s.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        placeholder="Acme Dental"
        maxLength={80}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        onClick={save}
        disabled={saving || !name.trim() || name === initialName}
        className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-50"
      >
        {saving ? s.saving : saved ? s.saved : s.save}
      </button>
      {error && <p className="self-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
