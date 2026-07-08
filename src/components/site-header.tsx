"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CurrencySelector } from "@/components/currency-selector";
import { MobileNav } from "@/components/mobile-nav";
import { PrimaryButton } from "@/components/ui/primary-button";
import type { CurrencyCode } from "@/lib/types";
import { BrandLogo } from "@/components/brand-logo";
import { useFavoritesCount } from "@/hooks/use-favorites-count";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_KEYS = [
  { href: "/projects", key: "projects" },
  { href: "/tools", key: "dataToolkit" },
  { href: "/developers", key: "developers" },
  { href: "/areas", key: "areas" },
  { href: "/guides", key: "guides" },
  { href: "/news", key: "news" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

interface SiteHeaderProps {
  currency: CurrencyCode;
  onCurrencyChange?: (value: CurrencyCode) => void;
  variant?: "light" | "transparent";
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  currency,
  onCurrencyChange,
  variant = "light",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { locale, dict } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const favoritesCount = useFavoritesCount();
  const isTransparent = variant === "transparent";
  const showSolidHeader = !isTransparent || scrolled;

  useEffect(() => {
    if (!isTransparent) return;

    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isTransparent]);

  return (
    <>
      <header
        className={cn(
          "inset-x-0 top-0 z-[var(--z-header)] transition-[background-color,box-shadow,border-color] duration-300",
          isTransparent ? "absolute" : "sticky",
          showSolidHeader
            ? "border-b border-border/80 bg-surface/95 shadow-elevation-sm backdrop-blur-xl"
            : isTransparent
              ? "border-b border-transparent bg-transparent"
              : "",
        )}
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-5 py-3 md:px-8">
          <Link
            href={localePath(locale, "/")}
            className="focus-ring flex shrink-0 items-center rounded-sm"
          >
            <BrandLogo
              variant={showSolidHeader ? "horizontal-dark" : "horizontal-white"}
              className="h-8 w-auto sm:h-9"
            />
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label={dict.nav.mainNavAria}
          >
            {NAV_KEYS.map((item) => {
              const href = localePath(locale, item.href);
              const active = isActive(pathname, href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "focus-ring rounded-lg px-3 py-2 text-sm font-medium transition",
                    !showSolidHeader
                      ? active
                        ? "bg-white/15 text-white"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                      : active
                        ? "bg-brand-muted text-brand-dark"
                        : "text-muted hover:bg-surface-alt hover:text-text-dark",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {dict.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href={localePath(locale, "/favorites")}
              aria-label={
                favoritesCount > 0
                  ? interpolate(dict.nav.favoritesWithCount, { count: favoritesCount })
                  : dict.nav.favorites
              }
              className={cn(
                "relative rounded-full border transition focus-ring iop-btn-press",
                "inline-flex h-10 w-10 items-center justify-center sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:text-xs sm:font-semibold",
                !showSolidHeader
                  ? "border-white/30 text-white/90 hover:border-white hover:bg-white/10"
                  : "border-border text-muted hover:border-brand hover:text-brand",
              )}
            >
              <span className="sm:hidden" aria-hidden>
                ★
              </span>
              <span className="hidden sm:inline">{dict.nav.favorites}</span>
              {favoritesCount > 0 ? (
                <span
                  className={cn(
                    "absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                    !showSolidHeader ? "bg-white text-brand" : "bg-brand",
                  )}
                >
                  {favoritesCount}
                </span>
              ) : null}
            </Link>
            <PrimaryButton
              href={localePath(locale, "/areas")}
              className="hidden px-4 py-2 text-xs sm:inline-flex"
            >
              {dict.nav.areaProperties}
            </PrimaryButton>
            <LanguageSwitcher solid={showSolidHeader} />
            {onCurrencyChange ? (
              <CurrencySelector value={currency} onChange={onCurrencyChange} />
            ) : (
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">
                {currency}
              </span>
            )}
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
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}