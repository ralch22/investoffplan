"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { CurrencySelector } from "@/components/currency-selector";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchSuggest } from "@/components/search/search-suggest";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";

type NavKey =
  | "projects" | "dataToolkit" | "developers" | "areas" | "marketData"
  | "locations" | "map" | "guides" | "news" | "favorites" | "about" | "contact" | "faq";

interface NavGroup {
  labelKey: "browse" | "tools" | "insights" | "more";
  items: { href: string; key: NavKey }[];
}

// Grouped IA mirroring the desktop mega menu (was a flat 12-item list).
const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "browse",
    items: [
      { href: "/projects", key: "projects" },
      { href: "/communities", key: "areas" },
      { href: "/developers", key: "developers" },
      { href: "/locations", key: "locations" },
      { href: "/map", key: "map" },
    ],
  },
  {
    labelKey: "tools",
    items: [
      { href: "/tools", key: "dataToolkit" },
      { href: "/compare", key: "marketData" },
    ],
  },
  {
    labelKey: "insights",
    items: [
      { href: "/guides", key: "guides" },
      { href: "/news", key: "news" },
      { href: "/faq", key: "faq" },
    ],
  },
  {
    labelKey: "more",
    items: [
      { href: "/favorites", key: "favorites" },
      { href: "/about", key: "about" },
      { href: "/contact", key: "contact" },
    ],
  },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (value: CurrencyCode) => void;
}

export function MobileNav({ open, onClose, currency, onCurrencyChange }: MobileNavProps) {
  const pathname = usePathname();
  const favoritesCount = useFavoritesCount();
  const { locale, dict } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (a11y audit O1).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-[var(--z-overlay)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm lg:hidden"
    >
      {open ? (
        <nav className="drawer-in absolute end-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-surface shadow-elevation-lg">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <BrandLogo variant="horizontal-dark" className="h-7 w-auto" />
            <button
              type="button"
              onClick={onClose}
              className="iop-btn-press focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted"
              aria-label={dict.nav.closeNavigation}
            >
              ✕
            </button>
          </div>

          <div className="border-b border-border px-5 py-3">
            <SearchSuggest variant="drawer" onNavigate={onClose} />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.labelKey} className="mb-4">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-light">
                  {dict.nav.groups[group.labelKey]}
                </p>
                <ul>
                  {group.items.map((item) => {
                    const href = localePath(locale, item.href);
                    const active =
                      href === "/"
                        ? pathname === "/"
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={item.href}>
                        <Link
                          href={href}
                          onClick={onClose}
                          className={cn(
                            "iop-btn-press focus-ring block rounded-xl px-4 py-2.5 text-sm font-medium transition",
                            active
                              ? "bg-brand-muted text-brand-dark"
                              : "text-muted hover:bg-surface-alt hover:text-text-dark",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            {dict.nav[item.key]}
                            {item.href === "/favorites" && favoritesCount > 0 ? (
                              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                                {favoritesCount}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <LanguageSwitcher solid />
              {currency && onCurrencyChange ? (
                <CurrencySelector value={currency} onChange={onCurrencyChange} />
              ) : null}
            </div>
            <Link
              href={localePath(locale, "/projects")}
              onClick={onClose}
              className="iop-btn-press focus-ring flex w-full items-center justify-center rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {dict.nav.browseProperties}
            </Link>
          </div>
        </nav>
      ) : null}
    </dialog>
  );
}
