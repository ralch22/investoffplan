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
      languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: url },
    },
  };
}

/**
 * Reciprocal alternates for an EN canonical route that has an /ar mirror.
 * Pass the EN path (leading slash, no /ar, no trailing slash), e.g. "/developers"
 * or `/developers/${slug}`. Produces canonical=EN + en/ar hreflang so Google
 * treats the EN⇄AR pair as reciprocal.
 */
export function enMeta(path: string): NonNullable<import("next").Metadata["alternates"]> {
  const base = getSiteUrl();
  return {
    canonical: `${base}${path}`,
    languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
}
