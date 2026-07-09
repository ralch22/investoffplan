"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/i18n/config";
import { useI18n } from "@/i18n/locale-provider";

/**
 * Locale-aware <Link>: prefixes internal hrefs with /ar when rendered inside
 * the AR tree (LocaleProvider), passes them through untouched on EN (the
 * context default). Drop-in replacement for next/link in components shared by
 * both locales — hardcoded hrefs were bouncing Arabic users onto EN routes.
 * External URLs, anchors, and already-prefixed /ar paths are left alone.
 */
export function LocaleLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const { locale } = useI18n();
  const localized =
    typeof href === "string" && href.startsWith("/") && !href.startsWith("/ar")
      ? localePath(locale, href)
      : href;
  return <Link href={localized} {...rest} />;
}
