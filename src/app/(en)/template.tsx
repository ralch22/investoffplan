"use client";

import { motion } from "framer-motion";

// Opacity-only on purpose: a translate transform here makes this wrapper a
// containing block for position:fixed descendants (sticky header, mobile
// bottom bars) — they visibly jump on every route transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
