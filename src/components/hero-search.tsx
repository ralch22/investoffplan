"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { localePath, type Locale } from "@/i18n/config";

interface QuickFilter {
  label: string;
  href: string;
}

const DEFAULT_QUICK_FILTERS: readonly QuickFilter[] = [
  { label: "Apartments", href: "/projects?type=apartment" },
  { label: "Villas", href: "/projects?type=villa" },
  { label: "Emaar", href: "/developers/emaar-properties" },
  { label: "JVC", href: "/communities/jumeirah-village-circle" },
  { label: "Under AED 1M", href: "/projects?maxP=1000000" },
];

interface HeroSearchProps {
  className?: string;
  /** Drives route localization — "ar" routes go to /ar/*. */
  locale?: Locale;
  placeholder?: string;
  searchLabel?: string;
  popularLabel?: string;
  quickFilters?: readonly QuickFilter[];
}

export function HeroSearch({
  className,
  locale = "en",
  placeholder = "Search by project, developer, or area",
  searchLabel = "Search",
  popularLabel = "Popular:",
  quickFilters = DEFAULT_QUICK_FILTERS,
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString() ? `?${params}` : "";
    trackEvent(ANALYTICS_EVENTS.SEARCH_SUBMIT, {
      query_length: query.trim().length,
      source: "hero",
    });
    router.push(localePath(locale, `/projects${qs}`));
  }

  return (
    <div className={cn("w-full max-w-3xl", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-elevation-lg backdrop-blur-md sm:flex-row sm:items-center"
      >
        <div className="relative flex flex-1 items-center">
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute start-3 h-5 w-5 text-muted-light"
            aria-hidden
          >
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="iop-input h-12 flex-1 border-0 bg-transparent ps-10 shadow-none focus:shadow-none"
            aria-label={placeholder}
          />
        </div>
        <button
          type="submit"
          className="iop-btn-press focus-ring h-12 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {searchLabel}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-white/70">{popularLabel}</span>
        {quickFilters.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => router.push(localePath(locale, chip.href))}
            className="iop-btn-press focus-ring rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
