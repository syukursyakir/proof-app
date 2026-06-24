"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ease } from "@/lib/motion";

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
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.25, ease: ease.inOut }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-white/75 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.6)]" />
          Clarion
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/join"
            className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            Have a code? Join
          </Link>
          <Link
            href="/roles"
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground/90 transition-colors hover:border-accent hover:text-foreground"
          >
            For employers
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
