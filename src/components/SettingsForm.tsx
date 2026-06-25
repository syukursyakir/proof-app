"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        placeholder="Acme Dental"
        maxLength={80}
        className="flex-1"
      />
      <Button
        onClick={save}
        disabled={!name.trim() || name === initialName}
        loading={saving}
        loadingText={s.saving}
      >
        {saved ? s.saved : s.save}
      </Button>
      {error && <p className="self-center text-sm text-accent-clay">{error}</p>}
    </div>
  );
}
