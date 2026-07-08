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
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">{s.sortBy}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
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