"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

/**
 * EN ↔ AR switch that PRESERVES the user's location — the AR tree mirrors the
 * full route table (hubs + slug routes + tools), so switching language keeps
 * you on the same page instead of dumping you on the Arabic homepage.
 * Anything without an AR mirror falls back to /ar.
 */
const AR_MIRRORED = [
  /^\/$/,
  /^\/about$/,
  /^\/contact$/,
  /^\/projects(\/|$)/,
  /^\/communities(\/|$)/,
  /^\/areas(\/|$)/,
  /^\/developers(\/|$)/,
  /^\/locations(\/|$)/,
  /^\/guides(\/|$)/,
  /^\/news(\/|$)/,
  /^\/faq(\/|$)/,
  /^\/compare(\/|$)/,
  /^\/compare-projects\/./,
  /^\/compare-developers\/./,
  /^\/map$/,
  /^\/market-report$/,
  /^\/market-data$/,
  /^\/collections\/./,
  /^\/favorites$/,
  /^\/account(\/|$)/,
  /^\/cookie-policy$/,
  /^\/privacy-policy$/,
  /^\/tools(\/|$)/,
];

export function LanguageSwitcher({ solid = true }: { solid?: boolean }) {
  const { locale } = useI18n();
  const pathname = usePathname();

  const basePath = locale === "ar" ? pathname.replace(/^\/ar/, "") || "/" : pathname;
  const target =
    locale === "ar"
      ? basePath
      : AR_MIRRORED.some((re) => re.test(basePath))
        ? basePath === "/"
          ? "/ar"
          : `/ar${basePath}`
        : "/ar";

  return (
    <Link
      href={target}
      hrefLang={locale === "ar" ? "en" : "ar"}
      className={cn(
        "focus-ring iop-btn-press rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        solid
          ? "border-border text-muted hover:border-brand hover:text-brand"
          : "border-white/30 text-white/90 hover:border-white hover:bg-white/10",
      )}
    >
      {locale === "ar" ? "English" : "العربية"}
    </Link>
  );
}
