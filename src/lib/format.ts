import type { CurrencyCode } from "./types";
import type { Dict } from "@/i18n";
import { interpolate } from "@/i18n/config";

const AED_TO_USD = 0.272;

export function formatPrice(
  amountAed: number,
  currency: CurrencyCode,
  opts?: { compact?: boolean },
): string {
  const value = currency === "USD" ? amountAed * AED_TO_USD : amountAed;
  const code = currency;

  if (opts?.compact && value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${rounded}M ${code}`;
  }

  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPriceRange(
  minAed: number,
  maxAed: number | undefined,
  currency: CurrencyCode,
): string {
  if (maxAed && maxAed > minAed) {
    return `${formatPrice(minAed, currency, { compact: true })} - ${formatPrice(maxAed, currency, { compact: true })}`;
  }
  return formatPrice(minAed, currency, { compact: true });
}

export function formatBeds(beds: number): string {
  if (beds === 0) return "Studio";
  return beds === 1 ? "1 Bed" : `${beds} Beds`;
}

/**
 * Locale-aware bedroom label. EN output is byte-identical to {@link formatBeds}
 * ("Studio" / "1 Bed" / "N Beds"); AR reads natural plurals from the dictionary.
 * Use this at any call site that has a `dict` (surfaces reachable under /ar).
 */
export function bedsLabel(beds: number, dict: Dict): string {
  if (beds === 0) return dict.format.beds.studio;
  if (beds === 1) return dict.format.beds.one;
  return interpolate(dict.format.beds.many, { count: beds });
}

/** Bed-key label for DLD/report tables ("0" → studio, "4" → 4+ bed, else N bed). */
export function bedKeyLabel(key: string, dict: Dict): string {
  if (key === "0") return dict.format.beds.studio;
  if (key === "4") return dict.format.beds.fourPlus;
  return interpolate(dict.format.beds.nShort, { count: key });
}

/**
 * Locale-aware property-type noun ("apartment"/"villa"/"townhouse"/"penthouse").
 * EN returns the raw catalog value unchanged (byte-identical to prior render);
 * AR maps to the localized noun from `serp.filters`. Unknown types pass through.
 */
export function propertyTypeLabel(
  propertyType: string,
  dict: Dict,
  locale: string,
): string {
  if (locale !== "ar") return propertyType;
  const key = propertyType.toLowerCase();
  const names: Record<string, string> = {
    apartment: dict.serp.filters.apartment,
    villa: dict.serp.filters.villa,
    townhouse: dict.serp.filters.townhouse,
    penthouse: dict.serp.filters.penthouse,
  };
  return names[key] ?? propertyType;
}

/** DLD sample-size confidence tier label (#371). EN matches raw enum values. */
export function dldConfidenceLabel(
  confidence: "high" | "medium" | "low" | "none" | string,
  dict: Dict,
): string {
  switch (confidence) {
    case "high":
      return dict.dld.confidenceHigh;
    case "medium":
      return dict.dld.confidenceMedium;
    case "low":
      return dict.dld.confidenceLow;
    case "none":
      return dict.dld.confidenceNone;
    default:
      return confidence;
  }
}

export function formatLaunchPrice(
  minAed: number,
  maxAed: number | undefined,
  currency: CurrencyCode,
): string {
  // 0 = no PF-stated price (verified-claims: never invent one, never show
  // "AED 0"). Mirrors the formatSqft "—" guard and the PDP fromPriceLabel.
  if (!(minAed > 0)) return "Price on request";
  if (maxAed && maxAed > minAed) {
    return `${formatPrice(minAed, currency, { compact: true })} - ${formatPrice(maxAed, currency, { compact: true })}`;
  }
  return formatPrice(minAed, currency);
}

/**
 * Locale-aware launch price. EN matches {@link formatLaunchPrice}; AR uses
 * `dict.pdp.priceOnRequest` for the zero-price sentinel (#324).
 */
export function launchPriceLabel(
  minAed: number,
  maxAed: number | undefined,
  currency: CurrencyCode,
  dict: Dict,
): string {
  if (!(minAed > 0)) return dict.pdp.priceOnRequest;
  if (maxAed && maxAed > minAed) {
    return `${formatPrice(minAed, currency, { compact: true })} - ${formatPrice(maxAed, currency, { compact: true })}`;
  }
  return formatPrice(minAed, currency);
}

export function formatFromPrice(
  minAed: number,
  maxAed: number | undefined,
  currency: CurrencyCode,
): string {
  if (!(minAed > 0)) return "Price on request";
  if (maxAed && maxAed > minAed) {
    return `FROM ${formatPrice(minAed, currency, { compact: true })} - ${formatPrice(maxAed, currency, { compact: true })}`;
  }
  return `FROM ${formatPrice(minAed, currency)}`;
}

/**
 * Locale-aware "FROM {price}" chrome. EN is byte-identical to
 * {@link formatFromPrice}; AR uses `dict.format.fromUpper` +
 * `dict.pdp.priceOnRequest` (#324).
 */
export function fromPriceLabel(
  minAed: number,
  maxAed: number | undefined,
  currency: CurrencyCode,
  dict: Dict,
): string {
  if (!(minAed > 0)) return dict.pdp.priceOnRequest;
  const prefix = dict.format.fromUpper;
  if (maxAed && maxAed > minAed) {
    return `${prefix} ${formatPrice(minAed, currency, { compact: true })} - ${formatPrice(maxAed, currency, { compact: true })}`;
  }
  return `${prefix} ${formatPrice(minAed, currency)}`;
}

export function formatPricePerSqft(
  ppsfAed: number | null | undefined,
  currency: CurrencyCode,
): string | null {
  // Converts the per-sqft price into the active currency (formatPrice handles
  // the AED→USD rate + symbol) so it never disagrees with the headline price.
  if (!ppsfAed || !(ppsfAed > 0)) return null;
  return `${formatPrice(ppsfAed, currency)}/sqft`;
}

/**
 * Locale-aware AED/sqft label. EN matches {@link formatPricePerSqft}; AR uses
 * the unit word from `dict.format.sqft` (e.g. قدم مربعة) (#324).
 */
export function pricePerSqftLabel(
  ppsfAed: number | null | undefined,
  currency: CurrencyCode,
  dict: Dict,
): string | null {
  if (!ppsfAed || !(ppsfAed > 0)) return null;
  const price = formatPrice(ppsfAed, currency);
  const unit = dict.format.sqft.replace("{value}", "").trim() || "sqft";
  return `${price}/${unit}`;
}

export function formatSqft(min: number, max?: number): string {
  // 0 = size unknown (e.g. dev-fallback ingest units carry only PF-stated
  // facts) — render the app-wide "—" placeholder, never "0 sqft".
  // Absolute ceiling (40k = villa hard max in catalog-core #180) blocks any
  // residual absurd size that skipped the type-aware gate from rendering as
  // "1,000,000 sqft" on SERP/PDP.
  if (!(min > 0) || min > 40_000) return "—";
  const saneMax = max && max > min && max <= 40_000 ? max : undefined;
  if (saneMax) return `${min.toLocaleString()} - ${saneMax.toLocaleString()} sqft`;
  return `${min.toLocaleString()} sqft`;
}

/**
 * Locale-aware size chrome. EN matches {@link formatSqft}; AR uses
 * `dict.format.sqft` / `sqftRange` (#324).
 */
export function sqftLabel(min: number, max: number | undefined, dict: Dict): string {
  if (!(min > 0) || min > 40_000) return "—";
  const saneMax = max && max > min && max <= 40_000 ? max : undefined;
  if (saneMax) {
    return interpolate(dict.format.sqftRange, {
      min: min.toLocaleString(),
      max: saneMax.toLocaleString(),
    });
  }
  return interpolate(dict.format.sqft, { value: min.toLocaleString() });
}

/**
 * Emirate/city display label for catalog city slugs.
 * With `dict`, uses `dict.serp.cities` so AR surfaces show دبي/أبوظبي/… (#374).
 * EN dict values are byte-identical to the historical hard-coded map.
 * Without `dict` (server data / EN metadata), keeps the EN map + title-case fallback.
 */
export function cityLabel(city: string, dict?: Dict): string {
  const key = city.toLowerCase();
  if (dict) {
    const fromDict = (dict.serp.cities as Record<string, string | undefined>)[key];
    if (fromDict && key !== "all") return fromDict;
  }
  const labels: Record<string, string> = {
    dubai: "Dubai",
    "abu-dhabi": "Abu Dhabi",
    sharjah: "Sharjah",
    rak: "Ras Al Khaimah",
    ajman: "Ajman",
    "umm-al-quwain": "Umm Al Quwain",
    fujairah: "Fujairah",
    "al-ain": "Al Ain",
  };
  return labels[key] ?? city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}