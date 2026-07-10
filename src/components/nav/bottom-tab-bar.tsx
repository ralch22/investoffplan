"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LocaleLink } from "@/components/locale-link";
import { MobileSearchSheet } from "@/components/nav/mobile-search-sheet";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { cn } from "@/lib/cn";

type IconProps = { className?: string };

function ExploreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" />
    </svg>
  );
}
function CommunitiesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="9" width="7" height="11" rx="1" /><rect x="13" y="4" width="8" height="16" rx="1" /><path d="M16 8h2M16 12h2M16 16h2M6 13h1" />
    </svg>
  );
}
function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
    </svg>
  );
}
function CompareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v18" /><path d="M7 8 4 11l3 3" /><path d="m17 8 3 3-3 3" /><path d="M4 11h5M15 11h5" />
    </svg>
  );
}
function SavedIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20.5s-7-4.3-9.2-8.4C1.3 9.3 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 4.7 3.8 3.2 6.6C19 16.2 12 20.5 12 20.5z" />
    </svg>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  const { locale, dict } = useI18n();
  const favoritesCount = useFavoritesCount();
  const [searchOpen, setSearchOpen] = useState(false);

  const t = dict.nav.tabs;
  const active = (href: string) => {
    const lp = localePath(locale, href);
    return pathname === lp || pathname.startsWith(`${lp}/`);
  };

  const tabCls = (isActive: boolean) =>
    cn(
      "iop-btn-press focus-ring relative flex flex-1 flex-col items-center justify-center gap-1 pt-1.5 text-[10px] font-medium transition",
      isActive ? "text-brand" : "text-muted-light hover:text-text-dark",
    );
  const iconCls = "h-[22px] w-[22px]";

  return (
    <>
      <nav
        aria-label={t.aria}
        className="fixed inset-x-0 bottom-0 z-[var(--z-bottom-bar)] h-[var(--bottom-bar-h)] border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-[3.75rem] max-w-md items-stretch">
          <LocaleLink href="/projects" aria-current={active("/projects") ? "page" : undefined} className={tabCls(active("/projects"))}>
            <ExploreIcon className={iconCls} />
            {t.explore}
          </LocaleLink>
          <LocaleLink href="/communities" aria-current={active("/communities") ? "page" : undefined} className={tabCls(active("/communities"))}>
            <CommunitiesIcon className={iconCls} />
            {t.communities}
          </LocaleLink>
          <button type="button" onClick={() => setSearchOpen(true)} className={tabCls(false)} aria-haspopup="dialog">
            <SearchIcon className={iconCls} />
            {t.search}
          </button>
          <LocaleLink href="/compare" aria-current={active("/compare") ? "page" : undefined} className={tabCls(active("/compare"))}>
            <CompareIcon className={iconCls} />
            {t.compare}
          </LocaleLink>
          <LocaleLink href="/favorites" aria-current={active("/favorites") ? "page" : undefined} className={tabCls(active("/favorites"))}>
            <span className="relative">
              <SavedIcon className={iconCls} />
              {favoritesCount > 0 ? (
                <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white" aria-hidden>
                  {favoritesCount}
                </span>
              ) : null}
            </span>
            {t.saved}
          </LocaleLink>
        </div>
      </nav>
      <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
