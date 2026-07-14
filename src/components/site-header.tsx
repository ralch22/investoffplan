"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CurrencySelector } from "@/components/currency-selector";
import { MobileNav } from "@/components/mobile-nav";
import type { CurrencyCode } from "@/lib/types";
import { BrandLogo } from "@/components/brand-logo";
import { SiteNav } from "@/components/nav/site-nav";
import { HeaderSearch } from "@/components/nav/header-search";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface SiteHeaderProps {
  currency: CurrencyCode;
  onCurrencyChange?: (value: CurrencyCode) => void;
  variant?: "light" | "transparent";
}

export function SiteHeader({
  currency,
  onCurrencyChange,
  variant = "light",
}: SiteHeaderProps) {
  const { locale, dict } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const favoritesCount = useFavoritesCount();
  const scrollDir = useScrollDirection();
  const isTransparent = variant === "transparent";
  // An open mega panel forces the header solid so panel + header read as one.
  const showSolidHeader = !isTransparent || scrolled || megaOpen;
  // Hide on scroll down past the header height to save screen real estate on mobile
  const hideHeader = scrollDir === "down" && scrolled && !megaOpen && !mobileOpen;

  useEffect(() => {
    if (!isTransparent) return;

    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isTransparent]);

  useEffect(() => {
    if (hideHeader) {
      document.body.classList.add("header-hidden");
    } else {
      document.body.classList.remove("header-hidden");
    }
    return () => {
      document.body.classList.remove("header-hidden");
    };
  }, [hideHeader]);

  return (
    <>
      <header
        className={cn(
          "inset-x-0 top-0 z-[var(--z-header)] transition-all duration-300",
          // always fixed so it doesn't leave a layout gap when translated away
          "fixed",
          hideHeader ? "max-lg:-translate-y-full" : "max-lg:translate-y-0",
          showSolidHeader
            ? "border-b border-border/80 bg-surface/95 shadow-elevation-sm backdrop-blur-xl"
            : isTransparent
              ? "border-b border-transparent bg-transparent"
              : "",
        )}
      >
        <div className="mx-auto flex h-[var(--header-h)] max-w-[1200px] items-center gap-3 px-5 md:px-8">
          <Link
            href={localePath(locale, "/")}
            className="focus-ring flex shrink-0 items-center rounded-sm"
          >
            <BrandLogo
              variant={showSolidHeader ? "horizontal-dark" : "horizontal-white"}
              className="h-8 w-auto sm:h-9"
            />
          </Link>

          <SiteNav solid={showSolidHeader} onOpenChange={setMegaOpen} />

          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <HeaderSearch solid={showSolidHeader} />
            {/* Favorites — compact heart icon (count badge). Works signed-out
                via localStorage; also listed in the account menu when signed in. */}
            <Link
              href={localePath(locale, "/favorites")}
              aria-label={
                favoritesCount > 0
                  ? interpolate(dict.nav.favoritesWithCount, { count: favoritesCount })
                  : dict.nav.favorites
              }
              className={cn(
                "iop-btn-press focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                !showSolidHeader
                  ? "border-white/30 text-white/90 hover:border-white hover:bg-white/10"
                  : "border-border text-muted hover:border-brand hover:text-brand",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 20.5s-7-4.3-9.2-8.4C1.3 9.3 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 4.7 3.8 3.2 6.6C19 16.2 12 20.5 12 20.5z" />
              </svg>
              {favoritesCount > 0 ? (
                <span
                  className={cn(
                    "absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    !showSolidHeader ? "bg-white text-brand" : "bg-brand text-white",
                  )}
                >
                  {favoritesCount}
                </span>
              ) : null}
            </Link>
            {/* Language + currency + account live in the MobileNav drawer on
                phones — hide them here so the hamburger stays on-screen (the
                cluster otherwise overflows ~91px past a 375px viewport, pushing
                the only route to the full nav off the edge). */}
            <span className="hidden sm:inline-flex">
              <LanguageSwitcher solid={showSolidHeader} />
            </span>
            <span className="hidden sm:block">
              <UserMenu solid={showSolidHeader} />
            </span>
            <span className="hidden sm:block">
              {onCurrencyChange ? (
                <CurrencySelector value={currency} onChange={onCurrencyChange} />
              ) : (
                <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">
                  {currency}
                </span>
              )}
            </span>
            <button
              type="button"
              className={cn(
                "iop-btn-press focus-ring flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden",
                !showSolidHeader
                  ? "border-white/30 text-white"
                  : "border-border text-text-dark",
              )}
              aria-label={dict.nav.openMenu}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currency={currency}
        onCurrencyChange={onCurrencyChange}
      />
    </>
  );
}