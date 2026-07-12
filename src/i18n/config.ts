export type Locale = "en" | "ar";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "ar"];

/** True when a path is under the Arabic tree (`/ar` or `/ar/...`). */
export function pathIsArabic(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  let path = pathname.trim();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    // keep raw
  }
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  return path === "/ar" || path.startsWith("/ar/");
}

/** Locale for a pathname — AR when under `/ar`, else EN. */
export function localeFromPathname(pathname: string | null | undefined): Locale {
  return pathIsArabic(pathname) ? "ar" : "en";
}

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
