"use client";

import type { SortOption } from "@/lib/types";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "value-asc", label: "Best value (AED/sqft)" },
  { value: "handover-asc", label: "Handover: Soonest" },
  { value: "handover-desc", label: "Handover: Latest" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Sort by:</span>
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