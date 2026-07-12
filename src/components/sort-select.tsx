"use client";

import type { SortOption } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}


export function SortSelect({ value, onChange }: SortSelectProps) {
  const { dict } = useI18n();
  const s = dict.serp.sort;

  const OPTIONS: { value: SortOption; label: string }[] = [
    { value: "featured", label: s.featured },
    { value: "price-asc", label: s.priceAsc },
    { value: "price-desc", label: s.priceDesc },
    { value: "value-asc", label: s.bestValue },
    { value: "handover-asc", label: s.handoverSoonest },
    { value: "handover-desc", label: s.handoverLatest },
  ];

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline" aria-hidden="true">
        {s.sortBy}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label={s.sortBy}
        className="focus-ring rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm font-medium text-text-dark outline-none hover:border-[var(--input-border-strong)]"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}