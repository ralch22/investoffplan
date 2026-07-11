"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchSuggest } from "@/components/search/search-suggest";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

const CHIPS = ["Apartments", "Villas", "Emaar", "JVC", "Under AED 1M"];

/**
 * Bottom-sheet search opened from the mobile tab bar. The SearchSuggest
 * typeahead renders its suggestions inline under the input (inside the
 * dialog — the sheet body scrolls, no nested popover); plain submits keep
 * routing to /projects?q=.
 */
export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { locale, dict } = useI18n();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const go = (term: string) => {
    onClose();
    const query = term.trim();
    trackEvent(ANALYTICS_EVENTS.SEARCH_SUBMIT, {
      query_length: query.length,
      source: "sheet",
    });
    router.push(
      localePath(locale, query ? `/projects?q=${encodeURIComponent(query)}` : "/projects"),
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-[var(--z-modal)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm lg:hidden"
    >
      {open ? (
        <div className="drawer-up absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-elevation-lg">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden />
          <SearchSuggest
            variant="sheet"
            autoFocus
            placeholder={dict.nav.searchPlaceholder}
            onNavigate={onClose}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => go(c)}
                className="iop-btn-press focus-ring rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
