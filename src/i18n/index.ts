import { en, type Dict } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import type { Locale } from "./config";

export type { Dict } from "./dictionaries/en";
export {
  localePath,
  localeFromPathname,
  pathIsArabic,
  interpolate,
  DEFAULT_LOCALE,
  LOCALES,
} from "./config";
export type { Locale } from "./config";

const DICTIONARIES: Record<Locale, Dict> = { en, ar };

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? en;
}
