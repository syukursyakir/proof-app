"use client";

import { useSiteLocale, SUPPORTED_LOCALES } from "@/components/SiteLocaleProvider";
import type { LocaleCode } from "@/lib/i18n";

export default function LangSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useSiteLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as LocaleCode)}
      aria-label="Interface language"
      className={`cursor-pointer rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground focus:outline-none ${className ?? ""}`}
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
