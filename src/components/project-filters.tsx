"use client";

import { useState } from "react";
import type { ProjectFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  MoreFiltersPanel,
  type DeveloperOption,
} from "@/components/more-filters-panel";
import { useI18n } from "@/i18n/locale-provider";

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
  const { dict } = useI18n();
  const f = dict.serp.filters;

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-elevation-md md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] md:items-end",
        className,
      )}
    >
      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        {f.search}
        <input
          type="search"
          placeholder={f.searchPlaceholder}
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          className="iop-input"
        />
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        {f.propertyType}
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
          <option value="all">{f.allTypes}</option>
          <option value="apartment">{f.apartment}</option>
          <option value="villa">{f.villa}</option>
          <option value="townhouse">{f.townhouse}</option>
          <option value="penthouse">{f.penthouse}</option>
        </select>
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        {f.beds}
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
          <option value="all">{f.any}</option>
          <option value="studio">{f.studio}</option>
          <option value="1">{f.bed1}</option>
          <option value="2">{f.beds2}</option>
          <option value="3">{f.beds3}</option>
          <option value="4">{f.beds4}</option>
          <option value="5">{f.beds5Plus}</option>
        </select>
      </label>

      <label className={cn("flex flex-col gap-1.5", labelClass)}>
        {f.maxPrice}
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
          <option value="all">{f.any}</option>
          <option value="1500000">{f.upTo15m}</option>
          <option value="2500000">{f.upTo25m}</option>
          <option value="4000000">{f.upTo4m}</option>
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
        {f.moreFilters}
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