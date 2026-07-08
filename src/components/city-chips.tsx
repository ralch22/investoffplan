"use client";

import { cn } from "@/lib/cn";
import type { CitySlug } from "@/lib/types";

interface CityOption {
  slug: CitySlug;
  label: string;
  count: number;
}

interface CityChipsProps {
  cities: CityOption[];
  value: CitySlug;
  onChange: (value: CitySlug) => void;
}

export function CityChips({ cities, value, onChange }: CityChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter by city"
    >
      {cities.map((city) => (
        <button
          key={city.slug}
          type="button"
          onClick={() => onChange(city.slug)}
          aria-pressed={value === city.slug}
          className={cn(
            "iop-btn-press focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
            value === city.slug
              ? "border-brand bg-brand text-white shadow-elevation-sm"
              : "border-border bg-surface text-text-dark hover:border-brand hover:text-brand",
          )}
        >
          {city.label}
          <span className="ms-1.5 text-xs opacity-75">({city.count})</span>
        </button>
      ))}
    </div>
  );
}