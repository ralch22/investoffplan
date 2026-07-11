"use client";

import { useEffect, useRef, useState } from "react";
import { SearchSuggest } from "@/components/search/search-suggest";
import { useI18n } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" />
    </svg>
  );
}

/**
 * Desktop header search (lg+): an icon button that opens a dropdown panel
 * hosting the SearchSuggest typeahead (absolute — doesn't fight the crowded
 * header flex row). Mobile uses the bottom tab bar's search sheet. The
 * input's aria-label is "Search the catalog" (not "…developers…") to avoid a
 * getByLabel('Developer') substring collision with the SERP filter.
 * Escape propagates from the typeahead input so it closes this dropdown too.
 */
export function HeaderSearch({ solid }: { solid: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { dict } = useI18n();

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.nav.searchOpen}
        aria-expanded={open}
        className={cn(
          "focus-ring iop-btn-press flex h-10 w-10 items-center justify-center rounded-full border transition",
          solid
            ? "border-border text-muted hover:border-brand hover:text-brand"
            : "border-white/30 text-white/90 hover:border-white hover:bg-white/10",
        )}
      >
        <SearchIcon />
      </button>

      {open ? (
        <div
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="reveal absolute end-0 top-full z-[var(--z-header)] mt-2 w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-2 shadow-elevation-lg"
        >
          <SearchSuggest variant="header" autoFocus onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
