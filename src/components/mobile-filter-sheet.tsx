"use client";

import { useEffect, useRef } from "react";
import type { ProjectFilters as Filters } from "@/lib/types";
import {
  MoreFiltersPanel,
  type DeveloperOption,
} from "@/components/more-filters-panel";
import { SaveSearchButton } from "@/components/save-search-button";
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
  const { dict } = useI18n();
  const f = dict.serp.filters;
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Filters as they were when the sheet opened. Edits inside the sheet apply
  // live (nice preview behind the backdrop), but Close/Escape/backdrop must
  // DISCARD them — only "Show results" commits.
  const snapshotRef = useRef<Filters | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (a11y audit O2). showModal makes the page inert but does NOT stop
  // scroll chaining — lock body scroll while open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      snapshotRef.current = filters;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot only on the closed→open transition
  }, [open]);

  const cancel = () => {
    if (snapshotRef.current) onChangeRef.current(snapshotRef.current);
    onClose();
  };

  // Escape fires native `cancel`; sync to React so the open-effect doesn't re-open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (snapshotRef.current) onChangeRef.current(snapshotRef.current);
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="mobile-filter-sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) cancel();
      }}
      className="fixed inset-0 z-[var(--z-overlay)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm md:hidden"
    >
      {open ? (
        <div
          data-testid="mobile-filter-sheet"
          className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-elevation-lg"
        >
          {/* Drag handle pill */}
          <div className="flex w-full items-center justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-border-strong" />
          </div>

          {/* Header — stays put while filters scroll. */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-4">
            <h2
              id="mobile-filter-sheet-title"
              className="text-lg font-semibold text-text-dark"
            >
              {f.title}
            </h2>
            <button
              type="button"
              onClick={cancel}
              aria-label={f.closeFilters}
              className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-muted hover:text-text-dark"
            >
              {f.close}
            </button>
          </div>

          {/* Scrollable filter body — primary CTA is sticky below, not in this stream. */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <label className="block text-sm font-semibold text-text-dark">
              {f.search}
              <input
                type="search"
                placeholder={f.searchPlaceholderMobile}
                value={filters.query}
                onChange={(e) => onChange({ ...filters, query: e.target.value })}
                className="focus-ring mt-1 w-full rounded-full border border-[var(--input-border)] px-4 py-2.5 text-sm outline-none"
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
                className="focus-ring mt-1 w-full rounded-full border border-[var(--input-border)] bg-white px-4 py-2.5 text-sm outline-none"
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
                className="focus-ring mt-1 w-full rounded-full border border-[var(--input-border)] bg-white px-4 py-2.5 text-sm outline-none"
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
                className="focus-ring mt-1 w-full rounded-full border border-[var(--input-border)] bg-white px-4 py-2.5 text-sm outline-none"
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

            <SaveSearchButton filters={filters} />
          </div>

          {/* Sticky primary CTA — always in viewport; safe-area for home indicator. */}
          <div className="shrink-0 border-t border-border bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              data-testid="mobile-filter-show-results"
              onClick={onClose}
              className="iop-btn-press w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {f.showResults}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
