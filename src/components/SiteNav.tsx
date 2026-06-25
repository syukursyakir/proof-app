"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import LangSwitcher from "@/components/LangSwitcher";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

// Flat top-bar nav, lives inside the h-screen hero block (not fixed/floating —
// the hero is the only place this renders, so it never needs scroll-frosting).
export default function SiteNav() {
  const { dict } = useSiteLocale();

  return (
    <header className="relative z-10 flex shrink-0 items-center justify-between px-6 py-5 md:px-12 lg:px-20">
      <Link href="/" className="shrink-0">
        <Logo />
      </Link>
      <div className="hidden items-center gap-8 md:flex">
        <Link
          href="/join"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          {dict.nav.joinInterview}
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <LangSwitcher className="hidden sm:inline-flex" />
        <Link
          href="/roles"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-soft"
        >
          {dict.nav.forEmployers}
        </Link>
      </div>
    </header>
  );
}
