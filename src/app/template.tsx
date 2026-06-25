"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import SiteLocaleProvider from "@/components/SiteLocaleProvider";

// Runs on every route change → gives the whole app a consistent entrance.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <SiteLocaleProvider>
      <motion.div
        className="flex flex-1 flex-col"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: ease.out }}
      >
        {children}
      </motion.div>
    </SiteLocaleProvider>
  );
}
