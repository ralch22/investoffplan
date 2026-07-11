import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * DRY metadata builder for AR mirror routes: localized Arabic title/description
 * plus canonical → /ar/<path> and en/ar hreflang alternates. Keeps the many AR
 * re-export pages from repeating the same alternates boilerplate.
 */
export function arMeta({
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  path: string;
  title?: string;
  description?: string;
  /** Skip the "%s | invest off-plan" layout template for pre-branded titles. */
  absoluteTitle?: boolean;
}): Metadata {
  const base = getSiteUrl();
  const url = `${base}/ar${path}`;
  return {
    ...(title ? { title: absoluteTitle ? { absolute: title } : title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: url,
      languages: { en: `${base}${path}`, ar: url },
    },
  };
}
