"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

// Opacity-only on purpose: a translate transform here makes this wrapper a
// containing block for position:fixed descendants (sticky header, mobile
// bottom bars) — they visibly jump on every route transition.
//
// useRef trick: first render gets initial={opacity:1} (no flash), subsequent
// SPA navigations get initial={opacity:0} → animate to 1 (the intended fade).
export default function Template({ children }: { children: React.ReactNode }) {
  const firstRender = useRef(true);
  const initial = firstRender.current ? { opacity: 1 } : { opacity: 0 };
  firstRender.current = false;

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
