"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ease } from "@/lib/motion";
import Logo from "@/components/Logo";

// Frosted-on-scroll, hide-on-scroll-down sticky header (Vercel/Linear pattern).
export default function SiteNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 150);
    setScrolled(y > 16);
  });

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: hidden ? "-160%" : "0%" }}
      transition={{ duration: 0.25, ease: ease.inOut }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      {/* Floating frosted pill (Asme-style), tuned to the warm/light theme. */}
      <nav
        className={`mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full py-2.5 pl-4 pr-2.5 transition-all duration-300 ${
          scrolled
            ? "border border-border/70 bg-[rgba(252,251,248,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_30px_-12px_rgba(20,24,30,0.18)] backdrop-blur-xl"
            : "border border-border/50 bg-[rgba(252,251,248,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md"
        }`}
    >
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/join"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
          >
            Join interview
          </Link>
          <Link
            href="/roles"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-soft"
          >
            For employers
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
