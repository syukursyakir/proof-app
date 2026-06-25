import type { Dict } from "@/components/LocaleProvider";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tl", label: "Filipino" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];

export function isSupportedLocale(code: string): code is LocaleCode {
  return SUPPORTED_LOCALES.some((l) => l.code === code);
}

const loaders: Record<LocaleCode, () => Promise<Dict>> = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default as Dict),
  zh: () => import("@/dictionaries/zh.json").then((m) => m.default as Dict),
  ms: () => import("@/dictionaries/ms.json").then((m) => m.default as Dict),
  ta: () => import("@/dictionaries/ta.json").then((m) => m.default as Dict),
  hi: () => import("@/dictionaries/hi.json").then((m) => m.default as Dict),
  id: () => import("@/dictionaries/id.json").then((m) => m.default as Dict),
  tl: () => import("@/dictionaries/tl.json").then((m) => m.default as Dict),
  vi: () => import("@/dictionaries/vi.json").then((m) => m.default as Dict),
  ko: () => import("@/dictionaries/ko.json").then((m) => m.default as Dict),
  ja: () => import("@/dictionaries/ja.json").then((m) => m.default as Dict),
};

export async function getDictionary(locale: string): Promise<Dict> {
  const code = isSupportedLocale(locale) ? locale : "en";
  return loaders[code]();
}
