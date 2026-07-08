"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

/**
 * EN ↔ AR switch. Only chrome + marketing pages exist in the AR tree, so
 * switching to Arabic from an EN-only route lands on the AR homepage.
 */
const AR_ROUTES = new Set(["/", "/about", "/contact", "/guides", "/faq"]);

export function LanguageSwitcher({ solid = true }: { solid?: boolean }) {
  const { locale } = useI18n();
  const pathname = usePathname();

  const basePath = locale === "ar" ? pathname.replace(/^\/ar/, "") || "/" : pathname;
  const target =
    locale === "ar"
      ? basePath
      : AR_ROUTES.has(basePath)
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
