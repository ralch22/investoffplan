"use client";

import type { ProjectFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/cn";
import { interpolate } from "@/i18n";
import { useI18n } from "@/i18n/locale-provider";

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

export function MoreFiltersPanel({
  filters,
  onChange,
  developerOptions,
  amenityOptions,
  variant = "sheet",
}: MoreFiltersPanelProps) {
  const { dict } = useI18n();
  const f = dict.serp.filters;

  const MIN_PRICE_OPTIONS: Array<{ value: number | "all"; label: string }> = [
    { value: "all", label: f.noMinimum },
    { value: 500_000, label: f.from500k },
    { value: 1_000_000, label: f.from1m },
    { value: 2_000_000, label: f.from2m },
    { value: 5_000_000, label: f.from5m },
  ];

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
        {f.developer}
        <select
          value={filters.developer}
          onChange={(e) => onChange({ ...filters, developer: e.target.value })}
          className={inputCls}
        >
          <option value="all">{f.allDevelopers}</option>
          {developerOptions.map((dev) => (
            <option key={dev.slug} value={dev.slug}>
              {dev.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        {f.minPrice}
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
        {f.paymentPlan}
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
          <option value="all">{f.anyPlan}</option>
          <option value="post-handover">{f.postHandoverPlan}</option>
          <option value="multiple">{f.multiplePlans}</option>
        </select>
      </label>

      <label className={labelCls}>
        {f.handoverBy}
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
          <option value="all">{f.anyDate}</option>
          {HANDOVER_YEARS.map((year) => (
            <option key={year} value={year}>
              {interpolate(f.endOfYear, { year })}
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
            {f.amenities}
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
                    "iop-btn-press focus-ring min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition",
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
