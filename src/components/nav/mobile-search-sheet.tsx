"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchSuggest } from "@/components/search/search-suggest";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

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

  const chips = useMemo(
    () => [
      { label: dict.home.quickFilters.apartments, href: "/projects?type=apartment" },
      { label: dict.home.quickFilters.villas, href: "/projects?type=villa" },
      { label: dict.home.quickFilters.emaar, href: "/developers/emaar-properties" },
      { label: dict.home.quickFilters.jvc, href: "/communities/jumeirah-village-circle" },
      { label: dict.home.quickFilters.under1m, href: "/projects?maxP=1000000" },
    ],
    [dict],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const go = (href: string) => {
    onClose();
    trackEvent(ANALYTICS_EVENTS.SEARCH_SUBMIT, {
      query_length: 0,
      source: "sheet",
    });
    router.push(localePath(locale, href));
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
            {chips.map((c) => (
              <button
                key={c.href}
                type="button"
                onClick={() => go(c.href)}
                className="iop-btn-press focus-ring rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
