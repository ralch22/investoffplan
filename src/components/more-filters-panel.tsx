"use client";

import type { ProjectFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface DeveloperOption {
  slug: string;
  name: string;
}

interface MoreFiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  developerOptions: DeveloperOption[];
  amenityOptions: string[];
  /** "sheet" = mobile bottom sheet styling, "popover" = desktop panel styling */
  variant?: "sheet" | "popover";
}

const HANDOVER_YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

const MIN_PRICE_OPTIONS: Array<{ value: number | "all"; label: string }> = [
  { value: "all", label: "No minimum" },
  { value: 500_000, label: "From 500K" },
  { value: 1_000_000, label: "From 1M" },
  { value: 2_000_000, label: "From 2M" },
  { value: 5_000_000, label: "From 5M" },
];

export function MoreFiltersPanel({
  filters,
  onChange,
  developerOptions,
  amenityOptions,
  variant = "sheet",
}: MoreFiltersPanelProps) {
  const labelCls =
    variant === "sheet"
      ? "block text-sm font-semibold text-text-dark"
      : "flex flex-col gap-1.5 text-xs font-medium text-muted";
  const inputCls =
    variant === "sheet"
      ? "focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
      : "iop-input";

  function toggleAmenity(amenity: string) {
    const has = filters.amenities.includes(amenity);
    onChange({
      ...filters,
      amenities: has
        ? filters.amenities.filter((a) => a !== amenity)
        : [...filters.amenities, amenity],
    });
  }

  return (
    <div
      className={cn(
        variant === "popover"
          ? "grid gap-4 md:grid-cols-2 lg:grid-cols-4 [&>fieldset]:col-span-full"
          : "space-y-4",
      )}
    >
      <label className={labelCls}>
        Developer
        <select
          value={filters.developer}
          onChange={(e) => onChange({ ...filters, developer: e.target.value })}
          className={inputCls}
        >
          <option value="all">All developers</option>
          {developerOptions.map((dev) => (
            <option key={dev.slug} value={dev.slug}>
              {dev.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Min price (AED)
        <select
          value={filters.minPrice ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              minPrice: e.target.value === "all" ? null : Number(e.target.value),
            })
          }
          className={inputCls}
        >
          {MIN_PRICE_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Payment plan
        <select
          value={filters.paymentPlan}
          onChange={(e) =>
            onChange({
              ...filters,
              paymentPlan: e.target.value as Filters["paymentPlan"],
            })
          }
          className={inputCls}
        >
          <option value="all">Any plan</option>
          <option value="post-handover">Post-handover plan</option>
          <option value="multiple">Multiple plans</option>
        </select>
      </label>

      <label className={labelCls}>
        Handover by
        <select
          value={filters.handoverBy}
          onChange={(e) =>
            onChange({
              ...filters,
              handoverBy: e.target.value === "all" ? "all" : Number(e.target.value),
            })
          }
          className={inputCls}
        >
          <option value="all">Any date</option>
          {HANDOVER_YEARS.map((year) => (
            <option key={year} value={year}>
              End of {year}
            </option>
          ))}
        </select>
      </label>

      {amenityOptions.length > 0 ? (
        <fieldset>
          <legend
            className={
              variant === "sheet"
                ? "text-sm font-semibold text-text-dark"
                : "text-xs font-medium text-muted"
            }
          >
            Amenities
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => {
              const active = filters.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "iop-btn-press rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white text-muted hover:border-brand hover:text-brand",
                  )}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
