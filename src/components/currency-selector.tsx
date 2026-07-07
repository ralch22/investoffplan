"use client";

import type { CurrencyCode } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  className?: string;
}

const OPTIONS: CurrencyCode[] = ["AED", "USD"];

export function CurrencySelector({
  value,
  onChange,
  className,
}: CurrencySelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-surface p-0.5 text-xs font-semibold shadow-elevation-sm",
        className,
      )}
      role="group"
      aria-label="Currency"
    >
      {OPTIONS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            "iop-btn-press focus-ring rounded-full px-3 py-1.5 transition",
            value === code
              ? "bg-text-dark text-white"
              : "text-muted hover:text-text-dark",
          )}
          aria-pressed={value === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}