"use client";

import { createContext, useContext } from "react";
import type en from "@/dictionaries/en.json";

export type Dict = typeof en;

const LocaleContext = createContext<{ dict: Dict; locale: string }>({
  dict: {} as Dict,
  locale: "en",
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function LocaleProvider({
  dict,
  locale,
  children,
}: {
  dict: Dict;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ dict, locale }}>
      {children}
    </LocaleContext.Provider>
  );
}
