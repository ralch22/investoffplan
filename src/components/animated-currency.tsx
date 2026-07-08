"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

interface AnimatedCurrencyProps {
  value: number;
  currency?: CurrencyCode;
  className?: string;
}

/**
 * Morphs a currency figure from its previous value to the new one whenever it
 * changes — so recalculating the mortgage feels live instead of teleporting
 * (design audit 3.5). `tabular-nums` on the caller keeps digits from jittering.
 * Snaps instantly for prefers-reduced-motion.
 */
export function AnimatedCurrency({ value, currency = "AED", className }: AnimatedCurrencyProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{formatPrice(Math.round(display), currency)}</span>;
}
