"use client";

import { useRouter } from "next/navigation";
import { SearchSuggest } from "@/components/search/search-suggest";
import { cn } from "@/lib/cn";
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

  return (
    <div className={cn("w-full max-w-3xl", className)}>
      <SearchSuggest variant="hero" placeholder={placeholder} searchLabel={searchLabel} />
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
