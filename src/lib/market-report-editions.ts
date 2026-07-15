/**
 * Canonical list of published market report editions.
 *
 * One entry per quarter. Add a new entry each quarter when the edition ships.
 * The `isCurrent` flag marks the most recent edition (used to suppress "current"
 * badge on older entries). Slugs are stable SEO-friendly URLs; never rename them.
 */

export interface MarketReportEdition {
  /** URL slug — e.g. "2026-q3". Never rename after publish. */
  slug: string;
  year: number;
  /** 1–4 */
  quarter: number;
  /** Display label — e.g. "Q3 2026" */
  label: string;
  /** ISO date when this edition was published */
  publishedAt: string;
  isCurrent: boolean;
}

export const MARKET_REPORT_EDITIONS: MarketReportEdition[] = [
  {
    slug: "2026-q3",
    year: 2026,
    quarter: 3,
    label: "Q3 2026",
    publishedAt: "2026-07-15",
    isCurrent: true,
  },
];

export function getEdition(slug: string): MarketReportEdition | undefined {
  return MARKET_REPORT_EDITIONS.find((e) => e.slug === slug);
}

/** Sorted newest-first for archive listing. */
export function getAllEditions(): MarketReportEdition[] {
  return [...MARKET_REPORT_EDITIONS].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });
}
