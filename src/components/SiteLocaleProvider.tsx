"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Dict } from "@/components/LocaleProvider";
import { isSupportedLocale, SUPPORTED_LOCALES, type LocaleCode } from "@/lib/i18n";
import en from "@/dictionaries/en.json";
import zh from "@/dictionaries/zh.json";
import ms from "@/dictionaries/ms.json";
import ta from "@/dictionaries/ta.json";
import hi from "@/dictionaries/hi.json";
import id from "@/dictionaries/id.json";
import tl from "@/dictionaries/tl.json";
import vi from "@/dictionaries/vi.json";
import ko from "@/dictionaries/ko.json";
import ja from "@/dictionaries/ja.json";

const DICTS: Record<LocaleCode, Dict> = {
  en: en as Dict,
  zh: zh as Dict,
  ms: ms as Dict,
  ta: ta as Dict,
  hi: hi as Dict,
  id: id as Dict,
  tl: tl as Dict,
  vi: vi as Dict,
  ko: ko as Dict,
  ja: ja as Dict,
};

const STORAGE_KEY = "clarion-locale";

type SiteLocaleCtx = {
  locale: LocaleCode;
  dict: Dict;
  setLocale: (locale: LocaleCode) => void;
};

const SiteLocaleContext = createContext<SiteLocaleCtx>({
  locale: "en",
  dict: en as Dict,
  setLocale: () => {},
});

export function useSiteLocale() {
  return useContext(SiteLocaleContext);
}

export default function SiteLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>("en");

  // Read from localStorage after mount — keeps SSR/hydration in sync (both
  // render "en" first, then client picks up the stored preference).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <SiteLocaleContext.Provider
      value={{ locale, dict: DICTS[locale], setLocale }}
    >
      {children}
    </SiteLocaleContext.Provider>
  );
}

export { SUPPORTED_LOCALES };
