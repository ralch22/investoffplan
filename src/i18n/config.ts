export type Locale = "en" | "ar";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "ar"];

/** Prefix an internal href for the given locale (EN stays unprefixed). */
export function localePath(locale: Locale, href: string): string {
  if (locale === "en") return href;
  if (!href.startsWith("/")) return href;
  return href === "/" ? "/ar" : `/ar${href}`;
}

/** Simple {token} interpolation for dictionary strings. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
