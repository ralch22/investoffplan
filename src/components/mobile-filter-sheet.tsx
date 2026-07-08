"use client";

import { useEffect, useRef } from "react";
import type { ProjectFilters as Filters } from "@/lib/types";
import {
  MoreFiltersPanel,
  type DeveloperOption,
} from "@/components/more-filters-panel";
import { useI18n } from "@/i18n/locale-provider";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (a11y audit O2).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const { dict } = useI18n();
  const f = dict.serp.filters;

  return (
    <dialog
      ref={dialogRef}
      aria-label={f.title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm md:hidden"
    >
      {open ? (
        <div
          data-testid="mobile-filter-sheet"
          className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-elevation-lg"
        >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-dark">{f.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-muted hover:text-text-dark"
          >
            {f.close}
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-text-dark">
            {f.search}
            <input
              type="search"
              placeholder={f.searchPlaceholderMobile}
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              className="focus-ring mt-1 w-full rounded-full border border-border px-4 py-2.5 text-sm outline-none"
            />
          </label>

          <label className="block text-sm font-semibold text-text-dark">
            {f.propertyType}
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
              <option value="all">{f.allTypes}</option>
              <option value="apartment">{f.apartment}</option>
              <option value="villa">{f.villa}</option>
              <option value="townhouse">{f.townhouse}</option>
              <option value="penthouse">{f.penthouse}</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-text-dark">
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
              className="focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
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

          <label className="block text-sm font-semibold text-text-dark">
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
              className="focus-ring mt-1 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">{f.any}</option>
              <option value="1500000">{f.upTo15m}</option>
              <option value="2500000">{f.upTo25m}</option>
              <option value="4000000">{f.upTo4m}</option>
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
            {f.showResults}
          </button>
        </div>
      ) : null}
    </dialog>
  );
}