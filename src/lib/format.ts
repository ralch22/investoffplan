import type { CurrencyCode } from "./types";

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

export function formatSqft(min: number, max?: number): string {
  // 0 = size unknown (e.g. dev-fallback ingest units carry only PF-stated
  // facts) — render the app-wide "—" placeholder, never "0 sqft".
  if (!(min > 0)) return "—";
  if (max && max > min) return `${min.toLocaleString()} - ${max.toLocaleString()} sqft`;
  return `${min.toLocaleString()} sqft`;
}

export function cityLabel(city: string): string {
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
  return labels[city] ?? city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}