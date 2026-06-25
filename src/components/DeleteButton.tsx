"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export default function DeleteButton({
  endpoint,
  id,
  redirectTo,
  label,
  confirmLabel,
}: {
  endpoint: "/api/roles" | "/api/candidates";
  id: string;
  redirectTo: string;
  label?: string;
  confirmLabel?: string;
}) {
  const router = useRouter();
  const { dict } = useSiteLocale();
  const d = dict.employer.delete;
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!arming) {
      setArming(true);
      setTimeout(() => setArming(false), 4000);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setBusy(false);
      setArming(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        arming
          ? "border-red-500 bg-red-500 text-white"
          : "border-border text-muted hover:border-red-400 hover:text-red-600"
      }`}
    >
      {busy ? d.deleting : arming ? (confirmLabel ?? d.defaultConfirm) : (label ?? d.label)}
    </button>
  );
}
