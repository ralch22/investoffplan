"use client";

import type { ProjectFilters as Filters } from "@/lib/types";
import {
  MoreFiltersPanel,
  type DeveloperOption,
} from "@/components/more-filters-panel";

interface MobileFilterSheetProps {
  open: boolean;
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClose: () => void;
  developerOptions?: DeveloperOption[];
  amenityOptions?: string[];
}

export function MobileFilterSheet({
  open,
  filters,
  onChange,
  onClose,
  developerOptions = [],
  amenityOptions = [],
}: MobileFilterSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-surface-darker/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        data-testid="mobile-filter-sheet"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-elevation-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-dark">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-muted hover:text-text-dark"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-text-dark">
            Search
            <input
              type="search"
              placeholder="Search by project, area, developer..."
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              className="focus-ring mt-1 w-full rounded-full border border-border px-4 py-2.5 text-sm outline-none"
            />
          </label>

          <label className="block text-sm font-semibold text-text-dark">
            Property type
            <select
              value={filters.propertyType}
              onChange={(e) =>
                onChange({
                  ...filters,
                  propertyType: e.target.value as Filters["propertyType"],
                })
              }
              className="focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">All types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-text-dark">
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
              className="focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
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

          <label className="block text-sm font-semibold text-text-dark">
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
              className="focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">Any</option>
              <option value="1500000">Up to 1.5M</option>
              <option value="2500000">Up to 2.5M</option>
              <option value="4000000">Up to 4M</option>
            </select>
          </label>

          <MoreFiltersPanel
            filters={filters}
            onChange={onChange}
            developerOptions={developerOptions}
            amenityOptions={amenityOptions}
            variant="sheet"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="iop-btn-press mt-6 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Show results
        </button>
      </div>
    </div>
  );
}