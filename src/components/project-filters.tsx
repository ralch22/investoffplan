"use client";

import { useState } from "react";
import type { ProjectFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  MoreFiltersPanel,
  type DeveloperOption,
} from "@/components/more-filters-panel";

interface ProjectFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  developerOptions?: DeveloperOption[];
  amenityOptions?: string[];
  className?: string;
}

const labelClass = "text-xs font-medium text-muted";

export function countMoreFilters(filters: Filters): number {
  return (
    (filters.developer !== "all" ? 1 : 0) +
    (filters.paymentPlan !== "all" ? 1 : 0) +
    (filters.handoverBy !== "all" ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    filters.amenities.length
  );
}

export function ProjectFilters({
  filters,
  onChange,
  developerOptions = [],
  amenityOptions = [],
  className,
}: ProjectFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreCount = countMoreFilters(filters);

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-elevation-md md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] md:items-end",
        className,
      )}
    >
      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        Search
        <input
          type="search"
          placeholder="Project, developer, area..."
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          className="iop-input"
        />
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        Property type
        <select
          value={filters.propertyType}
          onChange={(e) =>
            onChange({
              ...filters,
              propertyType: e.target.value as Filters["propertyType"],
            })
          }
          className="iop-input"
        >
          <option value="all">All types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="townhouse">Townhouse</option>
          <option value="penthouse">Penthouse</option>
        </select>
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        Beds
        <select
          value={filters.beds}
          onChange={(e) =>
            onChange({
              ...filters,
              beds:
                e.target.value === "all"
                  ? "all"
                  : e.target.value === "studio"
                    ? "studio"
                    : Number(e.target.value),
            })
          }
          className="iop-input"
        >
          <option value="all">Any</option>
          <option value="studio">Studio</option>
          <option value="1">1 Bed</option>
          <option value="2">2 Beds</option>
          <option value="3">3 Beds</option>
          <option value="4">4 Beds</option>
          <option value="5">5+ Beds</option>
        </select>
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        Max price (AED)
        <select
          value={filters.maxPrice ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              maxPrice:
                e.target.value === "all" ? null : Number(e.target.value),
            })
          }
          className="iop-input"
        >
          <option value="all">Any</option>
          <option value="1500000">Up to 1.5M</option>
          <option value="2500000">Up to 2.5M</option>
          <option value="4000000">Up to 4M</option>
        </select>
      </label>

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
        className={cn(
          "iop-btn-press focus-ring hidden h-12 rounded-xl border px-4 text-sm font-semibold md:inline-flex md:items-center md:justify-center md:gap-2",
          moreOpen || moreCount > 0
            ? "border-brand bg-brand text-white hover:bg-brand-dark"
            : "border-brand text-brand hover:bg-brand-muted",
        )}
      >
        More filters
        {moreCount > 0 ? (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
            {moreCount}
          </span>
        ) : null}
      </button>

      {moreOpen ? (
        <div className="hidden border-t border-border pt-4 md:col-span-full md:block">
          <MoreFiltersPanel
            filters={filters}
            onChange={onChange}
            developerOptions={developerOptions}
            amenityOptions={amenityOptions}
            variant="popover"
          />
        </div>
      ) : null}
    </div>
  );
}