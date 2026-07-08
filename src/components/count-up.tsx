"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  className?: string;
  /** ms; the roll-up duration. */
  durationMs?: number;
}

/**
 * Rolls a stat from 0 → value once it scrolls into view — the "the catalog is
 * alive" signal (design audit 3.1 P2). Transform-free (text swap only, so no
 * CLS/LCP cost) and gated by prefers-reduced-motion, which snaps to the final
 * value instantly.
 */
export function CountUp({ value, className, durationMs = 900 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduced, durationMs]);

  return (
    <span ref={ref} className={className}>
      {Math.round(display).toLocaleString()}
    </span>
  );
}
