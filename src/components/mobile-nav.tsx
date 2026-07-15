"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { useSession } from "@/lib/auth/client";
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
  | "projects" | "dataToolkit" | "developers" | "areas" | "marketData" | "marketReport"
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
      { href: "/market-report", key: "marketReport" },
      { href: "/guides", key: "guides" },
      { href: "/news", key: "news" },
      { href: "/faq", key: "faq" },
    ],
  },
  {
    labelKey: "more",
    items: [
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

  // Escape fires native `cancel`; sync to React so the open-effect doesn't re-open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      id="mobile-nav-dialog"
      aria-label={dict.a11y.mobileNav}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-[var(--z-overlay)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm lg:hidden"
    >
      {open ? (
        <nav
          aria-label={dict.a11y.mobileNav}
          className="drawer-in absolute end-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-surface shadow-elevation-lg"
        >
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

          <MobileAccountSection onClose={onClose} favoritesCount={favoritesCount} />

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
                          {dict.nav[item.key]}
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

// Prominent account section at the TOP of the drawer (login-consolidated).
// Signed-in: greeting + Account / Favorites / Saved-searches. Signed-out: a
// clear Sign-in CTA + benefit line + Favorites (localStorage works signed-out).
// Session resolves client-side only (useSession) so the drawer stays static-safe.
function MobileAccountSection({
  onClose,
  favoritesCount,
}: {
  onClose: () => void;
  favoritesCount: number;
}) {
  const { locale, dict } = useI18n();
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const rowClass =
    "iop-btn-press focus-ring flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-alt hover:text-text-dark";

  const favoritesRow = (
    <Link href={localePath(locale, "/favorites")} onClick={onClose} className={rowClass}>
      {dict.auth.favorites}
      {favoritesCount > 0 ? (
        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
          {favoritesCount}
        </span>
      ) : null}
    </Link>
  );

  if (session?.user) {
    const initial = (session.user.name || session.user.email || "?")
      .trim()
      .charAt(0)
      .toUpperCase();
    return (
      <div className="border-b border-border px-3 py-3">
        <div className="mb-1 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand-dark">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-text-dark">
              {session.user.name || dict.auth.myAccount}
            </span>
            <span className="block truncate text-xs text-muted">{session.user.email}</span>
          </span>
        </div>
        <Link href={localePath(locale, "/account")} onClick={onClose} className={rowClass}>
          {dict.auth.account}
        </Link>
        {favoritesRow}
        <Link
          href={localePath(locale, "/account#saved-searches")}
          onClick={onClose}
          className={rowClass}
        >
          {dict.account.savedSearches.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-3 py-3">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="iop-btn-press focus-ring flex w-full items-center justify-center rounded-full border border-brand py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
      >
        {dict.auth.signIn}
      </button>
      <p className="px-1 pt-2 text-xs leading-relaxed text-muted-light">
        {dict.auth.signInBenefit}
      </p>
      {favoritesRow}
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
